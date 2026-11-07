import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Writes dist/sw.js with the list of files to precache, after everything else is in dist/. */
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'paperhand-sw',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const files: string[] = [];
      const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(relative(outDir, p).split('\\').join('/')); });
      walk(outDir);
      // Skip the 26 MB engine (cached on first use), social-only images and the worker itself.
      const precache = files.filter((f) => !/\.wasm$|\.woff$|^og\.png$|^screens\/|^icons\/icon-1024|^sw\.js$/.test(f)).sort();
      const hash = createHash('sha256');
      precache.forEach((f) => hash.update(f).update(readFileSync(join(outDir, f))));
      const version = hash.digest('hex').slice(0, 12);
      const list = JSON.stringify(precache.map((f) => (f === 'index.html' ? './index.html' : `./${f}`)).concat('./'));
      const src = readFileSync('src/sw-template.js', 'utf8').split('__VERSION__').join(version).split('__PRECACHE__').join(list);
      if (/__[A-Z]+__/.test(src)) throw new Error('sw.js: unreplaced placeholder');
      writeFileSync(join(outDir, 'sw.js'), src);
      this.info?.(`sw.js: ${precache.length} files precached, version ${version}`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  build: { chunkSizeWarningLimit: 2000, target: 'es2022' },
  worker: { format: 'es' },
});
