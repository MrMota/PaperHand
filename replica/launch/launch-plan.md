# Launch plan: Paperhand

## Before telling anyone

| # | item | status |
| --- | --- | --- |
| 1 | Deploy to a domain (`/replica-deploy`) | to do |
| 2 | **Design file export/import + "back up everything"** (fix X4). Designs live only in browser storage; one "clear site data" deletes them. Ship this before inviting people to trust it with real work. | to build |
| 3 | Privacy policy page: what is stored (IndexedDB, on the device), what is fetched (the background-removal model from Hugging Face, only when used), what is not collected (no accounts, no analytics in the app) | to write |
| 4 | Support URL: GitHub issues on the repo, or a support email | GitHub issues works today |
| 5 | Supporter Payment Links created in Stripe (`pricing.md`) and placed on the About page | to do (you) |
| 6 | Name screening checks from `brand.md` (trademarks, domains, store, handles) | to run (you) |
| 7 | Final logo from the brief in `brand.md`; OG image 1200×630 | to make |
| 8 | Offline install (fix X3) and the "hide AI tools" setting (fix X1) | nice before launch, not blocking |

## Measuring without breaking the promise

The footer says **no tracking**, so the app gets no analytics script and no automatic error reporting.

- **Visits:** use the host's server-side request stats (aggregate counts from the web server, no script, no cookies),
  and say so in the privacy policy.
- **Errors:** an opt-in "Report a problem" link that opens a pre-filled GitHub issue or email with the browser and
  error text, sent only when the person clicks it.
- **Usage signal:** supporter payments, GitHub stars and issues, replies to launch posts.

If you later want product analytics, make it opt-in and change the footer first.

## Where the unhappy users talk

From the research (`fixes.md`), with what is verified and what is not:

| place | verified? | how to show up |
| --- | --- | --- |
| Hacker News: threads on the Affinity acquisition, subscription fatigue and "free but needs an account" | yes, 132 comments read | a **Show HN** post (below); answer questions, don't pitch in other threads |
| App Store reviews complaining about AI and paywalls | yes, 96 read | you can't reply to them; they shaped the copy |
| Reddit (graphic design, small business, teachers, Etsy sellers) | **not researched**: Reddit was unreachable | read by hand first; follow each subreddit's self-promotion rules |
| Teachers (one review warned about AI-generated images students made) | thin: one review | worth a conversation, not a campaign |

## The launch posts

**Show HN** (lead with the fix, not the clone):

> Show HN: Paperhand – a browser design studio with no generative AI and no account
>
> I wanted a template editor for posters, posts and slides that doesn't push generated content, doesn't lock
> half the library behind a subscription, and doesn't need an account. Paperhand runs entirely in the browser
> (React + Fabric.js), keeps designs in IndexedDB, and removes photo backgrounds on-device with transformers.js.
> Templates and illustrations are original; fonts are OFL. What's missing: offline install and design-file export
> are next. Feedback welcome, especially on what breaks.

**Product Hunt:** same angle. Tagline: "Design by hand. No account, nothing locked." Gallery: the real
screenshots, the background-removal before/after, the export dialog. Post only after item 2 above is done.

## The first 10 users, by hand

Talk to people, don't count signups. Aim for 10 conversations in the first two weeks:

1. 3 people who make social posts for a small business (the biggest template category).
2. 2 teachers or students (classroom posters and slides; the AI-content worry).
3. 2 people who sell printables or shirt graphics (one review: paying a subscription mainly for transparent PNGs).
4. 2 people who left a paid design subscription in the last year.
5. 1 designer, to tell you what feels amateur.

Ask each to make one real thing while you watch (screen share), then: what slowed you down, what did you look for
and not find, would you come back. Write each session up in `replica/interviews/` and feed the gaps into
`features.csv`.
