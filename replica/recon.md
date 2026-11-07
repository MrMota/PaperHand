# Recon map: Canva (web) → "Pigment"

Clean-room study of **what the product does and how a user moves through it**.
Nothing here is copied from Canva's code, assets, templates, copy or brand.
Sources are public pages only; no account was used. Reference screenshots
(if any are added) live in `replica/screens/` and never ship.

## 1. Scope

| question | answer |
| --- | --- |
| app / platform | Canva, web editor (desktop browser first, usable on tablet/phone width) |
| slice | The core loop: **pick a size or template → edit on a canvas with elements, text, photos, uploads → apply effects (incl. background removal) → download**. Plus the home screen with recent designs. |
| explicitly out | Login, accounts, teams, payments/Pro gating, cloud sync, real-time collaboration, print ordering, video timeline, AI image generation, stock library |
| audience | The repo owner's own free, local-first design tool. Everything runs in the browser, designs saved in IndexedDB. |

## 2. Sources

| source | URL | what it gives |
| --- | --- | --- |
| Marketing home | https://www.canva.com/ | positioning: "design anything", core loop in their words |
| Templates gallery | https://www.canva.com/templates/ | template categories & formats (social post, story, poster, presentation, flyer, logo, resume, invitation, YouTube thumbnail, business card) |
| Help center: editor basics | https://www.canva.com/help/ | element types, positioning, layers, grouping, alignment, lock, transparency |
| Help: background remover | https://www.canva.com/help/background-remover/ | BG removal is one click on a selected image, Pro-gated, has an erase/restore brush |
| Help: download designs | https://www.canva.com/help/download-or-purchase/ | export formats PNG, JPG, PDF, SVG; transparent bg; size multiplier; page selection |
| Help: keyboard shortcuts | https://www.canva.com/help/keyboard-shortcuts/ | T text, R rectangle, C circle, L line, Ctrl+D duplicate, Ctrl+G group, Ctrl+] forward, arrows nudge |
| Pricing | https://www.canva.com/pricing/ | gated features = important: BG remover, Magic Resize, brand kit, premium elements, transparent PNG, SVG export |
| Feature pages (photo editor, resize) | https://www.canva.com/features/ | photo filters & adjustments, resize to another format |
| Public walkthrough videos | YouTube "Canva tutorial for beginners" | click-by-click flows: side panel → drag → floating toolbar → download |

## 3. Screen inventory

| ID | screen | route / how | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | `/` | start a design, open recent ones | top bar, search, size presets row, template grid, recent designs grid, custom size dialog | empty (no recents), filled, search no-results, mobile |
| S02 | Template gallery | `/templates` (or "See all" on home) | browse/filter templates by format | category chips, search, template cards with live thumbnails | filled, filtered, no results |
| S03 | Custom size dialog | modal on S01 | create a blank design of W×H in px/in/mm | number inputs, unit select, presets | valid, invalid (0 or > max) |
| S04 | Editor | `/design/:id` | edit a design | header (file menu, undo/redo, title, resize, download), left icon rail + side panel, contextual top toolbar, canvas with zoom, pages strip, footer (zoom, page count) | loading, empty page, filled, element selected (text / shape / image / group / multi), cropping, saving/saved, mobile (panel as bottom sheet) |
| S05 | Side panel: Templates | rail tab in S04 | apply a template to current page | search, category chips, template grid | filled, no results |
| S06 | Side panel: Elements | rail tab | add shapes, lines, frames, graphics, gradients, stickers | search, sections (shapes, lines, frames, graphics, stickers, gradients), "see all" | filled, search results, no results |
| S07 | Side panel: Text | rail tab | add heading/subheading/body and pre-styled font combos | big buttons, text-style combos grid | filled |
| S08 | Side panel: Uploads | rail tab | upload own images (drag & drop) and reuse them | dropzone, upload button, image grid | empty, uploading, filled, error (not an image / too large) |
| S09 | Side panel: Photos | rail tab | add photos | grid | (stock is licensed → replaced by user uploads + generated placeholder photos) |
| S10 | Side panel: Draw | rail tab | freehand brush | brush type, colour, size | drawing on/off |
| S11 | Side panel: Background | rail tab | page background colour / gradient / image | swatches, gradient presets, colour picker | |
| S12 | Side panel: Layers / Position | toolbar "Position" | reorder, align to page, exact x/y/w/h/rotation | layer list (drag to reorder), align buttons, numeric inputs | |
| S13 | Side panel: Edit photo / Effects | toolbar "Edit photo" on image | BG removal, filters, adjustments (brightness, contrast, saturation, blur…), flip | filter thumbnails, sliders, BG remove button with progress | idle, processing, done, failed |
| S14 | Colour picker | popover from toolbar | pick fill/text colour | document colours, default palette, hex input, eyedropper (browser support) | |
| S15 | Download dialog | header "Share → Download" | export | file type (PNG/JPG/PDF/SVG), size ×, transparent bg, pages | idle, exporting, done |
| S16 | Resize dialog | header "Resize" | change canvas size, optionally scale content | preset list, custom W×H, "scale content" toggle | |
| S17 | Shortcuts dialog | `?` | list keyboard shortcuts | table | |

