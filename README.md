# Paperhand

A free design studio for making things by hand. No account, no generative AI, nothing locked, no server.

- **61 templates** across 14 formats (posts, stories, presentations, posters, flyers, thumbnails, banners, business cards, logos, invitations, resumes, certificates…)
- **100+ elements**: shapes, lines & arrows, original illustrations, photo frames, gradients, generated photos & textures
- **Text**: 18 bundled open fonts, font combinations, effects (shadow, outline, hollow, highlight, neon, glitch), spacing
- **Photos**: upload / drag & drop / paste, **on-device background removal**, filters, adjustments, crop, frames, flip
- **Editor**: multi-page, undo/redo, snapping guides, group, lock, layers, align & distribute, draw, keyboard shortcuts, autosave
- **Export**: PNG, JPG, PDF (multi-page), SVG, transparent backgrounds, up to 4× size

Everything — designs and uploads — is stored in the browser's IndexedDB on this device.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/, host anywhere
```

## Background removal

Runs in a Web Worker with [transformers.js](https://github.com/huggingface/transformers.js) (Apache-2.0):

| option | model | licence | download (once, then cached) |
| --- | --- | --- | --- |
| Any subject | `onnx-community/BiRefNet_lite-ONNX` | MIT | ~110 MB |
| People | `Xenova/modnet` | Apache-2.0 | ~25 MB |
| Plain backgrounds | built-in flood fill | — | none, works offline |

Uses WebGPU when available, WASM otherwise. If the model can't be fetched, Paperhand falls back to the offline method and tells you.

## Project notes

The `replica/` folder holds the planning docs (recon map, feature matrix, architecture, design tokens, build log).
All templates, illustrations, copy and branding are original to this project; fonts are OFL; icons are Lucide (ISC).
