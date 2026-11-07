import { test, expect, blank, count, ed, makePng, waitEditor, saved, allow } from './fixtures';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const tmp = (n: string) => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pg-')), n);

async function uploadAndAdd(page: any) {
  const file = await makePng(page, tmp('photo.png'));
  await page.getByRole('button', { name: 'Uploads', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('button', { name: 'Add photo.png' }).first().click();
  await expect.poll(() => count(page)).toBe(1);
}
const cornerAlpha = (page: any) => ed(page, () => {
  const el = (window as any).__pg.active.getElement(); const c = document.createElement('canvas'); c.width = el.width; c.height = el.height;
  const x = c.getContext('2d')!; x.drawImage(el, 0, 0); return [x.getImageData(2, 2, 1, 1).data[3], x.getImageData(el.width / 2, el.height / 2, 1, 1).data[3]];
});

test.beforeEach(async ({ page }) => { await blank(page); });

test('F05-H1/E1 upload, add, and the upload persists', async ({ page }) => {
  await uploadAndAdd(page);
  await page.reload();
  await waitEditor(page);
  await page.getByRole('button', { name: 'Uploads', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add photo.png' }).first()).toBeVisible();
});

test('F05-H2 remove plain background and restore', async ({ page }) => {
  await uploadAndAdd(page);
  await page.getByRole('button', { name: 'Edit photo' }).click();
  await page.getByLabel('Method').selectOption('color');
  await page.getByRole('button', { name: 'Remove background' }).click();
  await expect(page.getByRole('button', { name: 'Restore original' })).toBeVisible();
  expect(await cornerAlpha(page)).toEqual([0, 255]);
  await page.getByRole('button', { name: 'Restore original' }).click();
  await expect.poll(() => cornerAlpha(page)).toEqual([255, 255]);
});

test('F05-E2 AI method falls back when the model host is unreachable', async ({ page }) => {
  allow(page, /huggingface|Failed to load resource|ERR_|net::/i);
  await page.route(/huggingface\.co|hf\.co/, (r) => r.abort());
  await uploadAndAdd(page);
  await page.getByRole('button', { name: 'Edit photo' }).click();
  await page.getByRole('button', { name: 'Remove background' }).click();
  await expect(page.getByText(/Used colour-based removal instead/)).toBeVisible({ timeout: 45_000 });
  expect((await cornerAlpha(page))[0]).toBe(0);
});

test('F05-N1 non-image upload shows an error', async ({ page }) => {
  const f = tmp('notes.txt'); fs.writeFileSync(f, 'hello');
  await page.getByRole('button', { name: 'Uploads', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(f);
  await expect(page.getByText('“notes.txt” is not an image')).toBeVisible();
  expect(await count(page)).toBe(0);
});

test('F05-E5 drop a file onto the page', async ({ page }) => {
  const file = await makePng(page, tmp('dropped.png'));
  const b64 = fs.readFileSync(file).toString('base64');
  const dt = await page.evaluateHandle((b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const d = new DataTransfer(); d.items.add(new File([bin], 'dropped.png', { type: 'image/png' })); return d;
  }, b64);
  await page.locator('.stage').dispatchEvent('drop', { dataTransfer: dt });
  await expect.poll(() => count(page)).toBe(1);
  await saved(page);
});

test('F06-H1/H2 filter and adjustment persist', async ({ page }) => {
  await uploadAndAdd(page);
  await page.getByRole('button', { name: 'Edit photo' }).click();
  await page.getByRole('tab', { name: 'Filters' }).click();
  await page.getByRole('button', { name: 'Mono' }).click();
  await page.getByRole('tab', { name: 'Adjust' }).click();
  await page.getByRole('slider', { name: 'Brightness' }).fill('40');
  await saved(page);
  await page.reload();
  await waitEditor(page);
  const r = await ed(page, () => { const o = (window as any).__pg.canvas.getObjects()[0]; return [o.pgFilter, o.pgAdjust?.brightness, o.filters.length]; });
  expect(r).toEqual(['Mono', 40, 2]);
});

test('F06-H3/H4 crop, frame and flip', async ({ page }) => {
  await uploadAndAdd(page);
  const w0 = await ed(page, () => (window as any).__pg.active.getScaledWidth());
  await page.getByRole('button', { name: 'Crop' }).click();
  await page.getByRole('complementary', { name: 'Panel' }).getByRole('slider', { name: 'Zoom' }).fill('2');
  const r = await ed(page, () => { const a = (window as any).__pg.active; return [a.getScaledWidth(), a.cropX > 0]; });
  expect(Math.round(r[0] as number)).toBe(Math.round(w0));
  expect(r[1]).toBe(true);
  await page.getByRole('button', { name: 'Circle frame' }).click();
  expect(await ed(page, () => !!(window as any).__pg.active.clipPath)).toBe(true);
  await page.getByRole('button', { name: 'Flip horizontal' }).click();
  expect(await ed(page, () => (window as any).__pg.active.flipX)).toBe(true);
});

test('F06-E1 frame then upload fills the frame', async ({ page }) => {
  await page.getByRole('button', { name: 'Elements', exact: true }).click();
  await page.getByRole('button', { name: 'Add Heart frame' }).click();
  const w0 = await ed(page, () => (window as any).__pg.active.getScaledWidth());
  await uploadAndAdd(page);
  const r = await ed(page, () => { const a = (window as any).__pg.active; return [a.getScaledWidth(), a.pgFrame, (window as any).__pg.canvas.getObjects().length]; });
  expect(Math.round(r[0] as number)).toBe(Math.round(w0));
  expect(r.slice(1)).toEqual(['heart', 1]);
});
