import { test, expect, blank, count, waitEditor, saved } from './fixtures';

test('F11-H1 reopen a recent design with edits', async ({ page }) => {
  await blank(page, 'Logo');
  await page.keyboard.press('c');
  await page.keyboard.press('r');
  await saved(page);
  await page.getByRole('link', { name: 'Back to home' }).click();
  await page.getByRole('link', { name: /^Logo/ }).click();
  await waitEditor(page);
  await expect.poll(() => count(page)).toBe(2);
});

test('F11-E1 rename, duplicate and delete from home', async ({ page }) => {
  await blank(page, 'Social banner');
  await saved(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Options for Social banner' }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  const dlg = page.getByRole('dialog', { name: 'Rename design' });
  await dlg.getByLabel('Name').fill('My banner');
  await dlg.getByRole('button', { name: 'Save name' }).click();
  await expect(dlg).toBeHidden();
  await expect(page.getByRole('link', { name: /^My banner/ })).toBeVisible();
  await page.getByRole('button', { name: 'Options for My banner' }).click();
  await page.getByRole('menuitem', { name: 'Make a copy' }).click();
  await expect(page.getByRole('link', { name: /My banner \(copy\)/ })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Options for My banner (copy)' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByRole('link', { name: /My banner \(copy\)/ })).toHaveCount(0);
});

test('F11-N1 unknown design id', async ({ page }) => {
  await page.goto('/#/design/doesnotexist');
  await expect(page.getByRole('heading', { name: 'We can’t find that design' })).toBeVisible();
});

test('F11-E3 edit then leave immediately: edit is kept, no errors', async ({ page }) => {
  await blank(page, 'Logo');
  await page.getByRole('button', { name: 'Elements', exact: true }).click();
  await page.getByRole('button', { name: 'Add Star', exact: true }).click();
  await page.getByRole('link', { name: 'Back to home' }).click(); // well inside the 700 ms autosave debounce
  await page.getByRole('link', { name: /^Logo/ }).click();
  await waitEditor(page);
  await expect.poll(() => count(page)).toBe(1);
});

test('F11-E2 two tabs: a save in one tab is not overwritten by a stale copy in the other', async ({ page, context }) => {
  await blank(page, 'Logo');
  const url = page.url();
  const tab2 = await context.newPage();
  await tab2.goto(url);
  await waitEditor(tab2);
  await tab2.keyboard.press('c');
  await expect(tab2.getByText('Saved', { exact: true })).toBeVisible();
  await tab2.waitForTimeout(1000);
  await page.keyboard.press('r');
  await saved(page);
  await page.waitForTimeout(500);
  await page.reload();
  await waitEditor(page);
  await expect.poll(() => count(page)).toBe(2); // circle from tab 2 + rectangle from tab 1
  await tab2.close();
});
