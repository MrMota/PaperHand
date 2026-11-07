import { test, expect, blank, openTemplate } from './fixtures';
import fs from 'node:fs';

async function download(page: any, format: string, opts: { transparent?: boolean; size?: string } = {}) {
  await page.getByRole('button', { name: 'Download' }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('File type').selectOption(format);
  if (opts.transparent) await d.getByLabel('Transparent background').check();
  if (opts.size) await d.getByRole('slider').first().fill(opts.size);
  const [dl] = await Promise.all([page.waitForEvent('download'), d.getByRole('button', { name: 'Download' }).click()]);
  return dl;
}
const pngInfo = (buf: Buffer) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

test('F12-H1 JPG, multi-page PDF and SVG', async ({ page }) => {
  await openTemplate(page, 'Pitch deck — warm');
  const jpg = await download(page, 'jpg', {});
  expect(jpg.suggestedFilename()).toMatch(/\.jpg$/);
  await page.waitForTimeout(2000);
  const pdf = await download(page, 'pdf');
  const pdfBuf = fs.readFileSync(await pdf.path());
  expect(pdfBuf.subarray(0, 4).toString()).toBe('%PDF');
  expect((pdfBuf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length).toBe(4);
  const svg = await download(page, 'svg');
  expect(fs.readFileSync(await svg.path(), 'utf8')).toContain('<svg');
});

test('F12-E1/E2 transparent PNG at 2×', async ({ page }) => {
  await blank(page, 'Logo');
  await page.keyboard.press('c');
  const dl = await download(page, 'png', { transparent: true, size: '2' });
  const buf = fs.readFileSync(await dl.path());
  expect(pngInfo(buf)).toEqual({ w: 1600, h: 1600 });
  const alpha = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d')!; x.drawImage(img, 0, 0);
    return [x.getImageData(5, 5, 1, 1).data[3], x.getImageData(800, 800, 1, 1).data[3]];
  }, buf.toString('base64'));
  expect(alpha).toEqual([0, 255]);
});
