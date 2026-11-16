# Release note — seo-build

Branch: `seo-build`. Pushed to `origin` on 9 Nov 2026; production untouched, the owner
runs `vercel --prod`.

## What changed

- Consent Mode v2 (`src/lib/consent.ts`): all four signals default to denied, pushed before
  any tag; Accept grants all four; Reject keeps them denied. GTM and the Meta Pixel are
  inserted only after an Accept, so no Google or Meta request leaves the browser before a
  choice. The pixel's `_fbc` seeding is consent-gated; the CAPI PageView is consent-gated.
- One GTM container: `GTM-K8P8CZL6` (was `GTM-N8SSB783`), loaded once from the bootstrap
  with the standard noscript iframe after `<body>`.
- Dynamic sitemap (`scripts/generate-sitemap.mjs`) runs in `npm run build`: 52 URLs, real
  product `lastmod` from `Product.updatedAt`, one `<image:image>` per product, no utility or
  noindex routes. Replaces the static `public/sitemap.xml` dated 2026-09-26.
- `/llms.txt` added; `/llms-full.txt` rewritten by hand in Phase J2 (static, no build
  step — the earlier note claiming it was generated at build was wrong).
- Metadata rewritten to 50-60 character titles and 140-160 character descriptions on
  /contact, /faqs, /about, /shop, /reviews and the product template.
- `noindex` on /admin and /track.
- A1 review restore: Derek's 4-star review reinstated; 41 reviews, average 4.98.

## Tested

- Build exit 0 (`vite build`, NITRO_PRESET=vercel).
- Consent capture in Chrome at 3 states: zero third-party requests before a choice and
  after Reject; gtm.js, GA4-less container, fbevents.js and /api/meta-capi only after
  Accept.
- Local production build: titles/descriptions measured on the rendered HTML, sitemap and
  llms files present, 404 returns 404, admin returns `noindex, nofollow`.
- Screenshots at 375 and 1440 of home, category, product, cart drawer and checkout.

## Final pre-deploy run (Tasks 0-12)

### Fixed in this run

- **Hydration #418 (checkout, all widths).** The zustand cart `persist` middleware
  rehydrated before React's first client render, so server HTML (empty cart) and client
  markup (items and totals) differed. Now `skipHydration: true` plus a single
  `useCart.persist.rehydrate()` in a root effect. Console errors at 375, 390 and 1440 on
  `/checkout`: none.
- **`/shop` 307.** `validateSearch` returned empty arrays and a default sort, so the clean
  URL differed from the validated search and TanStack redirected. Absent filters now
  validate to `undefined`; `/shop` is 200 with canonical `https://www.aqbeds.com/shop`.
- **Mobile sticky Place Order on `/checkout`.** Fixed bar with the 8 PM cut-off and
  at-door-inspection guarantee. It renders only after a cookie choice (the consent card
  owns the bottom until then), respects `safe-area-inset-bottom`, and
  `MobileCartBar`, `FloatingWhatsApp` and `LiveChatWidget` are suppressed on `/checkout`
  so nothing overlaps. Desktop unchanged.
- **Metadata.** Titles now 50-60 characters and descriptions 140-160 on every route,
  including the product template (`buildTitle` picks the first option inside the window)
  and the seven static pages rewritten in this pass.
- **Missing `/guides` hub.** The sitemap advertised `/guides` (404). Added
  `src/routes/guides.index.tsx`, linked from the footer, and dropped
  `/category/bedroom-furniture` from the sitemap generator (an empty category renders a 404, so only categories with products are listed: 51 URLs).
- **Image SEO.** Width/height plus descriptive alt on product cards, category hero, PDP
  main image and thumbnails. Alt text never claims photography.
- **Internal linking.** Every DB product is reachable from its category page; the PDP
  related-products fallback tops up single-product categories from the catalogue; the
  footer lists all collections (sofas was missing); the ottoman-vs-divan guide links
  three matching products.
- **Share cards.** `scripts/generate-og-images.mjs` builds 39 cards (32 product, 6
  category, 1 default) at 1200x630 with sharp from existing catalogue crops. Root emits
  `og:site_name`, `og:image`, `og:image:alt`, dimensions and `twitter:description`.

### Verified

- Metadata sweep over every sitemap URL (51): 0 non-200, 0 titles out of range, 0
  descriptions out of range, 0 missing OG or Twitter tags.
- Proof order: one order created from a double click on Place Order (dedupe holds),
  captured, deleted by email, row count 43 before and 43 after. Mary `#C0AFDF08` £220
  delivered and Joseph `#9CC4D9A9` £190 delivered still present.
