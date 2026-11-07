# Build log

| ID | date | status | notes |
| --- | --- | --- | --- |
| shell | 2026-11-07 | done | Vite + React + Fabric 7, hash routing, tokens, IndexedDB store |
| S01 | 2026-11-07 | done | sizes row, recents (empty/filled/loading), template grid, search no-results, mobile |
| S02 | 2026-11-07 | done | `#/templates`, category chips + search |
| S03 | 2026-11-07 | done | px/in/mm/cm, presets, validation (40–8000 px) |
| S04 | 2026-11-07 | done | header, rail, side panel, contextual toolbar, pages strip, zoom, autosave, context menu, snapping guides, bottom-sheet panels on mobile |
| S05 | 2026-11-07 | done | "Matching size" filter; applies to empty page or appends pages |
| S06 | 2026-11-07 | done | 7 lines, 36 shapes, 37 original graphics, 14 frames, 16 gradients, search |
| S07 | 2026-11-07 | done | heading/sub/body + 10 font combos, 18 bundled OFL fonts |
| S08 | 2026-11-07 | done | drop/paste/upload, persisted, delete, 25 MB limit + error toast |
| S09 | 2026-11-07 | done | 18 procedurally generated images (no stock library — licensed) |
| S10 | 2026-11-07 | done | pen / marker / highlighter |
| S11 | 2026-11-07 | done | colour, gradient, image backgrounds |
| S12 | 2026-11-07 | done | arrange, align, distribute, exact size/position, layer list with hide/lock/drag |
| S13 | 2026-11-07 | done | BG removal (2 AI models + offline), 14 filters, 8 adjustments, shadow/glow |
| S14 | 2026-11-07 | done | document colours, palette, gradients, hex, eyedropper |
| S15 | 2026-11-07 | done | PNG/JPG/PDF/SVG, ×0.5–×4, transparent, page selection |
| S16 | 2026-11-07 | done | resize with optional content scaling |
| S17 | 2026-11-07 | done | `?` shortcut sheet |

Harder than expected: Fabric 7 defaults to centre origin (switched globally to top-left), and the AI model
host is unreachable from the build sandbox, so the AI path was not exercised end to end here; the
offline colour-key path was. Still to build: erase/restore brush after background removal.
