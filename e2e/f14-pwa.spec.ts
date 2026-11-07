import { test, expect, waitEditor, count, allow } from './fixtures';

test('F14-H1 manifest is valid and icons load', async ({ page }) => {
  const res = await page.request.get('/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.name).toBe('Paperhand');
  expect(m.display).toBe('standalone');
  for (const icon of m.icons) expect((await page.request.get('/' + icon.src)).status()).toBe(200);
  expect(m.icons.some((i: any) => i.purpose === 'maskable')).toBe(true);
});

test('F14-H2 after one visit the app works fully offline', async ({ page, context }) => {
  // Offline, the browser logs the network attempts it makes before the app falls back to its cache.
  allow(page, /Failed to load resource: net::ERR_(FAILED|INTERNET_DISCONNECTED)/);
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); // the service worker now controls the page
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Make something by hand.' })).toBeVisible();
  await page.getByRole('button', { name: /^Square post/ }).click();
  await waitEditor(page);
  await page.keyboard.press('t');
  await expect.poll(() => count(page)).toBe(1);
  // the bundled font is available offline, so the heading did not fall back to a system font
  expect(await page.evaluate(() => document.fonts.check('700 40px Inter'))).toBe(true);
  // a font never used before going offline still loads (Chromium can skip the service worker for @font-face)
  await page.getByRole('combobox', { name: 'Font' }).selectOption('Anton');
  // measure what is drawn: condensed Anton is far narrower than the fallback sans-serif
  const width = (font: string) => page.evaluate((font) => { const c = document.createElement('canvas').getContext('2d')!; c.font = font; return c.measureText('HELLO WORLD').width; }, font);
  const fallback = await width('400 40px sans-serif');
  await expect.poll(() => width('400 40px "Anton", sans-serif')).toBeLessThan(fallback * 0.8);
  await page.getByRole('button', { name: 'Download' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByRole('button', { name: 'Download' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/\.png$/);
  await context.setOffline(false);
});
