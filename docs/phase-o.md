# Phase O — Backend, data and compliance audit

Two defects fixed in code, one high-impact infrastructure finding, and a list of
gaps with named decisions. Everything below was measured on this branch, not
assumed.

## O1 — One order per click

**Before:** `saveOrder` (`src/lib/orders.ts`) created a row on every call. The
checkout button had an `isSubmitting` guard, but a double-tap, a retried fetch or
a customer pressing back and resubmitting could create two orders with two
references and two Purchase events.

**After (shipped):**

1. **Dedupe window.** Any identical payload — same email, total and item JSON —
   inside 3 minutes returns the existing order (`deduplicated: true`) and fires
   nothing else, so no second email and no second CAPI Purchase.
2. **Attempt limit.** Six order attempts per IP per 10 minutes, then a clear
   message pointing at WhatsApp.

**Known limit, stated plainly:** both guards are per server instance, not a
distributed lock, and there is no `idempotencyKey` column on `Order`. A second
Vercel instance handling the retry would still create a second row. The correct
long-term fix is a unique `idempotencyKey` column generated client-side per
checkout, which needs a migration — queued, not claimed.

## O2 — Email failure isolation

- Order is written first; the confirmation email is fire-and-forget.
- `sendOrderEmailWithRetry` (`src/routes/checkout.tsx` ~line 58) attempts twice
  with a 2s gap, logs `orderId` + attempt on each failure, and logs
  "permanently failed after retry" without ever throwing into the order path.
- **Gap:** the permanent-failure case leaves no record except a console line that
  Vercel keeps for 1 day on Hobby. There is no dead-letter store and no alert.
  Decision needed: add an `emailStatus` field to `Order` (migration) or accept
  that failed confirmations are found by the customer contacting you.

## O3 — Stock and consistency

- Product page: CTA disabled when `product.stock <= 0`; delivery headline comes
  from the same product row via `delivery-date.ts`, so copy and stock agree.
- **Gap:** `saveOrder` never decrements `stock`, so two customers can buy the
  last bed. With 32 products and one-person fulfilment this is currently masked
  by manual stock edits. Decision needed: decrement on order (with a transaction)
  or move to made-to-order and stop calling it stock.

## O4 — Database performance (highest-impact finding)

Measured against the live Neon database this branch uses:

| Query | Cold | Warm |
|---|---|---|
| `order.findMany` by `createdAt desc` limit 20 | 4044 ms | 2142 ms |
| `order.findFirst` by `customerEmail` | 469 ms | 452 ms |
| `order.findFirst` by `reference` | 470 ms | 454 ms |
| `product.findMany` (catalogue) | 462 ms | 469 ms |
| `analyticsEvent.count` last 30d | 530 ms | 489 ms |

Repeated identical queries settle at **~218 ms per round trip**. This is not a
missing index: `EXPLAIN (ANALYZE)` on `Order ORDER BY "createdAt" DESC` shows a
sequential scan over 26 rows in **0.089 ms** server-side. The time is network
distance — the database endpoint is `...us-east-1.aws.neon.tech` while the
audience and the operator are in the UK.

**Indexes:** `Order.reference` is unique (indexed). `Order.createdAt` and
`Order.customerEmail` are not indexed; at 26 rows the planner is right to ignore
them. Revisit at ~5,000 orders, not now.

**Recommendation (owner action, not a code change):** move the Neon project to
`eu-west-2` (London). Every product page view pays this latency several times
over. Nothing in this repository needs to change for the move beyond the
`DATABASE_URL` / `DIRECT_URL` values.

## O5 — Rate limiting

Already present before this pass: `/api/analytics`, `/api/ai-chat`,
`/api/admin/whatsapp-lead`, `/api/track`.

Added in this pass:
- `saveOrder` — 6 attempts / IP / 10 min.
- `loginAdmin` (`src/lib/auth/index.ts`) — 8 attempts / IP / 15 min. A single
  shared admin key with bcrypt and no throttle was the weakest surface on the
  site.

