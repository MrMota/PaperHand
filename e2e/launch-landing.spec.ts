import { test, expect, axe, waitEditor } from './fixtures';

test('L-1 landing page passes accessibility scan and its CTA starts a design', async ({ page }) => {
  await page.goto('/#/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A design studio that leaves the making to you.');
  await expect(page.getByRole('img', { name: /Paperhand editor/ })).toBeVisible();
  await axe(page, 'landing');
  await page.getByRole('main').getByRole('link', { name: 'Start a design' }).first().click();
  await expect(page.getByRole('heading', { name: 'Make something by hand.' })).toBeVisible();
  await page.getByRole('button', { name: /^Square post/ }).click();
  await waitEditor(page);
});

test('L-2 landing page has no fake proof and no competitor name', async ({ page }) => {
  await page.goto('/#/about');
  const text = (await page.locator('body').innerText()).toLowerCase();
  for (const bad of [/\bcanva\b/, /trusted by/, /testimonial/, /users love/, /★/, /\brated\b/, /\d[\d,]* (users|designers|customers)/]) expect(text).not.toMatch(bad);
});

test('L-3 privacy and terms pages are reachable from the footer and pass the scan', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name: 'Privacy' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  for (const who of ['Our web host', 'Hugging Face', 'Stripe', 'GitHub']) await expect(page.getByText(who, { exact: true })).toBeVisible();
  await axe(page, 'privacy');
  await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name: 'Terms' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Terms' })).toBeVisible();
  await axe(page, 'terms');
});

test('L-4 social preview tags point at our own image', async ({ page }) => {
  await page.goto('/');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/\/og\.png$/);
  expect(og).not.toContain('%VITE_SITE_URL%');
  const res = await page.request.get('/og.png');
  expect(res.status()).toBe(200);
});
