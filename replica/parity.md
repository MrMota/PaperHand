# Parity report: Pigment vs Canva (web editor slice)

Generated 2026-11-07 with `replica/tools/parity.py` and `replica/tools/imgdiff.py`.

## Scores

| measure | result |
| --- | --- |
| **Feature score** | **83.7%** (125.5 of 150 weighted points, 67 features; must 3 / should 2 / could 1, partial = ½) |
| Must-haves | **29 / 29** done |
| Layout score | **not measured**: no screenshots of the original (see below) |
| Open bugs | 0 (7 found and fixed by `/replica-test`, incl. one S1) |
| E2E suite | 50 / 50 passing |

The first run said 98%, but that was against the 50-row checklist written during recon. Before trusting
it I added 17 in-scope features Canva has that the checklist had left out (present mode, charts, tables,
curved text…). 83.7% is the honest number.

### Areas, weakest first
| area | score | what pulls it down |
| --- | --- | --- |
| elements | 68% | charts, tables, photo grids, QR codes |
| home | 75% | no search over recent designs, no folders |
| photo | 81% | slider crop (no drag handles), no erase/restore brush, no duotone |
| text | 81% | no curved text, no spell check |
| editor | 87% | no present mode, resize can't make a copy, no rulers/guides, no version history |
| export | 92% | no animated GIF/MP4 |
| templates, uploads, background, draw | 100% | — |

## Layout diff

**Not measured.** Canva's site is unreachable from the build sandbox, and the editor needs an account,
so `replica/screens/` is empty. A layout score without references would be made up.

The tool is built and checked against known pairs of Pigment's own screens:

| pair | score | expected |
| --- | --- | --- |
| identical image | 100.0% (matches) | 100 |
| home vs home with recent designs | 82.1% (close) | similar |
| editor, Templates tab vs Elements tab | 72.2% (partly) | same shell, different panel |
| home vs editor | 20.3% (different) | unrelated |

**To score it yourself**: in your own browser, at 1440×900, save screenshots of Canva's home, template
gallery and editor (template open, Elements tab) as `replica/screens/S01.png`, `S02.png`, `S04.png`, then:

```bash
for s in S01 S02 S04; do
  python3 replica/tools/imgdiff.py replica/screens/$s.png replica/clone-screens/$s.png --name $s --json > replica/diffs/$s.json
done
python3 replica/tools/parity.py replica/features.csv --visual replica/diffs/*.json --markdown
```

Matching Canva's layout exactly is not the goal (its look is its trade dress). Aim for the same
information in the same places: left tool rail, side panel, contextual top toolbar, pages strip at the bottom.
Pigment already follows that structure.

## Behaviour diff

Canva-side behaviour is from its public help center and pricing page (recon sources), not measured here.

| flow | Canva | Pigment | fix or keep |
| --- | --- | --- | --- |
| F01 template → edit → download | Sign in first; then about 5 clicks (template, text, Share, Download, Download) | **4 clicks**, no sign-in (template, double-click text, Download, Download) | keep, a win |
| F05 background removal | Pro feature (paid), runs on Canva's servers | Free, runs on your device; the first AI run downloads a 25–110 MB model; offline fallback | keep; show the download size before the first run (done) |
| F05 erase/restore after removal | brush to fix edges | not built | **build** |
| F06 crop | drag handles directly on the canvas | zoom/position sliders in a panel | **build** handles |
| F09 resize | can resize into a new copy | resizes in place (undo restores) | **build** "copy & resize" |
| F11 where designs live | cloud, every device | this browser only | keep (that is the privacy pitch); add JSON export/import as a backup |
| F11 two tabs | live sync | syncs on save, warns on conflict | keep |
| errors | toasts | toasts, plus a fallback when the AI model can't load | keep |
| templates | huge licensed library | 61 original templates | keep growing; can't copy theirs |

## Missing, in build order

1. [should] Present mode (full-screen slideshow)
2. [should] Charts from data
3. [should] Tables
4. [should] Photo grids / collage layouts
5. [should] Search recent designs
6. [should] Curved text
7. [should] Resize into a copy *(partial)*
8. [should] Crop with drag handles *(partial)*
9. [could] Erase/restore brush, QR codes, rulers & guides, page grid view, speaker notes, animated export,
   folders, duotone, version history, spell check, eyedropper outside Chromium *(partial)*

## Verdict

**Shippable.** All must-haves are done, the feature score is 83.7% (over 80), and there are no open S1/S2 bugs.

Not yet **better than the original**. That needs the fixes `/replica-entrepreneur` finds in what Canva's
users complain about. Pigment's current angle (free, no account, private, on-device background removal)
is a start; the reviews will show whether it is the one users care about.

## Top five to build next
1. **Present mode**: presentations are a core template category, and right now you can make a deck but not present it.
2. **Crop handles + erase/restore brush**: finishes the photo story that background removal starts.
3. **Charts and tables**: the biggest gap (elements area 68%); needed for reports and decks.
4. **Photo grids**: quick collages are a top use of social templates.
5. **Search and backup on the home screen**: search recent designs, plus export/import a design file so
   local-only storage doesn't feel risky.
