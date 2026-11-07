# Brand: Paperhand

Angle (from `fixes.md`): **Made by hand.** A design studio with no generative AI and nothing locked:
your templates, your photos, your choices.

## 1. Name

### Twenty candidates

| style | candidates |
| --- | --- |
| descriptive | Paperhand, Handprint, Linocut, Letterpress |
| compound | Handwise, Inkwell, Papermade, Craftbench |
| invented | Kolvo, Ocraft, Velim, Tamsa |
| metaphor (craft materials) | Frisket, Deckle, Gouache, Gesso, Ochre, Washi, Stipple |
| verb | Burnish |

Cut before checking: anything starting "Can-" or ending "-va", any "-ly" twin; Letterpress, Craftbench (long);
the invented names (say nothing about the angle); Gouache (hard to spell after hearing it once).

### Web checks (run 2026-11-07, web search for "name + design/app/software")

| name | result | verdict |
| --- | --- | --- |
| Pigment (working name) | **Conflict.** Pixite sells "Pigment" (iOS coloring app; Pixite makes graphic-design apps). A business-planning SaaS also uses the name. | **retired** |
| Deckle | Conflict: an open-source UI design tool "Deckle Desktop"; also a Mac paper-texture app | cut |
| Lino | Conflict-adjacent: linoit.com, an online sticky-note canvas | cut |
| Inkwell | Conflict-adjacent: "Inkwell" Photoshop ink-effects plugin | cut |
| Gesso | Conflict: an AI UI-generation platform (also clashes with the angle) | cut |
| Burnish | An early-access AI product platform | cut |
| Stipple | Crowded in graphics tools (Stipple Effect pixel editor, Illustrator plugins) | cut |
| Washi | Conflict: "WOWSHI" pattern-tape design app (Cardinal Blue, bundle id `…washi`) | cut |
| Handprint | Minor: a "Handprint" page on aesthetic.computer | shortlist |
| Ochre | No software found; design agencies and a furniture brand use it | shortlist |
| Frisket | No software found | shortlist |
| **Paperhand** | **No software found** | **chosen** |

### Screening checks for Paperhand

These are screening checks, not legal clearance. A trademark lawyer should search properly before money is
spent on the name. Lookups below were blocked from the build environment, so they are **to run**, by hand.

| check | where | status |
| --- | --- | --- |
| web, name + category | web search | **run 2026-11-07: no design software named Paperhand found** |
| US trademark, classes 9 and 42 | tmsearch.uspto.gov | to run |
| EU trademark | TMview (tmdn.org) | to run |
| Canada | ised-isde.canada.ca trademarks database | to run |
| global | WIPO Global Brand Database | to run |
| domains | paperhand.com / .app / .design via a registrar | to run |
| App Store and Google Play | search "Paperhand" | to run |
| handles | X, Instagram, TikTok, GitHub `paperhand` | to run |

Runner-up if any check fails: **Frisket** (same web result).

## 2. Palette

The palette from `/replica-design` already sits in a different family from the original: a rust/terracotta
accent (`#B7410E`) on warm paper greys, against the original's teal and purple. It suits "made by hand", so the token
values stay. `contrast.py`: **0 AA failures** (12 pairs).

What changed: the old logo and home hero paired a **teal (#2E8B8B) with a purple (#5B2A86)**. That is too close to the
original's signature teal-to-purple gradient, so both are gone. The hero is now rust with an ochre glow and a dark
umber corner; the logo is ink, paper and rust only.

| role | value | note |
| --- | --- | --- |
| accent | `#B7410E` rust | buttons, active states, the stroke in the mark |
| accent-hover | `#9A360B` | hero base |
| bg / surface | `#F3F2EF` / `#FFFFFF` | warm paper |
| rail / ink | `#1E1B16` | header, rail, mark background |
| paper | `#F6EDE3` | sheet in the mark |
| ochre (decorative only) | `#E9B44C` | hero glow; never text |

The original's brand colours (`#00C4CC`, `#7D2AE8`, `#8B3DFF`) are in `brand.json`; the sweep flags anything within
RGB distance 36 of them. One generated "ocean" image used `#00B4D8` (distance 20) and was moved to `#0096C7`.

## 3. Logo brief

- **Idea:** a sheet of paper with one hand-drawn stroke across it. The paper is the work, the stroke is your hand.
- **Mark type:** symbol plus wordmark. The symbol works alone as the app icon.
- **Wordmark:** a serif with some ink in it (the app uses DM Serif Display, OFL), "Paperhand" as one word, no camel case.
- **Colours:** ink background, paper sheet, rust stroke. No gradients.
- **Sizes:** must read at **16px**. The interim mark loses its folded corner and stroke weight at 16px, so draw a
  16px variant: sheet plus a thicker stroke, no fold. Also a 1024px app icon.
- **Deliverables:** SVG (mark, wordmark, lock-up), iOS app icon 1024×1024 with **no transparency**, favicon set
  (16, 32, 180 apple-touch, 192/512 for the web manifest), social image 1200×630.
- **Must not resemble the original's mark:** no circle badge, no script wordmark, no teal or purple, no gradient.
  Put the original's logo next to the drafts and check.
- **Interim mark** (in `public/favicon.svg` and the header) is a placeholder drawn in code. See
  `replica/clone-screens/brand-favicon-sizes.png`.

## 4. Voice

**Warm, plain, unhurried.**

| word | means | does not mean |
| --- | --- | --- |
| warm | talks like a friend at the next desk | cute, emoji, exclamation marks |
| plain | short words, says the thing | bland or vague |
| unhurried | no countdowns, no upsell, no pressure | slow or wordy |

| do | don't |
| --- | --- |
| "Your designs will live here." | "Nothing here yet! Get started now!" |
| "Couldn't save just now. Your work is still open." | "Oops! Something went wrong." |
| "Click anything to edit it." | "Unleash your creativity with powerful tools." |
| Say what happened and what to do next | Blame the user, or hide the error |
| Describe the background remover as a tool that edits your photo | Call it "magic" or "AI-powered" |

### Ten most-seen strings, rewritten

| where | was | now |
| --- | --- | --- |
| home heading | What will you make today? *(too close to the original's home heading)* | Make something by hand. |
| home sub-line | Free, private and offline-friendly. Your designs never leave this browser. | Templates, photos and type. No account, no AI filler, nothing locked. |
| main button | Create a design *(the original's button label)* | New design |
| custom size button | Create new design | Start designing |
| empty recents | Nothing here yet. Pick a template… | Your designs will live here. Start one from a size or a template; it saves itself as you go. |
| no search results | No templates match "x". Try a broader word… | Nothing for "x". Try a shorter word, or clear the filters. |
| editor hint | Select an element to edit it · Drop images anywhere on the page | Click anything to edit it · Drop photos straight onto the page |
| save error | Could not save this design | Couldn't save just now. Your work is still open: try again, or download a copy. |
| storage full | Browser storage is full. Delete old designs… | This browser is out of room. Delete an old design or upload to keep saving. |
| not found | Design not found | We can't find that design |
| footer | Pigment runs entirely in your browser… | Paperhand runs entirely in your browser. No account, no tracking, no generative AI, and nothing ever leaves this device. |

## 5. Sweep

```
python3 replica/tools/sweep.py . --config replica/brand.json   →  clean
```

Checked by eye: header logo, favicon at 16/32/64/180 on light and dark, page titles (`Paperhand`,
`<design> — Paperhand`), meta description, README. No email templates, OG image or app icon exist yet;
the OG image and app icon are in the logo brief. The GitHub repository is still called `pigment`; rename it
in GitHub settings when ready (old URLs redirect).
