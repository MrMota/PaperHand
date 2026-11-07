# Architecture: Pigment

No login and no payments means **no backend**. Pigment is a static single-page
app; every design, upload and preference lives in the browser (IndexedDB).
It can be hosted on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## Stack

| layer | choice | why |
| --- | --- | --- |
| build | Vite + TypeScript | fast, zero-config static output |
| UI | React 18 | component model for panels/toolbars |
| canvas engine | Fabric.js 7 | battle-tested selection, transforms, text editing, filters, SVG/JSON serialisation |
| styling | plain CSS with custom-property tokens (`src/styles/tokens.css`) | no build plugin; tokens from replica-design |
| icons | lucide-react (ISC) | open icon set, never the original's icons |
| fonts | @fontsource/* (OFL), bundled | works offline, no third-party requests |
| storage | idb-keyval over IndexedDB | designs + uploads can be MBs; localStorage is 5 MB |
| PDF | jsPDF | multi-page PDF from rendered pages |
| background removal | @huggingface/transformers (Apache-2.0) running an MIT/Apache segmentation model on-device via WebGPU/WASM, lazy-loaded; plus an offline colour-key + flood-fill fallback | no server, no API key, private |
| hosting | any static host | `npm run build` → `dist/` |

## "Schema" (IndexedDB, key-value)

```
designs:index            -> DesignMeta[]   {id, title, width, height, updatedAt, thumb}
design:<id>              -> Design         {id, title, width, height, pages: PageJSON[]}
uploads:index            -> UploadMeta[]   {id, name, width, height, createdAt}
upload:<id>              -> Blob
```
PageJSON = Fabric canvas JSON (`toObject` with custom props: id, name, locked, pgKind).
Templates are TypeScript factories producing PageJSON at the template's size, so they scale cleanly.

## "API" (internal modules)

| module | functions | flow |
| --- | --- | --- |
| `store/designs.ts` | listDesigns, loadDesign, saveDesign, deleteDesign, duplicateDesign | F02, F11 |
| `store/uploads.ts` | listUploads, addUpload, getUploadURL, deleteUpload | F05 |
| `editor/Editor.ts` | page switching, history, clipboard, add*/align/order/group, zoom | F03, F04, F07 |
| `editor/export.ts` | exportPNG/JPG/SVG/PDF | F12 |
| `bg/removeBackground.ts` | removeBackground(img, mode) | F05 |
| `content/templates.ts`, `content/elements.ts` | catalogues | F01, F03 |

## Parts that bite
- **Fonts at export / load**: await `document.fonts.load` before rendering text.
- **Big images**: downscale uploads to max 2400px for editing; keep original blob.
- **Storage quota**: catch `QuotaExceededError`, toast.
- **Undo history memory**: cap at 60 snapshots per page.
- **BG model download (~40–170MB)**: show progress, cache via browser Cache API (transformers.js does this), fallback offline.

## Build order
1. Shell + vertical slice: home → blank design → add text/shape → download PNG.
2. Must-haves: templates, elements, uploads, photo edit + BG removal, pages, autosave, export formats.
3. Should/could: snapping, draw, resize, crop, layers, context menu, mobile.
