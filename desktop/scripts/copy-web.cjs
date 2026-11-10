// Copies the built web app (../dist) into ./web for packaging.
const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', '..', 'dist');
const dest = path.join(__dirname, '..', 'web');
if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('dist/ not found: run `npm run build` (or `npx vite build`) in the project root first.');
  process.exit(1);
}
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
fs.copyFileSync(path.join(src, 'icons', 'icon-512.png'), path.join(__dirname, '..', 'icon.png'));
console.log(`copied ${src} -> ${dest}`);
