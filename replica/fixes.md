# What Canva's users want fixed, and how Pigment answers

## Sample (read this first)

| source | items | dates | how collected |
| --- | --- | --- | --- |
| App Store, US, iPhone app | 500 most recent reviews (1★ 51, 2★ 23, 3★ 22, 4★ 39, 5★ 365) | 2026-10-08 → 2026-11-05 | Apple's official customer-reviews RSS feed |
| Hacker News | 132 comments that mention Canva by name | 2009 → 2026-11-05, mostly 2025–26 | official Algolia search API, 7 queries |
| Trustpilot, G2, Capterra, Reddit | **0**, unreachable from this environment | — | not used; nothing filled in from search summaries |

**632 items, 2 sources.** That is below the 100+ across 3+ sources the method asks for on the source
count, and it skews to one month of iPhone reviews. The counts below are mine, from reading all 96 low-rated (1–3★)
App Store reviews and the 2023+ Hacker News comments by hand; `feedback.md` has the raw keyword ranking.
Video-editing complaints (about 8) are left out: Pigment does not do video.

Every quote is verbatim, one sentence or less, and linked. Reviewers' words are research, not testimonials:
they must not appear on Pigment's site or store listing.

## 1. What they hate

| # | problem | low-rated reviews | sources |
| --- | --- | --- | --- |
| H1 | Generative AI pushed into everything, no way to opt out or filter it | ~23 | App Store (+ HN distrust of AI training) |
| H2 | Bugs: app won't load, crashes, "something went wrong", distorted exports | ~13 | App Store |
| H3 | Paywall: crowns on nearly everything, no "free only" filter, watermarks | ~13 | App Store |
| H4 | Billing: trial traps, charges after cancelling, surprise renewals | ~10 | App Store |
| H5 | Clunky, too many steps, overlays covering the design | ~9 | App Store, HN |
| H6 | Updates that break the interface or remove features | ~5 | App Store |
| H7 | Slow downloads and lag | ~4 (+ video lag) | App Store |

**H1 AI**
> “Should be a way to opt-in if you want AI, not have it forced upon you.” (1★, 2026-10-23, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14701710181))
> “Wish i could filter the ai out.” (1★, 2026-10-27, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14720032646))
> “Removing a photo background with the pixel eraser, only to post it online and have it labeled fully AI.” (2★, 2026-10-31, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14735135562))

**H2 Bugs**
> “something went wrong on our end..” (1★, 2026-11-05, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14754017830))
> “I try to open canva and it doesn’t even load.” (1★, 2026-10-18, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14682409487))

**H3 Paywall**
> “Now everything is behind a paywall and as someone who’s used this app for 6+ years it’s incredibly disappointing and extremely frustrating.” (2★, 2026-10-20, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14691140517))
> “I wish more things were free to use without a watermark!!!!” (3★, 2026-10-16, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14675469322))

**H4 Billing**
> “Even after logging into the app multiple times and selecting ‘cancel’ - Canva charged my account for nearly 6 months.” (1★, 2026-10-24, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14706847652))
> “They try to make u do free trial” (1★, 2026-11-01, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14739051423))

**H5 Clunky**
> “Very clunky, has lots of features but the flow is hard to work with.” (1★, 2026-10-17, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14677772625))
> “the fact that the “Ask Canva” hovers and covers a portion of your design is very annoying.” (3★, 2026-10-13, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14663729830))
> “It's impossible to align stuff properly.” (HN, 2026-10-12, [Hacker News](https://news.ycombinator.com/item?id=50053147))

**H6 Updates**
> “Every week there’s an update that ends up breaking the interface.” (1★, 2026-10-30, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14731820763))
> “Your recent changes made using your app less intuitive and added 3x the amount of time as before.” (2★, 2026-11-04, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14750860564))

**H7 Slow**
> “Every time I try to download, it will take at least 15 minutes just to download a simple template/and or video.” (2★, 2026-10-11, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14656210716))

## 2. What is missing

Few features are asked for by name in this sample. Most complaints are about things Canva does, not things it lacks.

| # | request | items | evidence |
| --- | --- | --- | --- |
| M1 | A way to filter out AI content / opt out | (counted in H1) | “Wish i could filter the ai out.” |
| M2 | A "free only" filter | 1 (+ H3) | **thin** |
| M3 | Better organising of designs | 1 | **thin**: “I wish we could organizer things better and easier” (3★, 2026-11-04, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14751537482)) |

