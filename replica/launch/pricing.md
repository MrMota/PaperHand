# Pricing: Paperhand

## What others charge

Read 2026-11-07. Official pricing pages (canva.com, adobe.com, kittl.com) were **not reachable** from the build
environment, so these figures come from third-party pages that sometimes disagree. **Confirm each on the
official page before quoting it anywhere.**

| product | free plan | paid, individual | notes | source (read 2026-11-07) |
| --- | --- | --- | --- | --- |
| Canva | yes, background remover not included | Pro ≈ US$144/yr or ≈ $18/mo (one source: $120/yr) | Business ≈ $250/person/yr | [costbench](https://costbench.com/software/design/canva/), [socialrails](https://socialrails.com/blog/canva-pricing), [usecarly](https://www.usecarly.com/blog/canva-pricing/) |
| Adobe Express | yes | Premium ≈ US$9.99/mo (one source: $12.99 month-to-month) | Firefly Pro ≈ $19.99/mo | [krea.ai](https://www.krea.ai/blog/what-is-adobe-express-free-plan-pricing-and-how-it-compares-in-2026), [fluxnote](https://fluxnote.io/guides/adobe-express-pricing-guide-2026) |
| Kittl | yes | sources conflict: Pro from ≈ $12/mo, or credit tiers from $89–99/mo | pricing changed during 2026 | [toolsurf](https://www.toolsurf.com/kittl-pricing-2026-plans-features-best-deals-compared/), [toolradar](https://toolradar.com/tools/kittl/pricing) |
| Affinity (by Canva) | yes, apps free | AI features need a Canva paid plan | desktop pro tool, not a template editor | [80.lv](https://80.lv/articles/affinity-returns-as-free-all-in-one-design-suite), [remio](https://www.remio.ai/post/inside-canva-s-affinity-pivot-free-software-ai-subscriptions-and-a-community-on-edge) |

## What reviewers said about price and billing

From `replica/fixes.md` (hand-read, 96 low-rated App Store reviews, Oct 8 – Nov 5 2026):

| theme | low-rated reviews | what it means for pricing |
| --- | --- | --- |
| Paywall: crowns on everything, no "free only" filter, watermarks | ~13 | a free tier that shrinks over time is the complaint, not the price itself |
| Billing: trial traps, charges after cancelling, surprise renewals | ~10 | recurring billing done badly is the complaint |
| Price too high | ~3 | few people complain about the number |

Raw keyword counts in `feedback.md`: subscription/billing 71 items (12 low-rated), paywall 63 (19), price 23 (3).
Many keyword hits are 5★ reviews saying the subscription is worth it, which is why the hand counts are lower.

## The model

**Free for everyone, with an optional one-time supporter payment.**

- Paperhand has no server costs that grow per user: everything runs in the browser, and the background-removal
  model is downloaded from Hugging Face's public hub. A subscription would have nothing to pay for.
- The complaints are about what subscriptions *do* (lock things, renew, resist cancelling), so the model has none of that.
- Two tiers, named for who they are for. A third (teams or schools) only once there is a feature they need
  that needs a server, such as shared brand kits. Not before.

| tier | who | price | what you get |
| --- | --- | --- | --- |
| **Everyone** | anyone | $0 | the whole app: every template, element, font, export, background removal; no account, no limit |
| **Supporter** | people who want it to keep going | **$15 once**, or pay what you like (min $5) | the same app, a thank-you, a receipt; pays for new templates and illustrations |

Rules that fix the billing complaints in the product:

1. **Supporting never unlocks anything.** No crowns exist, so no upgrade prompts can exist.
2. **No recurring charge at all.** Nothing to cancel, nothing renews, no trial that converts.
3. **Refund within 30 days, no questions**, through the Stripe dashboard.
4. **One email**, the Stripe receipt. No marketing emails unless someone opts in separately.
5. No in-app nagging: the supporter link lives on the About page and in the footer, never over the canvas.

Risk, stated plainly: voluntary payments usually convert a small share of users. That is fine while costs are near
zero (static hosting). If Paperhand adds anything with a real per-user cost (cloud sync, team sharing), price
*that* as its own clearly-named plan rather than taking things away from Everyone.

## Stripe: what you create

No backend is needed: Stripe Payment Links handle checkout and receipts.

1. Product **"Paperhand Supporter"**, description "A one-time thank-you that funds new templates and illustrations. Unlocks nothing; everything is already free."
2. Price A: **one-time, US$15.00**.
3. Price B: **one-time, customer chooses the amount**, minimum US$5.00, suggested US$15.00.
4. A **Payment Link** for each price. Turn on "collect email" (for the receipt) and leave "save payment details" off.
5. Optional: Stripe Tax, if you need to collect sales tax/VAT where you live.
6. Put the links on the About page (replace "Coming soon" in `src/components/About.tsx`) and in the footer.

Do not create any recurring prices.
