import { test, expect, blank, saved, makePng, count, waitEditor } from './fixtures';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = (n: string) => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pg-')), n);
const designLinks = (page: any) => page.locator('.dcard-link');

test('F13-H1 download a design file and open it again as a separate copy', async ({ page }) => {
  await blank(page, 'Logo');
  await page.keyboard.press('c');
  await page.keyboard.press('r');
  await saved(page);
  await page.getByRole('button', { name: 'Download' }).click();
  await page.getByRole('dialog').getByLabel('File type').selectOption('paperhand');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByRole('button', { name: 'Download' }).click()]);
  expect(dl.suggestedFilename()).toBe('Logo.paperhand');
  const file = tmp('Logo.paperhand'); await dl.saveAs(file);
  await page.goto('/');
  await page.getByLabel('Open a design file').setInputFiles(file);
  await expect(page.getByText('Opened “Logo.paperhand”')).toBeVisible();
  await expect(designLinks(page)).toHaveCount(2);
  await designLinks(page).first().click();
  await waitEditor(page);
  await expect.poll(() => count(page)).toBe(2);
});

test('F13-H2 back up everything, delete everything, restore', async ({ page }) => {
  await blank(page, 'Story');
  await page.keyboard.press('t');
  await saved(page);
  await page.getByRole('button', { name: 'Uploads', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(await makePng(page, tmp('pic.png')));
  await expect(page.getByRole('button', { name: 'Add pic.png' })).toBeVisible();
  await page.goto('/');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Back up everything' }).click()]);
  const file = tmp('backup.paperhand'); await dl.saveAs(file);
  await expect(page.getByText('Backed up 1 design and 1 upload')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByText('Your designs will live here.')).toBeVisible();
  await page.getByLabel('Open a design file').setInputFiles(file);
  await expect(page.getByText('Added 1 design and 1 upload')).toBeVisible();
  await expect(designLinks(page)).toHaveCount(1);
});

test('F13-N1 a file that is not a Paperhand file is refused', async ({ page }) => {
  const f = tmp('notes.paperhand'); fs.writeFileSync(f, '{"hello": "world"}');
  await page.goto('/');
  await page.getByLabel('Open a design file').setInputFiles(f);
  await expect(page.getByText('“notes.paperhand” isn’t a Paperhand file')).toBeVisible();
  await expect(page.getByText('Your designs will live here.')).toBeVisible();
});