- Consent re-run at three states: no third-party request before a choice or after Reject;
  `gtm.js`, `fbevents.js` and `/api/meta-capi` only after Accept.
- Preview deployment Ready: https://aqbeds-hwtu9kjho-abdulraheem1.vercel.app (`/shop`,
  `/guides`, product titles and `/checkout` checked through `vercel curl`).

## Final patch (P0-P4)

Preview: https://aqbeds-gq99xy71x-abdulraheem1.vercel.app (deployment `gq99xy71x`, Ready).
Commit: the single patch commit on `seo-build` recorded in the run report.

### P0 — order table cleanup (conditional approval)

- Deleted **18** rows: name or email matched test/mock/proof/demo/sample **and** status was
  not Delivered, with no real postcode and no real-looking email.
- Excluded **1** row: `08E4F8DB "test" test@gmail.com £185 pending` — the address is a
  valid mailbox format, so it was left for the owner to confirm rather than guessed at.
- Rows before **43**, after **25**. Mary `AQ-M2EZYE` (£220, delivered) and Joseph
  `AQ-KX3RZ5` (£190, delivered) untouched. Evidence: `docs/deleted-test-orders.csv` now
  carries a decision and reason per row.

### P1 — order reference

- New `Order.reference` column, `AQ-` + 6 characters from an unambiguous alphabet
  (no 0/O/1/I/L), unique, generated with Web Crypto and retried on collision. Existing 25
  rows backfilled; the reference is never derived from the database id.
- Shown as "Your order number" on the confirmation, in both email subjects and bodies, in
  the WhatsApp message, and on `/track` (lookup accepts reference, tracking token or id).
- Email subject lines: customer `Your AQ Beds order AQ-XXXXXX is confirmed`; owner
  `New order AQ-XXXXXX from <name>`.
- Proof: confirmation captured at 375px (`tmp/shots/p1-confirmation-375.png`) showing
  `AQ-AMGRX8`; the row saved with the same reference; purchase `transaction_id` equals it.
- Note: email delivery itself could not be verified locally — `RESEND_API_KEY` is set only
  for Preview and Production. The send failure was logged and did not block the order.
- `/api/track` was returning 500 on every deployment: the ESM function imported
  `../src/lib/delivery-date`, which Vercel does not bundle, so `/track` never worked in
  production. The function is now self-contained and returns the reference plus the raw
  inputs; the page derives the delivery date from the same engine the rest of the site uses.
  Verified on the preview: `?token=AQ-M2EZYE` and `?token=aq-kx3rz5` both return the order.

### P2 — sticky CTA independent of consent

The bar was gated on a cookie choice. It is now always rendered, and the consent card lifts
itself to `bottom-[104px]` on `/checkout` so neither covers the other. It is also portalled
to `document.body`: inside the page wrapper (`animate-fade-in` creates a stacking context)
the footer painted over the bar, so the button was in view but untappable. At 375px with no
consent stored: banner box bottom 740, Place Order button 792-836, `elementFromPoint` returns
the button itself, `tappable: true`. Screenshot `tmp/shots/p2-consent-bar-375.png`.

### P3 — GA4 ecommerce dataLayer

`src/lib/gtm.ts` pushes standard GA4 ecommerce events, gated on `aq_cookie_consent ===
"accepted"`. Before Accept the dataLayer contains no event entries at all. After Accept the
same session produced, in order: `view_item`, `add_to_cart`, `begin_checkout`,
`checkout_error` (field name only, never the value), one `purchase` with
`transaction_id: AQ-AMGRX8`, `value: 185`, `currency: GBP`, and `generate_lead` on the
WhatsApp button. A double click on Place Order still produced exactly one purchase event and
one order row.

### Known defects found, not fixed

- No GA4 tag inside container `GTM-K8P8CZL6`, and the app pushes no ecommerce events to
  `dataLayer` (only Consent Mode). Analytics needs both a tag and those pushes.
- `/guides/ottoman-vs-divan` and other long-form pages are still the only guides; there
  is no article hub beyond the new index.
- Checkout confirmation shows no visible order number (the Track button carries the
  token, so tracking works, but the reference is not printed).
- Local `npm run build` cannot run `prisma generate` while a dev server holds
  `query_engine-windows.dll.node`; use `npx cross-env NITRO_PRESET=vercel vite build`
  locally. Vercel's build of the same script succeeded.

### Blocked

- Task 0 deletions: 19 candidates matched rule (a); the run's own >10 rule forbids
  deleting, so nothing was removed. Candidates are exported in
  `docs/deleted-test-orders.csv` with action `kept-over-10-rule`.

