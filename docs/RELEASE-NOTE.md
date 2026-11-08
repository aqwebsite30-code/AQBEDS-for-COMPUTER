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

## Known defects found, not fixed

- `/shop` responds 307 to a query string of empty filter arrays; an indexable duplicate.
- No reviews/aggregateRating node bug: the Product block receives a LocalBusiness object.
- Place Order sits below the fold at 375px (y=2777, viewport 812) and at 1440 (y=2346).
- React hydration error #418 at 1440 on checkout.

## Blocked

See the blocked list in the run report.