## 3. What is unsolved

| # | job or group ignored | items | sources | strength |
| --- | --- | --- | --- | --- |
| U1 | People who don't want an account just to open the app | 4 | App Store, HN | small but two sources |
| U2 | Working without internet | 2 | App Store, HN | **thin** |
| U3 | Privacy: data sent home, distrust of AI-training promises | 4 | HN only | **thin** (one source) |

> “everything is behind a paywall with no way to filter to only see free things, also forces u to make an account to even open the app!” (2★, 2026-10-12, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14658569153))
> “After Canva bought Affinity, you now have to authenticate with your email from time to time when you launch the desktop app” (HN, 2026-04-18, [Hacker News](https://news.ycombinator.com/item?id=47820428))
> “No internet = Doesn’t work” (1★, 2026-10-15, [App Store (US, iOS)](https://itunes.apple.com/us/rss/customerreviews/id=897446215/sortBy=mostRecent/json#review-14671960567))
> “You will need to be online to download and activate your license with your free Canva account.” (HN, 2025-10-30, [Hacker News](https://news.ycombinator.com/item?id=45763400))
> “Every time I run it, Little Snitch shows that it is transferring data to many servers” (HN, 2026-07-13, [Hacker News](https://news.ycombinator.com/item?id=48892962))
> “They claim not to, but I am extremely suspicious.” (HN, 2025-10-30, [Hacker News](https://news.ycombinator.com/item?id=45764783))

## 4. Fix plan

Ranked by evidence × how cheaply Pigment can answer it. Several are already true of Pigment by design;
those cost almost nothing but need to be made visible and protected.

| # | fix | answers | size | skill | status in Pigment |
| --- | --- | --- | --- | --- | --- |
| X1 | **No generative AI, ever.** Libraries are human-made. The one AI tool (background removal) is opt-in, on-device, and a setting hides AI options entirely. Exports never carry AI labels or metadata. | H1, M1 | S | /replica-build | partly true; add the "hide AI tools" setting |
| X2 | **Nothing locked.** No crowns, no watermarks, no trials. Any future paid tier sells extras, never takes features back, and cancels in one click. | H3, H4, M2 | S | /replica-launch (pricing) | true today |
| X3 | **Works offline, installable.** Service worker caches the app and fonts, so "something went wrong on our end" and "no internet = doesn't work" can't happen. | H2, U2 | M | /replica-build | not built |
| X4 | **No account, and your files are yours.** Export/import a design file and "back up everything", so local storage isn't a trap. | U1, U3, lock-in | M | /replica-build | no account: true; file export: not built |
| X5 | **A quiet editor.** No assistants or popups over the canvas, no upsell prompts; the core flow stays at 4 clicks. Make it a product rule checked in tests. | H5 | S | /replica-test | true today; add a test |
| X6 | **Stable interface.** Never silently remove a feature; in-app "What's new" lists every change. | H6 | S | /replica-build | not built |
| X7 | **Instant local export.** Rendering is on-device, so no server queue. Keep the export test as a speed budget. | H7 | S | /replica-test | true today |

Billing and pricing complaints (H4) go to `/replica-launch`.

## 5. The angle

**A. Made by hand.**
For people who make things by hand and are tired of AI being pushed into every corner of their design tool,
Pigment is a design studio with no generative AI: your templates, your photos, your choices.
Evidence: H1, ~23 low-rated App Store reviews in one month, plus HN distrust of AI-training promises.

**B. Nothing locked.**
For people who hit a crown on every template and a surprise renewal on their card,
Pigment is free with nothing locked and nothing to cancel.
Evidence: H3 + H4, ~23 low-rated reviews, one source.

**C. Yours, offline.**
For people who don't want an account, a cloud or their designs on someone else's server,
Pigment runs entirely in the browser, works offline and keeps every file on their device.
Evidence: U1–U3, ~10 items across two sources, individually thin.

**Recommended: A, with B as the supporting line.** A has the strongest and most recent evidence, it is
distinctive (Canva cannot easily walk it back), and it is cheap to keep true. B backs it with the second-biggest
complaint. C is real but thin in this sample; keep it as a feature fact, not the headline, until more sources
(Reddit, Trustpilot) confirm it.

Honesty check for A: Pigment's background remover uses a machine-learning model. That is fine under this angle
only if it stays opt-in, on-device, editing *your* photo rather than generating content, and is described that way.