---

## Phase J — AI search visibility (AEO / GEO) technical layer

Run 9 Nov 2026. Eight items, J1-J8.

### J1 — crawler access

`public/robots.txt` now names every crawler the brief lists: Googlebot,
Googlebot-Image, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
PerplexityBot, Google-Extended, CCBot. `User-agent: *` still allows everything except
`/admin`, and the sitemap line is unchanged. Final file is 898 bytes and returns 200
`text/plain`.

Owner decision to note: `Google-Extended` and `CCBot` govern use of content for model
training, not search indexing. Allowing them means permitting AI training on the site's
content. Disallow them if that is not wanted — it does not affect search visibility.

### J2 — llms.txt and llms-full.txt

`public/llms.txt` (3,761 bytes) rewritten by hand: business, what is sold with category
URLs, sizes, delivery rules including the 20:00 Europe/London cutoff, payment, guarantee
and returns, contact, key page URLs, sitemap link. No prices, so it cannot go stale.

`llms-full.txt` is **generated at build** by `scripts/generate-sitemap.mjs`, which is why
hand-editing the file had no effect on the deployment — the first deploy proved it
(3,527 bytes, the old copy). The generator's template was rewritten to the same factual
sections plus the catalogue it already pulled from `Product`; output is 7,483 bytes for
32 products on this run. Catalogue prices are labelled "from" prices at generation time
with the product page authoritative.

### J3 — no-JavaScript parity

18 templates fetched with plain HTTP (no JavaScript) using a Googlebot user agent:
home, shop, 4 categories, 2 products, guides hub, guide, faqs, delivery, returns,
size-guide, about, contact, reviews, track. Result after fixes: **0 failures**, all 200.

Per-template checks: H1 present on all 18; price on all commercial and product
templates; delivery promise on all 18; guarantee line on all 18; product description on
both products; FAQ text on /faqs.

Two things failed on the first run and were fixed:

- **Breadcrumb.** Only the product template emitted `BreadcrumbList`; the other 17 had
  no breadcrumb at all. Added `src/components/seo/Breadcrumbs.tsx`, mounted once in
  `__root.tsx`, deriving the trail from the pathname: visible `<nav aria-label="Breadcrumb">`
  plus matching `BreadcrumbList` JSON-LD. Home, `/admin` and `/checkout` are excluded.
  The product route's own breadcrumb schema was removed so exactly one is emitted.
- **Facts block.** Added in J6 (below); it is what carries the delivery and guarantee
  sentences on category pages, which had no delivery promise in their HTML before.

### J4 — Product schema

`offers` now carries `shippingDetails` (shippingRate 0 GBP, `DefinedRegion` GB,
handling 0-1 day, transit 1-2 days — the 1-2 days follows the delivery engine, since a
Sunday order arrives Tuesday) and `hasMerchantReturnPolicy` (`MerchantReturnPolicy`,
`applicableCountry: GB`, `MerchantReturnNotPermitted` with a description that restates
`/returns`). `merchantReturnDays` is deliberately absent: the policy is at-door only, so
there is no post-delivery window to state.

A real defect found while validating: `aggregateRating` was being filled with the whole
`LocalBusiness` object returned by `aggregateRatingJsonLd()`, which made the Product
invalid. It now carries the `AggregateRating` object directly, and its review nodes no
longer nest a foreign `itemReviewed`. The same bug existed on `/reviews` and was fixed
there too. The rating value and count remain visible on the page (4.86 from 38 reviews),
which is the condition for keeping `aggregateRating`.

### J5 — Organization entity

One Organization block in `__root.tsx`, so it is emitted once on every page: name, url,
`@id`, logo, description, `areaServed: United Kingdom`, `contactPoint` with telephone,
email, areaServed GB. No `legalName` (no registered name is published anywhere on the
site, so it would have been invented), no postal address (none is published), and no
`sameAs` — no social profile URL exists in the codebase, so the key is omitted rather
than guessed. Add real profile URLs to `ORGANIZATION_JSON_LD` when they exist.

Validation across 7 templates: every ld+json block parses, Organization exactly once per
page, BreadcrumbList exactly once per non-home page, 0 problems.

### J6 — citable facts block

`src/components/seo/CitableFacts.tsx`, rendered server-side on every category and product
template as "Key facts": sizes, mattress inclusion, materials, delivery window with the
20:00 cutoff and Monday/bank-holiday exclusion, payment method, guarantee, coverage area.
Wording restates copy already published elsewhere on the site; nothing new is claimed and
no discount, gift or bundle wording appears in it.

