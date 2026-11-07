import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Fixtures = { errors: string[]; allowErrors: (re: RegExp) => void };

export const test = base.extend<Fixtures & { page: Page }>({
  errors: async ({}, use) => { await use([]); },
  allowErrors: async ({}, use) => { await use(() => {}); },
  page: async ({ page }, use, info) => {
    const errors: string[] = [];
    const allowed: RegExp[] = [];
    (page as any).__allow = (re: RegExp) => allowed.push(re);
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('response', (r) => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`); });
    await use(page);
    const real = errors.filter((e) => !allowed.some((re) => re.test(e)));
    expect(real, `console errors in ${info.title}`).toEqual([]);
  },
});
export { expect };

export const allow = (page: Page, re: RegExp) => (page as any).__allow(re);

export async function axe(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).disableRules(['region']).exclude('.canvas-container').analyze();
  const serious = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${label}: ${v.id} (${v.nodes.length}) ${v.help}`)).toEqual([]);
}

/** Read state from the live editor (test hook set in EditorView). */
export const ed = <T>(page: Page, fn: (e: any) => T) => page.evaluate(fn as any) as Promise<T>;
export const count = (page: Page) => page.evaluate(() => (window as any).__pg.canvas.getObjects().length) as Promise<number>;

export async function waitEditor(page: Page) {
  await page.waitForFunction(() => !!(window as any).__pg && document.querySelector('.upper-canvas'));
  // the key listener is attached in an effect after the toolbar renders
  await page.getByRole('toolbar').waitFor();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

export async function openTemplate(page: Page, title: string) {
  await page.goto('/#/templates');
  await page.getByRole('button', { name: title, exact: true }).click();
  await waitEditor(page);
  await page.waitForURL(/#\/design\//);
}

export async function blank(page: Page, preset = 'Square post') {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(`^${preset}`) }).click();
  await waitEditor(page);
}

/** Wait until autosave has written to IndexedDB. */
export async function saved(page: Page) {
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.waitForTimeout(150);
}

export function pngFile(color = '#3A7CA5', fg = '#E4572E') {
  // 60×40 PNG made in Node without deps: use a tiny pre-rendered data URL via the browser instead
  return { color, fg };
}

export async function makePng(page: Page, path: string, bg = '#3A7CA5', fg = '#E4572E') {
  const b64 = await page.evaluate(([bg, fg]) => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const x = c.getContext('2d')!;
    x.fillStyle = bg; x.fillRect(0, 0, 600, 400); x.fillStyle = fg; x.beginPath(); x.arc(300, 200, 120, 0, 7); x.fill();
    return c.toDataURL('image/png').split(',')[1];
  }, [bg, fg]);
  const fs = await import('node:fs');
  fs.writeFileSync(path, Buffer.from(b64, 'base64'));
  return path;
}
