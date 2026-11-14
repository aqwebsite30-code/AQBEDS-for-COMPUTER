# Phase M — Creative-to-landing match, pixel and CAPI hygiene

Status: **M2, M3, M6, M7 done from code and deployment config. M1, M4, M5 cannot
be completed from this environment** — they live in the Meta ad account and
Events Manager, which this machine has no access to. Each is written as an exact
procedure so it can be finished in ten minutes with the account open.

## M1 — Creative-to-landing-page matrix

Not completed: there is no Meta ad account access here, so "for every live ad"
cannot be enumerated. Inventing ad ids would be worse than leaving it open.

Template to fill (one row per live ad):

| Ad id | Ad name | Creative hook | Landing URL | Landing H1 | First three lines | Score 1–5 | Fix |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

Scoring rule from the brief: below 4 is a page fix, not an ad fix. The pages
that will be scored are already known-good landing targets: `/category/ottoman-beds`,
`/category/divan-beds`, `/category/luxury-beds`, `/product/ambessador`,
`/product/panel-line`, `/shop`.

What is already true and helps: every landing page in the bed range now states
the same three facts in its first screen — free UK delivery, next-day before
20:00, cash on delivery — so a creative promising any of those matches the page.

## M2 — UTM taxonomy (defined; application not verifiable here)

One scheme, no exceptions:

```
utm_source=facebook
utm_medium=paid_social
utm_campaign={{campaign.name}}
utm_content={{ad.name}}
utm_term={{adset.name}}
```

Rules:
- Lowercase, no spaces (Meta replaces spaces with `%20`, which fragments reports).
- Never hardcode a date or a "v2" into `utm_campaign`; the campaign name is the key.
- Every ad destination URL must carry all five.

Current live URLs: **not auditable from here** (no ad account). Audit method:
Ads Manager → Ads → select all → Edit → "Tracking" section; anything absent is
listed and fixed in one bulk edit. Nothing in the site strips or rewrites query
parameters, so tagged URLs survive to GA4 untouched.

## M3 — Event deduplication (proven in code)

The browser pixel and the Conversions API send **the same event id, value and
currency** for a purchase:

| Path | File | Event name | event_id | value | currency |
|---|---|---|---|---|---|
| Browser pixel | `src/routes/checkout.tsx` (~line 328) | `Purchase` | `orderId` (`{ eventID: orderId }`) | `total()` | GBP |
| Server CAPI | `src/lib/orders.ts` (`firePurchaseCAPI`) | `Purchase` | `order.id` | `parsed.total` | GBP |

`orderId` returned by `saveOrder` **is** `order.id`, so the two events carry a
byte-identical id. Meta deduplicates on `event_name` + `event_id`, so one order
counts as one Purchase.

Guard rails already in the code:
- `purchaseFired.current` prevents a second pixel fire on re-render.
- The WhatsApp lead path sends `Contact`, **not** `Purchase`, so a WhatsApp open
  can never inflate purchases (`src/lib/whatsapp-lead.js` header comment).
- The server `Purchase` is not awaited by the order response, so a slow Meta
  call cannot delay the customer's confirmation.

**What still needs a human:** one real test order with the Meta Test Events tab
open, confirming a single Purchase appears with the order id. That requires the
ad account and a live test event code; it is the only part of M3 that code
cannot prove.

## M4 — Pixel settings (report only, nothing changed)

Pixel id `1109711544904339` is hardcoded as the fallback in `src/lib/orders.ts`
and `api/meta-capi.js`. `allowDuplicatePageViews` and `disablePushState` are
properties of the pixel installation in Events Manager / the base code snippet,
not of this application — they are **not set anywhere in this repository**, so
they are at Meta's defaults, which cannot be read without account access.

Risk of each, stated plainly:
- **`allowDuplicatePageViews = true`** — fires PageView again on SPA route
  changes. This is a TanStack Router SPA, so *enabling* it duplicates every
  in-app navigation. Current risk: low (default off), but the base snippet must
  be checked by hand on the production site.
- **`disablePushState = true`** — stops the pixel hooking `history.pushState`.
  With automatic PageView, this suppresses route-change PageViews entirely.
  Turning it on would undercount pages, not overcount.

Recommendation: leave both at default, and verify by viewing Page Source for
`fbq('init'` on production rather than trusting this note. Change nothing
without owner approval, per the brief.

## M5 — Aggregated Event Measurement

Priority order lives in Events Manager → Aggregated Event Measurement. Not
readable from here. Requirement to confirm with the account open: **Purchase is
first**, then InitiateCheckout, AddToCart, ViewContent, PageView. If Purchase is
not first, iOS attribution for purchases is lost first.

## M6 — Failure handling (fixed in this pass)

Before: `firePurchaseCAPI` used a bare `fetch` with no timeout and no retry. A
hung Meta request could sit for the platform default (tens of seconds) and every
failure was a single console line.

After (`src/lib/orders.ts`):
- **Timeout**: `AbortController`, 6 seconds per attempt.
- **Retry**: one retry on network failure, timeout, or any 5xx.
- **Isolation**: the call is already `.catch(() => {})` from the order path and
  the order row is written *before* it runs, so a CAPI failure can never block,
  roll back, or duplicate an order. That ordering is the proof, not a claim.
- **Logging**: every failure logs the event name and status; successes log
  `events_received`, the IP presence, fbc presence and the test event code.

Remaining gap: those logs go to Vercel function logs only. There is no alert on
a CAPI failure — carried into Phase P (alerts) and Phase O (monitoring gap).

## M7 — Environment parity (checked; one real gap)

From `vercel env ls` for `abdulraheem1/aqbeds` (names only, no values printed):

| Variable | Production | Preview | Needed for |
|---|---|---|---|
| `DATABASE_URL` | yes | yes | orders |
| `DIRECT_URL` | yes | yes | migrations |
| `JWT_SECRET` | yes | yes | admin auth |
| `RESEND_API_KEY` | yes | yes | order email |
| `GEMINI_API_KEY` | yes | yes | AI chat |
| `GEMINI_MODEL` | yes | **no** | AI chat model override |
| `META_CAPI_ACCESS_TOKEN` | yes | **no** | **Purchase dedup on preview** |

**Gap: `META_CAPI_ACCESS_TOKEN` is Production-only.** On any preview deployment
the server-side Purchase silently drops (`[CAPI] META_CAPI_ACCESS_TOKEN not set
— Purchase dropped`), while the browser pixel still fires. Preview is therefore
a poor place to test purchase tracking, and any QA done there under-reports
purchases. Fix: add the token to Preview, or accept that preview shows pixel-only
purchases and never treat preview numbers as complete.

`GEMINI_MODEL` missing in Preview is cosmetic — the code falls back to a default
model.

No `META_PIXEL_ID` is set in either scope; the code's hardcoded fallback
`1109711544904339` is used. That is fine today, but it means a test pixel cannot
be swapped in without a code change. Recommend adding `META_PIXEL_ID` to both
scopes as an owner task.
