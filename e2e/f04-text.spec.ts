import { test, expect, blank, count, ed, waitEditor, saved } from './fixtures';

test.beforeEach(async ({ page }) => { await blank(page); });

test('F04-H1 text formatting controls', async ({ page }) => {
  await page.keyboard.press('t');
  await expect.poll(() => count(page)).toBe(1);
  await page.getByRole('combobox', { name: 'Font' }).selectOption('Playfair Display');
  await page.getByRole('spinbutton', { name: 'Font size' }).fill('120');
  const tb = page.getByRole('toolbar', { name: 'Element tools' });
  await tb.getByRole('button', { name: /^Bold/ }).click();
  await tb.getByRole('button', { name: /^Align/ }).click();
  const t = await ed(page, () => { const a = (window as any).__pg.active; return [a.fontFamily, Math.round(a.fontSize), a.fontWeight, a.textAlign]; });
  expect(t).toEqual(['Playfair Display', 120, 400, 'right']);
});

test('F04-H2/E1 type accents and emoji, persists after reload', async ({ page }) => {
  await page.keyboard.press('t');
  await expect.poll(() => count(page)).toBe(1);
  await ed(page, () => { const a = (window as any).__pg.active; a.enterEditing(); a.selectAll(); });
  await page.keyboard.type('Café 🎨 Ünïcode');
  await page.keyboard.press('Escape');
  await saved(page);
  await page.reload();
  await waitEditor(page);
  expect(await ed(page, () => (window as any).__pg.canvas.getObjects()[0].text)).toBe('Café 🎨 Ünïcode');
});

test('F04-E2 very long pasted text wraps without crashing', async ({ page }) => {
  await ed(page, () => (window as any).__pg.addText('custom', { text: 'lorem ipsum '.repeat(170) }));
  await expect.poll(() => count(page)).toBe(1);
  const h = await ed(page, () => (window as any).__pg.active.height);
  expect(h).toBeGreaterThan(200);
});

test('F04-E3 text effects apply', async ({ page }) => {
  await page.keyboard.press('t');
  await expect.poll(() => count(page)).toBe(1);
  await page.getByRole('button', { name: 'Effects' }).click();
  await page.getByRole('button', { name: /Outline/ }).click();
  expect(await ed(page, () => (window as any).__pg.active.strokeWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Neon/ }).click();
  expect(await ed(page, () => !!(window as any).__pg.active.shadow)).toBe(true);
});

test('F04-E4 backspace while editing text does not delete the element', async ({ page }) => {
  await page.keyboard.press('t');
  await expect.poll(() => count(page)).toBe(1); // text is added after its font loads
  await ed(page, () => (window as any).__pg.active.enterEditing());
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  expect(await count(page)).toBe(1);
});
