import { test, expect, axe, waitEditor, openTemplate, saved, count } from './fixtures';

test('F01-H1 template opens in editor with its content', async ({ page }) => {
  await openTemplate(page, 'Summer sale');
  await expect(page.getByRole('textbox', { name: 'Design title' })).toHaveValue('Summer sale');
  expect(await count(page)).toBeGreaterThan(4);
});

test('F01-H2 download PNG named after the design', async ({ page }) => {
  await openTemplate(page, 'Garden thought');
  await page.getByRole('button', { name: 'Download' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByRole('button', { name: 'Download' }).click()]);
  expect(dl.suggestedFilename()).toBe('Garden-thought.png');
});

test('F01-E1 double-clicking a template creates one design', async ({ page }) => {
  await page.goto('/#/templates');
  await page.getByRole('button', { name: 'Flash sale pink', exact: true }).dblclick();
  await waitEditor(page);
  await saved(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Flash sale pink/ })).toHaveCount(1);
});

test('F01-E2 refresh keeps the design', async ({ page }) => {
  await openTemplate(page, 'Bold statement');
  const n = await count(page);
  await page.reload();
  await waitEditor(page);
  expect(await count(page)).toBe(n);
});

test('F01-E3 back button returns home and lists the design', async ({ page }) => {
  await openTemplate(page, 'Night owl quote');
  await saved(page);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'All templates' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Night owl quote/ })).toBeVisible();
});

test('F01-E4 mobile width fits the canvas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTemplate(page, 'Three habits');
  const box = (await page.locator('.page-frame').boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(390);
  expect(box.x).toBeGreaterThanOrEqual(0);
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(390);
});

test('F01-E5 keyboard only: tab to a template and open it', async ({ page }) => {
  await page.goto('/#/templates');
  const card = page.getByRole('button', { name: 'Mountain escape', exact: true });
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press('Enter');
  await waitEditor(page);
});

test('F01-E6 accessibility: home, templates, editor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Make something by hand.' }).waitFor();
  await axe(page, 'home');
  await page.goto('/#/templates');
  await axe(page, 'templates');
  await openTemplate(page, 'Summer sale');
  await axe(page, 'editor');
});
