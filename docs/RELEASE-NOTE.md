# Release note — seo-build

Branch: `seo-build` (local only, not pushed). Production untouched; the owner runs
`vercel --prod`.

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
- `/llms.txt` added; `/llms-full.txt` generated at build from the catalogue.
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
- Preview is behind Vercel SSO, so browsers (and the OG/Facebook/Twitter validators)
  cannot reach it from this machine; only `vercel curl` gets through.
- Owner actions: Resend domain verification, `META_CAPI_ACCESS_TOKEN` in Preview, GA4 tag
  in the GTM container, GA4/GSC accounts, PageSpeed Insights API key, named author for
  articles, monitoring destination for alerts.