### J7 — AI referrer grouping

Not possible in code: GA4 channel groups live in the GA4 property admin, and the property
does not exist yet (container `GTM-K8P8CZL6` still has no GA4 tag). When the property
exists: Admin > Data display > Channel groups > Create new channel group, add a rule
`Session source matches regex chatgpt\.com|perplexity\.ai|copilot\.microsoft\.com|gemini\.google\.com|bing\.com`, name it "AI assistants". Tracked as an owner task, not a code gap.

### J8 — no cloaking

Every template fetched twice with a Googlebot UA and once with a desktop Chrome UA and
compared byte for byte after normalising the router's per-request hydration timestamp
(`u:<ms>`). All 18 are identical; where a page differed between two fetches it also
differed between two identical UAs (time-varying countdown), which the script reports
separately. No user-agent branching exists in the app.

### Verified

- `npx tsc --noEmit`: 31 errors, all pre-existing in untouched files (`products.ts`,
  `__root.tsx`, `admin.*`); none in the files changed here.
- `npx cross-env NITRO_PRESET=vercel vite build`: exit 0.
- 18/18 templates pass the no-JS parity crawl; 0 cloaking differences.
- Structured data: all blocks parse; Product, Organization and BreadcrumbList counts as
  specified.
- Browser smoke at 375px on home, product, category, shop and faqs: no horizontal
  scroll, breadcrumb and facts block visible, no page errors. The only failed requests
  are `/api/analytics` and `/api/meta-capi`, which the local preview shim does not serve
  (real Vercel functions, unchanged by this phase).

### Not done in Phase J / found and left for later

- `/faqs` says beds ship in "3 to 7 business days" while `/delivery` and the delivery
  engine promise next-day before 20:00. A claim conflict, out of scope for J; fix in
  Phase L (claim audit).
- AI referral reporting (J7) needs the GA4 property and the tag first.

### Git and deploy

- Two commits on `seo-build` for Phase J (the generator follow-up included). GitHub push
  was **rejected**: the branch history
  contains `public/voice messages/opencode-desktop-win-x64.exe`, a 251.7 MB installer
  added in `55c4f7c` and deleted later, which exceeds GitHub's 100 MB file limit. See
  "Push blocker" below.
- `.env` and `.env.local` are gitignored and were **not** committed: they hold
  `DATABASE_URL`, `RESEND_API_KEY` and `META_CAPI_ACCESS_TOKEN`. Vercel already has these
  per environment under Settings > Environment Variables.
- Vercel preview deployment `aqbeds-esde8laef` built and verified; `vercel --prod` not run.

### Push blocker (needs an owner decision)

GitHub refuses the branch as-is because of one historical blob. Options: (a) rewrite the
branch history to drop that path — changes every SHA on `seo-build`, which is safe here
because the branch has never been pushed; (b) push a filtered copy to a new branch and
keep local history intact; (c) keep the file and use Git LFS (requires migrating history
and a paid LFS quota for 251 MB). Nothing was rewritten without the owner's word.
- Preview is behind Vercel SSO, so browsers (and the OG/Facebook/Twitter validators)
  cannot reach it from this machine; only `vercel curl` gets through.
- Owner actions: Resend domain verification, `META_CAPI_ACCESS_TOKEN` in Preview, GA4 tag
  in the GTM container, GA4/GSC accounts, PageSpeed Insights API key, named author for
  articles, monitoring destination for alerts.

## Phases K–Q — growth, measurement and compliance (14 Nov 2026)

Seven phases delivered in one pass. Code changes are small and testable; the rest is
documentation that states what is measured and what is blocked, rather than inventing
numbers.

### Code changes

- `src/routes/shop.tsx` — filtered, searched or sorted shop URLs now emit
  `<meta name="robots" content="noindex,follow">`; the canonical stays `/shop`. Verified:
  clean `/shop` has 0 robots tags, `/shop?q=bed` and `/shop?sort=low` are noindex.
- `src/lib/orders.ts` — order idempotency guard: an identical payload (email + total +
  items) inside 3 minutes returns the existing order instead of creating a second one, and
  the endpoint is limited to 6 attempts per IP per 10 minutes. Per instance, not a
  distributed lock.
- `src/lib/auth/index.ts` — admin login limited to 8 attempts per IP per 15 minutes.
- Earlier in the pass (Phase L claim audit): removed "More than 10,000 customers since
  2018" from `/about`, replaced the 10,000+ stat with Free delivery / 20:00 cutoff / Next
  day, corrected the hero badge and the home meta description, and rewrote the FAQ shipping
  answer to match the delivery engine.
