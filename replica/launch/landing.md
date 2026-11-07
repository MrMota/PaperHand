# Landing page: Paperhand

Built at **`#/about`** (`src/components/About.tsx`) and linked from the home header. The app's home screen stays
the front door: no account means a visitor can start designing in one click, so the landing page explains and
the home screen does.

Checks: axe scan with no serious or critical issues (`e2e/launch-landing.spec.ts`), text contrast from the
design tokens (0 AA failures), no horizontal scroll at 390px, no console errors. Screenshots:
`replica/clone-screens/landing-desktop.png`, `landing-mobile.png`.

| section | copy | why |
| --- | --- | --- |
| Hero | **A design studio that leaves the making to you.** Posters, posts, slides and cards from your own photos and type. No generative AI, no account, nothing locked behind a paywall. Button: *Start a design*. Note: *Runs in your browser. Nothing to install.* Real screenshot of the editor. | angle A + B from `fixes.md` |
| The problem | *Machine-made filler everywhere* / *A lock on everything, and a bill you forgot*, both paraphrased in our words | top two "hate" themes (H1 AI ~23, H3+H4 paywall/billing ~23) |
| How it works | Pick a size or a template → Make it yours → Download | the core flow F01, 4 clicks |
| What makes it different | No generative AI · Nothing locked · No account, no tracking · Background removal on your device; then one line of basics | fixes X1, X2, X4 (no-account part), plus BG removal; parity features demoted to "the basics" |
| Pricing | Everyone $0 / Supporter $15 once (coming soon) | `pricing.md` |
| Questions | free?, where are designs kept?, generative AI?, is my photo uploaded?, commercial use?, import?, phone?, offline? | real objections; answers say plainly what is **not** built yet (import, offline install) and that clearing browser data deletes designs |
| Final CTA | Make something by hand. *Start a design* | |

## What is deliberately not on the page

- No testimonials, user counts, star ratings, press logos or "trusted by" rows (`e2e` checks for these).
- No reviewer quotes from the research.
- No competitor name, and no comparison table. A factual comparison page is a question for a lawyer first.
- No claim about working offline or exporting a design file, because neither is built yet (fixes X3, X4).
  Add them to the page when they ship.
