import { test, expect, blank, count, ed } from './fixtures';

test.beforeEach(async ({ page }) => { await blank(page); await page.getByRole('button', { name: 'Elements', exact: true }).click(); });

test('F03-H1/H2 add shape, undo, redo', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Star', exact: true }).click();
  expect(await count(page)).toBe(1);
  await expect(page.getByRole('toolbar', { name: 'Element tools' })).toBeVisible();
  await page.getByRole('button', { name: /^Undo/ }).click();
  await expect.poll(() => count(page)).toBe(0);
  await page.getByRole('button', { name: /^Redo/ }).click();
  await expect.poll(() => count(page)).toBe(1);
});

test('F03-H3 duplicate and delete', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Heart', exact: true }).first().click();
  await page.keyboard.press('Control+d');
  await expect.poll(() => count(page)).toBe(2);
  await page.keyboard.press('Delete');
  await expect.poll(() => count(page)).toBe(1);
});

test('F03-H4 group and ungroup', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Circle', exact: true }).click();
  await page.getByRole('button', { name: 'Add Square', exact: true }).click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Control+g');
  await expect.poll(() => count(page)).toBe(1);
  await page.keyboard.press('Control+Shift+g');
  await expect.poll(() => count(page)).toBe(2);
});

test('F03-H5 locked elements cannot be deleted', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Hexagon', exact: true }).click();
  await page.getByRole('button', { name: 'Lock', exact: true }).click();
  await page.keyboard.press('Delete');
  expect(await count(page)).toBe(1);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await page.keyboard.press('Delete');
  await expect.poll(() => count(page)).toBe(0);
});

test('F03-H6 copy/paste offsets the copy', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Diamond', exact: true }).click();
  await page.keyboard.press('Control+c');
  await page.keyboard.press('Control+v');
  await expect.poll(() => count(page)).toBe(2);
  const [a, b] = await ed(page, () => (window as any).__pg.canvas.getObjects().map((o: any) => o.left));
  expect(b - a).toBe(24);
});

test('F03-H7 align to page centre', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Triangle', exact: true }).click();
  await ed(page, () => { const e = (window as any).__pg; e.active.set({ left: 10 }); e.active.setCoords(); });
  await page.getByRole('button', { name: 'Position' }).click();
  await page.getByRole('button', { name: 'Centre' }).click();
  const c = await ed(page, () => { const e = (window as any).__pg; const r = e.active.getBoundingRect(); return r.left + r.width / 2; });
  expect(Math.round(c)).toBe(540);
});

test('F03-E1 search with no results', async ({ page }) => {
  await page.getByRole('searchbox', { name: /Search shapes/ }).fill('zzzz');
  await expect(page.getByText('Nothing matches “zzzz”.')).toBeVisible();
});

test('F03-E3 context menu duplicate', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Pentagon', exact: true }).click();
  const box = (await page.locator('.upper-canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
  await page.getByRole('menuitem', { name: /Duplicate/ }).click();
  await expect.poll(() => count(page)).toBe(2);
});

test('F03-E4 arrow keys nudge', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Octagon', exact: true }).click();
  const x0 = await ed(page, () => (window as any).__pg.active.left);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  expect(await ed(page, () => (window as any).__pg.active.left)).toBeCloseTo(x0 + 11);
});

test('F03-E5 layers panel hide, lock and order', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Circle', exact: true }).click();
  await page.getByRole('button', { name: 'Add Square', exact: true }).click();
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await page.getByRole('button', { name: 'Hide Circle' }).click();
  expect(await ed(page, () => (window as any).__pg.canvas.getObjects()[0].visible)).toBe(false);
  await page.getByRole('button', { name: 'Lock Circle' }).click();
  expect(await ed(page, () => (window as any).__pg.canvas.getObjects()[0].pgLocked)).toBe(true);
});

test('F03-E2 dragging near the page centre snaps exactly to it', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Square', exact: true }).click();
  await ed(page, () => { const e = (window as any).__pg; e.active.set({ left: 100, top: 100 }); e.active.setCoords(); e.canvas.requestRenderAll(); });
  const cb = (await page.locator('.upper-canvas').boundingBox())!;
  const { z, s } = await ed(page, () => ({ z: (window as any).__pg.zoom, s: (window as any).__pg.active.getScaledWidth() }));
  await page.mouse.move(cb.x + (100 + s / 2) * z, cb.y + (100 + s / 2) * z);
  await page.mouse.down();
  await page.mouse.move(cb.x + 536 * z, cb.y + 300 * z, { steps: 12 });
  const guide = await ed(page, () => (window as any).__pg.guides.v);
  await page.mouse.up();
  const c = await ed(page, () => { const r = (window as any).__pg.active.getBoundingRect(); return r.left + r.width / 2; });
  expect(Math.round(c)).toBe(540);
  expect(guide).toEqual([540]);
});