- Phase M: `firePurchaseCAPI` now aborts after 6s and retries once on network/timeout/5xx,
  still never blocking the order.

### Documents

- `docs/phase-k.md` + `docs/phase-k-keywords.csv` — 250 sourced keywords from 1,755 live
  Google UK autocomplete queries, clusters, four cannibalisation conflicts, missing
  categories, 12-week calendar. Volume/difficulty left as "unmeasured" with the export
  needed, because no GSC property or Keyword Planner access exists.
- `docs/phase-l.md` — claim audit with before/after, objection matrix, persona map, copy
  variants, owner decisions flagged (not silently deleted).
- `docs/phase-m.md` — UTM taxonomy, event dedup proof, pixel/AEM procedures, env parity
  (`META_CAPI_ACCESS_TOKEN` missing in Preview is a real gap).
- `docs/phase-n.md` — 40 screenshots at 375/390/768/1440, CLS 0.0796–0.0898, no horizontal
  overflow, no missing alt, one H1 per page, size change keeps scroll position, empty/zero
  states present, tap-target and thank-you capture limits stated.
- `docs/phase-o.md` — measured query latency (218 ms warm, 2.4–4.8 s cold), database in
  us-east-1 while the audience is UK, 13 production advisories (12 high), consent verified,
  no secrets in the client bundle.
- `docs/phase-p.md` — KPI sheet with source per metric, one five-step funnel, 13 alerts each
  with a named owner, weekly and monthly templates. GA4 and GSC marked blocked.
- `docs/phase-q.md` + `docs/phase-q-prospects.csv` — 50 real UK prospects, all domains
  checked live, four campaigns, link log schema, Trustpilot recommended against until
  replies can be answered within 48h.

### Verified

- `npx tsc --noEmit` — no new errors in the touched files (`shop.tsx`, `orders.ts`,
  `auth/index.ts`); the 31 pre-existing admin route errors are unchanged.
- `npx cross-env NITRO_PRESET=vercel vite build` — exit 0.
- `tmp/j3-parity.mjs` — 18/18 templates, no non-200, no UA cloaking.
- Rendered HTML checked for the noindex rule and for canonical on category filters.

### Still blocked, owner action required

1. Move the Neon project to eu-west-2 (London) — the single biggest speed win available.
2. GA4 property + GSC property; then Phase K positions and the Phase P funnel become real.
3. `META_CAPI_ACCESS_TOKEN` in the Preview environment.
4. Decide: stock decrement, email-failure persistence, analytics retention, Trustpilot.
5. `npm audit fix` in its own commit, then retest checkout.

## Product and category layout fix (14 Nov 2026)

- Citable "Key facts" is now a collapsed one-line `<details>` instead of a
  seven-row block at the top of the page. It sits below the buy box on product
  pages and below the grid on category pages. The text stays server-rendered, so
  crawlers and answer engines still read every fact.
- Product description split into a lead sentence plus body, with the repeated
  "Free UK delivery · Pay on delivery available · …" tail removed — those facts
  are already badges under the buttons.
- Removed the duplicate breadcrumb on product pages (the site-wide trail already
  renders one).
- Category hero: minimum 360px height on mobile with a stronger gradient and a
  smaller mobile H1, so the intro no longer spills onto a light part of the photo.

## Price rise with a rollback switch, and a confirmation screen that fits (15 Nov 2026)

- Every bed size went up by £50 (divan 2ft with mattress £185 -> £235, 6ft super
  king £290 -> £340; no-mattress £150 -> £200 through £220 -> £270). 15 bed
  products, all sizes, compare-at prices raised with them.
- Both price lists are saved in the database as `PriceSet` rows: **Prices 1**
  (before) and **Prices 2** (after, active). `npm run prices -- use "Prices 1"`
  switches the whole catalogue back in one write; see `docs/price-sets.md`.
- Hardcoded "from £X" copy was brought in line: product metas and descriptions,
  the static catalogue used by header search, the homepage metadata, the hero
  button and the ottoman-vs-divan guide.
- The order-confirmed panel is now its own component, capped at the viewport
  height with its own scroll, 48px buttons and shorter copy. Verified at
  375x667, 390, 768 and 1440 with no clipping and no horizontal scroll.
- The WhatsApp fallback block only appears when the tab was actually blocked.
- Homepage category grid gained a "Track your order" tile.
- Customer order email: "Total Paid (COD)" corrected to "Due on delivery
  (cash)", added the track link and the pay-nothing-today line.
