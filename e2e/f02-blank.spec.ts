import { test, expect, blank, waitEditor, ed } from './fixtures';

test('F02-H1 preset creates a blank page at that size', async ({ page }) => {
  await blank(page, 'Story');
  expect(await ed(page, () => [(window as any).__pg.width, (window as any).__pg.height])).toEqual([1080, 1920]);
  expect(await ed(page, () => (window as any).__pg.canvas.getObjects().length)).toBe(0);
});

test('F02-H2 custom size in px', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a design' }).click();
  const d = page.getByRole('dialog', { name: 'Custom size' });
  await d.getByLabel('Width').fill('800');
  await d.getByLabel('Height').fill('600');
  await d.getByRole('button', { name: 'Create new design' }).click();
  await waitEditor(page);
  await expect(page.getByText('800 × 600 px')).toBeVisible();
});

test('F02-E1 inches convert to px', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Custom size/ }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Unit').selectOption('in');
  await d.getByLabel('Width').fill('4');
  await d.getByLabel('Height').fill('6');
  await expect(d.getByText('384 × 576 px')).toBeVisible();
});

test('F02-N1 out-of-range sizes are rejected', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a design' }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Width').fill('0');
  await expect(d.getByRole('alert')).toContainText('at least 40');
  await expect(d.getByRole('button', { name: 'Create new design' })).toBeDisabled();
  await d.getByLabel('Width').fill('9000');
  await expect(d.getByRole('alert')).toContainText('under 8000');
});

test('F02-E2 empty input is rejected', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a design' }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Height').fill('');
  await expect(d.getByRole('button', { name: 'Create new design' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
});
