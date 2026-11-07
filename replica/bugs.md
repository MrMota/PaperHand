# Bugs

Found by `/replica-test` on 2026-11-07. Every bug below was reproduced, has a test that failed
before the fix and passes after, and is fixed in commit `8b7f2e6`.

| ID | sev | title | test | status |
| --- | --- | --- | --- | --- |
| B01 | S1 | Edit lost when leaving the editor within the autosave delay | F11-E3 | fixed 8b7f2e6 |
| B02 | S2 | Two tabs on the same design silently overwrite each other | F11-E2 | fixed 8b7f2e6 |
| B03 | S3 | Snapping rarely snaps, lands a few px off, no guide shown | F03-E2 | fixed 8b7f2e6 |
| B04 | S3 | Right-click on the page never opens the context menu | F03-E3 | fixed 8b7f2e6 |
| B05 | S4 | Size and template buttons have noisy accessible names | F01-E5, F02-H1 | fixed 8b7f2e6 |
| B06 | S4 | Sliders are named with their current value; two sliders both named "Zoom" | F06-H1, F06-H3 | fixed 8b7f2e6 |
| B07 | S4 | Pages list contains a non-list item (axe: aria-required-children) | F01-E6 | fixed 8b7f2e6 |

---

### B01 — Edit lost when leaving the editor within the autosave delay
- **Severity:** S1 (data loss)
- **Steps:** 1. New Logo design. 2. Elements → add Star. 3. Within 0.7 s click Home. 4. Reopen the design.
- **Expected:** the star is there.
- **Actual:** the page is empty; console shows `pageerror: Cannot set properties of undefined (setting 'ctx')`.
- **Cause:** on unmount the canvas was disposed before the pending debounced save ran, so the save
  serialized a dead canvas.
- **Fix:** snapshot the design and save it before disposing; disposed editors ignore late timers.
- **Evidence:** `e2e/f11-recent.spec.ts` F11-E3 (Expected 1, Received 0 before the fix).

### B02 — Two tabs on the same design silently overwrite each other
- **Severity:** S2
- **Steps:** 1. Open a design in tab A and tab B. 2. Tab B: add a circle, wait for "Saved". 3. Tab A: add a rectangle. 4. Reload.
- **Expected:** circle and rectangle.
- **Actual:** only the rectangle; tab A saved its stale copy over tab B's work.
- **Fix:** each save is announced on a `BroadcastChannel`; another tab with that design open reloads it,
  or warns if it has unsaved edits of its own.
- **Evidence:** F11-E2 (Expected 2, Received 1); manual run `replica/clone-screens/M-F11-E2-two-tabs.png`.

### B03 — Snapping rarely snaps
- **Severity:** S3 (alignment still possible via Position → Align)
- **Steps:** 1. Add a square. 2. Drag it so its centre passes within a few px of the page centre.
- **Expected:** it snaps to x = 540 with a pink guide.
- **Actual:** stays at 536 (or snaps to 538); no guide drawn. Screenshot `M-F03-E2-snap.png`.
- **Cause:** `snap()` read the bounding box before updating coordinates, so it measured the previous mouse position.
- **Evidence:** F03-E2 (Expected 540, Received 536).

### B04 — Right-click on the page never opens the context menu
- **Severity:** S3 (keyboard shortcuts and toolbar still work)
- **Steps:** add any element, right-click it.
- **Expected:** context menu with copy, paste, duplicate…
- **Actual:** nothing; the menu only opened on the grey area around the page.
- **Cause:** Fabric's `stopContextMenu` stopped the event before it reached the stage handler.
- **Fix:** let the event through, select the object under the pointer, then open the menu.
- **Evidence:** F03-E3 (timeout waiting for the menu item); `M-F03-E3-context.png` after the fix.

### B05 — Noisy accessible names on size and template buttons
- **Severity:** S4
- **Actual:** screen readers announced "9:16 Story 1080 × 1920 px" and "Summer sale Square post".
- **Fix:** decorative ratio badge, category line and page-count badge hidden from assistive tech.

### B06 — Slider names
- **Severity:** S4
- **Actual:** sliders were named "Brightness 0" (value repeated in the name); the canvas zoom and crop zoom were both "Zoom".
- **Fix:** explicit labels; footer slider renamed "Canvas zoom".

### B07 — Pages list structure
- **Severity:** S4 — axe `aria-required-children`: the "Add page" button sat inside `role="list"`. Moved outside.

## To check (not reproduced, not filed as bugs)
- **AI background removal end to end** (F05-E3): the sandbox cannot reach the model host, so only the
  fallback path is tested. Needs one manual run in a normal browser.
- **Very large uploads** (20+ MB photos) on low-memory phones: not tried.
- **Storage full**: the quota error path has a toast but was not triggered in tests.
- **Safari / Firefox**: the suite runs in Chromium only.

## Test-side mistakes found and fixed (not app bugs)
Wrong preset name in a spec, wrong layer names, an ambiguous "Bold" selector (a template is called
"Bold statement"), and a race where specs pressed keys before the editor's key listener was attached
(the fixture now waits for the toolbar).