Still unthrottled: `changeAdminPassword` / `resetAdminPassword` (both require a
valid JWT, so a brute-force is not the risk), and site search (read-only).

## O6 — Secrets

Scanned the production client bundle (`dist/client`) for `META_CAPI_ACCESS_TOKEN`,
`RESEND_API_KEY` and `postgresql://`: **0 matches**. All three are read only in
server functions. `ADMIN_EMAIL`, `JWT_SECRET` and the CAPI token never reach the
browser. Pass.

## O7 — Monitoring

- `src/lib/error-capture.ts` records the original SSR error out-of-band so
  `src/server.ts` can log the real stack when h3 replaces it with a generic 500.
- **Gap:** everything lands in `console.error` → Vercel runtime logs only. No
  external sink, no alert, nobody is paged. Vercel Hobby retains logs for a day.
  Decision needed (Phase P carries the alert design): add a log drain or a
  hosted error tracker. Listed as a gap with an owner decision, not as "monitoring
  live".

## O8 — Consent

- Consent Mode v2 defaults (`denied` for analytics and ads storage) are pushed
  **before** `gtm.js` loads (`src/lib/consent.ts`, `CONSENT_BOOTSTRAP` rendered
  ahead of the container in `__root.tsx`). The container itself only loads after
  an accepted choice.
- `meta-pixel.ts` imports `hasAdConsent` and does not fire without it.
- The choice is stored in `localStorage` under `aq_cookie_consent`
  (`"accepted" | "rejected"`), and the banner is re-openable.
- Pass. No analytics or ad tag is requested before a decision.

## O9 — Dependencies (`npm audit --omit=dev`)

13 advisories in production dependencies: **12 high, 1 moderate, 0 critical**:

```
deepmerge-ts <8.0.0        sharp <=0.35.5-rc.1     vite 7.0.0 - 7.3.6
fast-uri 3.0.0 - 3.1.8     source-map-js 1.0.0-1.2.1   zod <4.6.6
seroval <=1.6.10           undici 7.0.0 - 7.30.0
```

Most are build-time or transitive (`vite`, `seroval`, `source-map-js`), and
`zod`/`undici` fixes are patch-level. Not fixed in this pass: a dependency bump
deserves its own commit and a fresh build, and a rushed bump on the order path is
the wrong trade. Run `npm audit fix` (no `--force`), then rebuild and retest
checkout.

## O10 — Privacy and retention

- `prisma/schema.prisma` stores orders (name, email, phone, address, items) and
  `AnalyticsEvent` rows with no retention policy or purge job.
- UK tax requires order records for 6 years; analytics events have no such need.
- Decision needed: a scheduled job deleting `AnalyticsEvent` older than 14 months
  (and `WhatsAppLead` older than 24), documented on the privacy page. The privacy
  page currently makes no retention claim beyond "as long as needed", which is
  vague but not false.

## Before / after

| Item | Before | After |
|---|---|---|
| Duplicate order on double submit | Possible | Blocked inside the 3-minute window (per instance) |
| Order endpoint abuse | No limit | 6 attempts / IP / 10 min |
| Admin brute force | No limit | 8 attempts / IP / 15 min |
| Secrets in client bundle | — | Verified absent |
| Consent before tags | — | Verified: denied defaults precede GTM |
| DB latency | ~450 ms/query cold, 218 ms warm | Unchanged — owner must move Neon region |
| Prod vulnerabilities | 13 (12 high) | Documented, fix queued |

## Queued with an owner decision

1. Move Neon to `eu-west-2`.
2. `idempotencyKey` column for true exactly-once ordering.
3. Email failure persistence or alert.
4. Stock decrement (or drop the stock claim).
5. Log drain / error tracker.
6. `npm audit fix` in its own commit.
7. Analytics retention job + privacy page wording.
