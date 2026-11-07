import { test, expect, blank, count, ed, waitEditor, saved } from './fixtures';

const pageIds = (page: any) => ed(page, () => (window as any).__pg.pages.map((p: any) => p.pageId));

test.beforeEach(async ({ page }) => { await blank(page); });

test('F07-H1 add, duplicate, move, delete pages', async ({ page }) => {
  await page.keyboard.press('r');
  await page.getByRole('button', { name: 'Add page' }).click();
  await expect(page.getByRole('button', { name: /^Page \d$/ })).toHaveCount(2);
  await page.getByRole('button', { name: 'Page 1', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicate page' }).click();
  await expect(page.getByRole('button', { name: /^Page \d$/ })).toHaveCount(3);
  expect(await count(page)).toBe(1); // duplicate carries content
  const before = await pageIds(page);
  await page.getByRole('button', { name: 'Move page left' }).click();
  const after = await pageIds(page);
  expect(after).toEqual([before[1], before[0], before[2]]);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete page' }).click();
  await expect(page.getByRole('button', { name: /^Page \d$/ })).toHaveCount(2);
  await saved(page);
  await page.reload();
  await waitEditor(page);
  await expect(page.getByRole('button', { name: /^Page \d$/ })).toHaveCount(2);
});

test('F07-H2 undo history is per page and survives switching', async ({ page }) => {
  await page.keyboard.press('r');
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.keyboard.press('c');
  await page.getByRole('button', { name: 'Page 1', exact: true }).click();
  await expect.poll(() => count(page)).toBe(1);
  await page.keyboard.press('Control+z');
  await expect.poll(() => count(page)).toBe(0);
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect.poll(() => count(page)).toBe(1);
});

test('F07-E1 deleting the only page clears it', async ({ page }) => {
  await page.keyboard.press('r');
  await page.getByRole('button', { name: 'Delete page' }).click();
  await expect.poll(() => count(page)).toBe(0);
  await expect(page.getByRole('button', { name: /^Page \d$/ })).toHaveCount(1);
});

test('F08-H1 page backgrounds apply and persist', async ({ page }) => {
  await page.getByRole('button', { name: 'Background', exact: true }).click();
  await page.getByRole('button', { name: 'Background #2E8BC0' }).click();
  expect(await ed(page, () => (window as any).__pg.canvas.backgroundColor)).toBe('#2E8BC0');
  await page.getByRole('button', { name: 'Dusk background' }).click();
  expect(await ed(page, () => (window as any).__pg.canvas.backgroundColor.type)).toBe('linear');
  await page.getByRole('button', { name: 'Marble background' }).click();
  await expect.poll(() => ed(page, () => !!(window as any).__pg.canvas.backgroundImage)).toBe(true);
  await saved(page);
  await page.reload();
  await waitEditor(page);
  expect(await ed(page, () => !!(window as any).__pg.canvas.backgroundImage)).toBe(true);
});

test('F09-H1 resize design with content scaling', async ({ page }) => {
  await page.keyboard.press('r');
  await page.getByRole('button', { name: 'Resize' }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Width').fill('1920');
  await d.getByLabel('Height').fill('1080');
  await d.getByRole('button', { name: 'Resize' }).click();
  await expect(page.getByText('1920 × 1080 px')).toBeVisible();
  expect(await count(page)).toBe(1);
});

test('F10-H1 draw a stroke then stop drawing', async ({ page }) => {
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  const b = (await page.locator('.upper-canvas').boundingBox())!;
  await page.mouse.move(b.x + 100, b.y + 100);
  await page.mouse.down();
  for (let i = 0; i < 10; i++) await page.mouse.move(b.x + 100 + i * 20, b.y + 100 + i * 10);
  await page.mouse.up();
  await expect.poll(() => count(page)).toBe(1);
  expect(await ed(page, () => (window as any).__pg.canvas.getObjects()[0].pgKind)).toBe('drawing');
  await page.getByRole('button', { name: 'Close panel' }).click();
  expect(await ed(page, () => (window as any).__pg.canvas.isDrawingMode)).toBe(false);
});
