# Phase N — UI, UX and front-end audit

Status: **complete for what is measurable here.** 40 screenshots taken, one
indexing defect found and fixed, and three limitations stated plainly.

Screenshots: `tmp/phase-n/<template>-<width>.png` (10 templates × 375/390/768/1440).
Raw measurements: `tmp/phase-n/results.json`.

## N1 — Screenshot matrix

| Template | Route | 375 | 390 | 768 | 1440 |
|---|---|---|---|---|---|
| Home | `/` | yes | yes | yes | yes |
| Shop | `/shop` | yes | yes | yes | yes |
| Category | `/category/ottoman-beds` | yes | yes | yes | yes |
| Product | `/product/ambessador` | yes | yes | yes | yes |
| Cart | `/cart` | yes | yes | yes | yes |
| Checkout | `/checkout` | yes | yes | yes | yes |
| Track | `/track` | yes | yes | yes | yes |
| Guides hub | `/guides` | yes | yes | yes | yes |
| Guide | `/guides/ottoman-vs-divan` | yes | yes | yes | yes |
| 404 | `/this-page-does-not-exist` | yes | yes | yes | yes |

**Thank-you page: not captured.** It exists only after a real order is written to
the production database, and placing one from here would create a fake order in
live data. It must be captured by hand once, after a real test order. This is a
limitation, not a pass.

## N2 — Layout and touch

- **Horizontal scroll: none** on any template at any of the four widths
  (`scrollWidth - innerWidth` ≤ 1px everywhere).
- **Tap targets under 44px:** the audit counts them rather than pretending they
  do not exist. Counts per template at 375px: home 46, shop 63, category 35,
  product 43, cart 31, checkout 30, track 33, guides 32, 404 32.
  Most are inline text links and 16px checkboxes, which WCAG 2.5.8 does not
  require to be 44px. Genuinely small controls found: the announcement-bar close
  button (14×14), header nav links (36px high), and the search input (40px high).
  Recommended fix, one pass: bump the banner close to 44×44, header link height
  to 44, search input to 44. Not applied here because it changes header layout
  on every page and deserves its own visual review.
- **Sticky mobile CTA:** present on the product template (`Mobile sticky
  add-to-basket bar`, `product.$slug.tsx` ~line 1524) and the cart drawer.
- **Cookie card:** Phase P2 established that the consent bar never covers a
  primary action; the sticky CTA sits above it.

## N3 — Visual stability

Measured CLS with a `layout-shift` PerformanceObserver, mobile viewport, 2.5s
after network idle:

| Page | CLS |
|---|---|
| `/` | 0.0898 |
| `/product/ambessador` | 0.0796 |
| `/category/ottoman-beds` | 0.0803 |

All three are under the 0.1 "good" threshold, but close enough to regress.

- **Images without `width`/`height` attributes:** 15 on home, 16 on product.
  They sit inside fixed-ratio containers (`aspect-[4/5]`, absolute inset-0), so
  the space is reserved by CSS and they do not shift the layout — which is why
  CLS stays under 0.1. Adding intrinsic dimensions would still be the correct
  long-term fix and is queued rather than claimed as done.
- **Fonts:** Inter and Poppins are self-hosted via `@fontsource`, so there is no
  third-party font swap; `font-display` is handled by the package defaults.
- **Banner, cookie card and cart bar** are fixed-position overlays, so they do
  not push content and do not contribute to CLS.

## N4 — Gallery consistency

Automated pixel comparison of "is this the same bed in every gallery image" is
not reliable, and a screenshot cannot prove manufacturing consistency. What can
be stated:

- Every product page has one H1 and a gallery with non-empty, descriptive alt
  text (0 images missing `alt` across all 40 captures).
- The images are **product renders/mockups in fixed fabric palettes**, not
  photography of manufactured stock. Nothing in this audit or in the copy calls
  them real photography.
- Products whose gallery spans multiple colourways are the intended behaviour
  for sofas (palette per fabric); for beds, colour is fixed per product.

**Queued, not passed:** one by-hand pass comparing each product's gallery to its
selected fabric and drawer count. It needs a human eye on 32 products.

## N5 — Selectors and forms

- **Size change does not reset scroll.** Measured on `/product/ambessador` at
  375px: `scrollY` 2393 before, 2393 after selecting Double — delta 0 — and the
  selection text persists. Pass.
- **Checkout validation** uses native constraint validation (`required` on the
  fields) rather than a custom inline error component. Typed values are kept when
  submission is blocked (verified: a filled name survived the rejected submit).
  Native messages are announced by screen readers but are browser-styled, so
  they are not visually consistent across browsers. Recommended: move to the
  existing `error` prop already wired on each field (`waMissing`) so the message
  renders next to the input. Not changed in this pass because checkout is the
  highest-risk surface and needs a visual review with a filled basket.

## N6 — States

| State | Result |
|---|---|
| Empty cart | Present (`/cart` shows an empty-basket message) |
| Search with no matches (`/search?q=zzzzqqq`) | Present (zero-results message) |
| Product grid empty | Cannot occur while the catalogue query succeeds; not separately handled |
| Checkout error | Toast: "We couldn't place your order. Your basket is saved" |
| Loading | Route-level loaders; no skeleton screens |

Gap: no skeleton/loading state for the product grid on slow connections.

## N7 — Accessibility

- **Form labels:** every checkout field has an associated label and an `id`
  (verified in the rendered DOM).
- **Alt text:** 0 images missing the attribute across all captures; 1 decorative
  image uses `alt=""`, which is correct for decoration.
- **Focus visibility:** the theme defines a visible focus ring; tab order follows
  DOM order on the audited routes (no positive `tabindex` found).
- **Contrast:** the primary text/background pairs meet AA; the muted-foreground
  token on `bg-brand/[0.03]` surfaces is the closest call and was not machine
  verified in this pass (no axe run). Stated as unverified rather than passed.
- **Headings:** exactly one `h1` per template, including the 404 page.

## N8 — Facets and pagination (fixed)

Rule now in force:
- **Canonical** is always the clean URL (`/shop`, `/category/<slug>`), never a
  filtered variant. Already true before this pass.
- **noindex,follow** is emitted whenever a filter, search term, sort or price cap
  is active on `/shop`. **Added in this pass** and verified in the served HTML:

```
GET /shop                    → 0 robots meta tags
GET /shop?sort=low           → <meta name="robots" content="noindex,follow">
GET /shop?q=bed              → <meta name="robots" content="noindex,follow">
GET /category/ottoman-beds   → canonical to the clean category URL
```

Unknown sort values (e.g. `?sort=price-desc`) return 307 to `/shop`, so no
endless parameter permutations are indexable.

## N9 — Console and network

Across all 40 captures: **zero page errors, zero hydration errors, zero failed
third-party calls.**

The only failed requests are `/api/analytics` and `/api/meta-capi`, which the
local preview shim does not implement — they are real Vercel functions and are
not a site defect. On the product page the client also logs
`[CAPI] ViewContent fetch failed: Unexpected token '<'` for the same reason (a
404 HTML response instead of JSON), only under the shim.

## Fixes made in this phase

1. `src/routes/shop.tsx` — `head` now takes `match.search` and emits
   `noindex,follow` for any filtered or sorted shop URL.

## Queued with an owner decision

1. Tap-target pass on the header, banner close and search input.
2. Move checkout from native validation to the inline `error` prop.
3. Add intrinsic `width`/`height` to the 31 images identified.
4. Capture the thank-you page after one real order.
5. By-hand gallery consistency check across 32 products.
6. axe-core contrast run.
