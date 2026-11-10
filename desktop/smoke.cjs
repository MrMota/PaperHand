// Smoke test for the desktop app: launches it, makes a design, downloads a PNG.
//   node smoke.cjs                      → runs the app from this folder (after `npm run prepare-web`)
//   node smoke.cjs path/to/Paperhand.exe → runs a packaged build
// Needs Playwright (installed in the project root).
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { _electron } = require(require.resolve('playwright', { paths: [path.join(__dirname, '..')] }));

(async () => {
  const exe = process.argv[2];
  const downloads = fs.mkdtempSync(path.join(os.tmpdir(), 'paperhand-dl-'));
  const env = { ...process.env, PAPERHAND_TEST_DOWNLOAD_DIR: downloads };
  const app = exe
    ? await _electron.launch({ executablePath: path.resolve(exe), env })
    : await _electron.launch({ executablePath: require(path.join(__dirname, 'node_modules', 'electron')), args: [path.join(__dirname, 'main.cjs')], env });
  const errors = [];
  const win = await app.firstWindow();
  win.on('pageerror', (e) => errors.push(e.message));
  win.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const step = (s) => console.log('✓', s);

  await win.waitForLoadState('domcontentloaded');
  await win.getByRole('heading', { name: 'Make something by hand.' }).waitFor({ timeout: 30000 });
  step(`home screen (${await win.title()}) at ${win.url()}`);
  if (!(await win.evaluate(() => !!window.paperhandDesktop))) throw new Error('preload did not run');
  if (await win.evaluate(() => typeof require !== 'undefined' || typeof process !== 'undefined')) throw new Error('Node is exposed to the page');
  step('preload ran, no Node access in the page');

  await win.getByRole('button', { name: /^Square post/ }).click();
  await win.getByRole('toolbar').waitFor();
  await win.waitForFunction(() => !!window.__pg);
  await win.keyboard.press('r');
  await win.waitForFunction(() => window.__pg.canvas.getObjects().length === 1);
  step('editor opens, shape added');

  await win.getByRole('button', { name: 'Download' }).click();
  await win.getByRole('dialog').getByRole('button', { name: 'Download' }).click();
  const deadline = Date.now() + 20000;
  let png;
  while (Date.now() < deadline && !(png = fs.readdirSync(downloads).find((f) => f.endsWith('.png')))) await new Promise((r) => setTimeout(r, 250));
  if (!png) throw new Error('PNG download did not arrive');
  const head = fs.readFileSync(path.join(downloads, png)).subarray(0, 8).toString('hex');
  if (head !== '89504e470d0a1a0a') throw new Error('downloaded file is not a PNG');
  step(`download saved: ${png}`);

  await win.evaluate(() => (location.hash = '/'));
  await win.getByRole('link', { name: /^Square post/ }).first().waitFor();
  step('design listed in recent designs');

  // The background remover runs in a module worker served from app://. Start it and make sure it answers.
  const workerUrl = await win.evaluate(() => {
    const w = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/worker-[^/]+\.js$/.test(n));
    return w ?? null;
  });
  const worker = await win.evaluate(async (fallback) => {
    const html = await (await fetch('index.html')).text();
    void html;
    const assets = await (await fetch('sw.js')).text().catch(() => '');
    const name = (assets.match(/assets\/worker-[^"']+\.js/) || [])[0] || fallback;
    if (!name) return 'worker file not found';
    return await new Promise((resolve) => {
      const w = new Worker(new URL(name, location.href), { type: 'module' });
      const done = (r) => { w.terminate(); resolve(r); };
      w.onerror = (e) => done('worker failed to start: ' + (e.message || 'error'));
      w.onmessage = (e) => done('answered: ' + e.data.type + (e.data.message ? ' (' + String(e.data.message).slice(0, 80) + ')' : ''));
      const c = document.createElement('canvas'); c.width = c.height = 8;
      w.postMessage({ id: 1, src: c.toDataURL(), kind: 'portrait' });
      setTimeout(() => done('no answer in 60s'), 60000);
    });
  }, workerUrl);
  if (!worker.startsWith('answered')) throw new Error('background-removal worker: ' + worker);
  step(`background-removal worker ${worker}`);

  const real = errors.filter((e) => !/Autofill|DevTools/.test(e));
  if (real.length) throw new Error('console errors:\n' + real.join('\n'));
  step('no console errors');
  await app.close();
  console.log('SMOKE TEST PASSED');
})().catch((e) => { console.error('SMOKE TEST FAILED:', e.message); process.exit(1); });