## 4. User flows

```
F01 Start from a template and download
    S01 home → click template card → S04 editor (template applied) → double-click text → type
    → S15 download PNG
    happy path: 5 clicks. Number to beat: 4.
    edge: template bigger than viewport (auto-fit zoom), fonts not loaded yet at export

F02 Blank design of a preset or custom size
    S01 → size preset (or S03 custom W×H) → S04 empty page
    edge: invalid size, huge size (cap 8000px)

F03 Add and arrange elements
    S04 → S06 elements → click/drag shape → move/resize/rotate → S14 recolour → S12 align/reorder
    edge: snapping to centre/edges, multi-select, group/ungroup, lock, delete, undo

F04 Edit text
    S07 → add heading → double-click to type → toolbar font/size/colour/bold/italic/underline/align/
    spacing/case/effects(shadow, outline)
    edge: font not installed → load web font; long text wraps

F05 Upload a photo and remove its background
    S08 → drop image → click to add → select → S13 → "Remove background" → done (can toggle back)
    edge: model download fails (offline) → fallback colour-key removal; huge image → downscale;
    not an image → error toast

F06 Photo adjustments & crop
    select image → S13 filters/sliders; double-click → crop mode; flip H/V; transparency
F07 Multi-page
    S04 pages strip → add / duplicate / delete / reorder pages
F08 Page background
    S11 → colour / gradient / image
F09 Resize design (S16)
F10 Draw freehand (S10)
F11 Reopen a recent design
    S01 recents → S04 (autosaved state restored)
    edge: storage quota exceeded → toast
F12 Download (S15) PNG/JPG/PDF/SVG, transparent, ×1–×3, all pages / current page
```

## 5. Components

| component | variants / states | used on |
| --- | --- | --- |
| Button | primary, secondary, ghost, icon; hover, active, focus, disabled, loading | all |
| Icon rail tab | default, active | S04 |
| Side panel | open, collapsed; bottom sheet on mobile | S04–S13 |
| Search input | empty, typing, clear | S01, S02, S05, S06 |
| Chip | default, selected | S02, S05, S06 |
| Card (template / design) | hover, focus; thumbnail loading | S01, S02, S05 |
| Contextual toolbar | per selection type (text, shape, image, group, multi, page) | S04 |
| Popover | colour picker, transparency slider, spacing, position | S04 |
| Slider + number | default, dragging | S13, S12 |
| Select / dropdown | font family, font size, file type | S04, S15 |
| Modal dialog | open/close, Esc, focus trap | S03, S15, S16, S17 |
| Toast | info, success, error | all |
| Canvas handles | selected, hover outline, rotating, snapping guides | S04 |
| Pages strip | thumbnails, current, drag to reorder | S04 |
| Zoom control | fit, %, slider | S04 |
| Context menu | right-click: copy, paste, duplicate, delete, lock, layer ops | S04 |

## 6. Inferred data model (local only)

```
Design   id, title, width, height, unit, pages: Page[], createdAt, updatedAt, thumbnail (dataURL)
         evidence: home recents show thumbnail + title + edited date; resize changes width/height for all pages
         confidence: high
Page     id, background (colour | gradient | image), elements: Element[]   (fabric JSON)
         evidence: pages strip, background tab — confidence: high
Element  type (text | shape | line | image | path(draw) | group | svg graphic), x, y, w, h, angle,
         opacity, locked, fill, stroke, shadow, filters[] (image), text props (font, size, weight, style,
         underline, align, lineHeight, charSpacing, case)
         evidence: toolbar controls per type — confidence: high
Upload   id, name, blob, width, height, createdAt — evidence: uploads panel persists — high
Template id, title, category, width, height, pages (same as Design) — high
```

## 7. Feature matrix
See `features.csv`.

## 8. What cannot be cloned (skip rows)
- Canva's **template library and premium elements** – licensed/owned content. Replaced by an original
  set authored for Pigment (generated in code: shapes, gradients, frames, patterns, stickers, ~40 templates).
- **Stock photo/video/audio library** – licensed. Replaced by user uploads + generated abstract images.
- **Brand assets, fonts (Canva Sans), logo, colours, copy** – replaced by open fonts (Google Fonts, OFL) and own brand.
- Accounts, teams, sharing links, comments, real-time collaboration, cloud storage – out of scope (no login).
- Payments / Pro – out of scope (everything free).
- AI features (Magic Write/Design/Media) – need paid model APIs; skipped except **background removal**, done
  on-device with an Apache-2.0 segmentation model + offline colour-key fallback.
- Print ordering, video editing, websites, whiteboards, docs – different products.

## 9. Size

17 screens/panels, 12 flows, 5 entities (local). Hard parts:
1. **Canvas editor** (selection, transforms, snapping, text editing, groups, undo/redo) – use Fabric.js.
2. **Background removal in the browser** – lazy-load a segmentation model; fallback algorithm.
3. **Export** – multi-page PDF, SVG, transparency, fonts loaded before render.

No backend at all removes auth, sync and payments. Size: **M** (a few weeks for full parity; a strong
vertical slice in one session).
