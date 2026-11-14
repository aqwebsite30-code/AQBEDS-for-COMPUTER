# Phase P — Measurement, alerts and reporting

One KPI sheet, one funnel, alerts that each name a person, and the two report
templates. Everything below is either live in the codebase or explicitly marked
as blocked on an account that does not exist yet — no metric is stated that
nothing can produce.

## The honest state of measurement

| Layer | Status |
|---|---|
| First-party events (`AnalyticsEvent`) | **Live.** PageView, ViewContent, AddToCart, InitiateCheckout, Purchase + value, written server-side. |
| Internal funnel view | **Live.** `src/routes/admin/analytics.tsx` already computes all five steps and revenue with SQL. |
| Meta Pixel + CAPI | **Live**, deduplicated on `event_id` (order id). No Events Manager access here, so match quality is unverified. |
| GA4 property | **Does not exist.** GTM container `GTM-K8P8CZL6` has no GA4 tag. |
| Google Search Console | **No property.** No impression, click or position data exists. |
| Consent | Live and correct — nothing fires before an accepted choice. |

**Consequence:** GA4 and GSC numbers cannot be reported until the owner creates a
GA4 property and a GSC property. Phase K's volume/position columns and Phase P's
GA4 funnel stay unmeasured until then. What follows is the exact specification to
apply, plus the first-party funnel that works today without either account.

## P1 — The KPI sheet

One page. Every row says where the number comes from, so nobody has to trust a
dashboard they cannot explain.

| # | KPI | Definition | Source | Owner | Cadence |
|---|---|---|---|---|---|
| 1 | Orders | Count of `Order` rows created, by `createdAt` (Europe/London) | Postgres `Order` | Abdul | Daily |
| 2 | Revenue | Sum of `Order.total` in GBP for confirmed orders, excluding cancelled | Postgres `Order` | Abdul | Daily |
| 3 | AOV | KPI 2 ÷ KPI 1 | Derived | Abdul | Weekly |
| 4 | Sessions | Distinct `visitorId` with ≥1 PageView in the period | `AnalyticsEvent` | Abdul | Weekly |
| 5 | Order conversion | KPI 1 ÷ KPI 4 | Derived | Abdul | Weekly |
| 6 | Add-to-cart rate | Distinct visitors with AddToCart ÷ KPI 4 | `AnalyticsEvent` | Abdul | Weekly |
| 7 | Checkout start rate | Distinct visitors with InitiateCheckout ÷ KPI 4 | `AnalyticsEvent` | Abdul | Weekly |
| 8 | Paid media ROAS | Revenue attributed to paid campaigns ÷ ad spend | Meta Ads Manager (owner) | Abdul | Weekly |
| 9 | Organic clicks / impressions / avg position | GSC performance report, UK, web | Search Console (**blocked**) | Abdul | Weekly after property exists |
| 10 | Email deliverability | Resend delivered ÷ sent for order emails | Resend dashboard | Abdul | Weekly |
| 11 | Error rate | 5xx responses ÷ total requests | Vercel logs (**no alert, see P3**) | Dev | Daily |
| 12 | DB p95 query time | Warm query latency | Neon console | Dev | Monthly |

Rules that keep the sheet honest:
- One definition per KPI. If the definition changes, the change is dated and the
  old series ends; it is never silently spliced.
- Revenue means money received or confirmed, not basket value.
- Sessions are first-party distinct visitor ids, not GA4 sessions. The two are
  never mixed in one table.

## P2 — One funnel

Canonical five-step funnel, identical in name and order across first-party,
GA4 and Meta:

```
PageView → ViewContent → AddToCart → InitiateCheckout → Purchase
```

GA4 event specification to implement once the property exists (do not rename
these to GA4's recommended ecommerce schema; keep one naming system and map at
the tag level):

| Step | Event | Required params |
|---|---|---|
| 1 | `page_view` (automatic) | `page_location`, `page_referrer` |
| 2 | `view_item` | `item_id`, `item_name`, `price`, `currency` |
| 3 | `add_to_cart` | `item_id`, `quantity`, `value`, `currency` |
| 4 | `begin_checkout` | `value`, `currency`, `items[]` |
| 5 | `purchase` | `transaction_id` (= order id), `value`, `currency`, `items[]` |

- `transaction_id` must equal the `Order.id`, the same value already used as the
  Meta `event_id`. That single key is what lets all three systems be reconciled
  against one order row.
- GA4 measurement ID goes in GTM as a tag fired on the existing dataLayer events;
  no second GTM container and no direct `gtag` calls in components.
- Funnel reporting: GA4 Explorations → Funnel exploration, open funnel, 7-day
  window, broken down by `session_default_channel_group` and by device.
- Until GA4 exists, use the live first-party funnel at `/admin/analytics`, which
  already reports the same five steps and revenue.

## P3 — Alerts, each with one named owner

Owner here is a person, not a team. This is a one-person business, so the same
name appears more than once — that is the point: every alert has exactly one
person who acts on it, and a fallback action if that person is away.

| Alert | Condition | Owner | Channel | Action |
|---|---|---|---|---|
| Order placed | Any `Order` created | Abdul | Email + WhatsApp | Confirm delivery date within 2h |
| Order stuck pending | `status = pending` > 24h | Abdul | Daily digest | Call the customer |
| Payment/CAPI failure | `[CAPI] Purchase failed` in logs | Dev | Email | Check token + order id in Events Manager |
| Checkout error spike | `checkout_error` > 3 in 1h | Dev | Email | Reproduce, then roll back the deploy |
| Order endpoint abuse | 6 attempts/IP hit | Dev | Email | Inspect logs; consider WAF rule |
| Admin login throttle | 8 failures/IP hit | Dev | Email | Block IP at Vercel firewall |
| Email permanent failure | "permanently failed after retry" | Abdul | Email | Resend the confirmation manually |
| 5xx rate | > 1% of requests over 15 min | Dev | Email | Check Vercel logs, roll back if deploy-correlated |
| Site down | Root URL non-200 for 2 min | Dev | Email + SMS | Check Vercel status, redeploy last good |
| DB latency | Warm p95 > 500 ms for 1h | Dev | Email | Check Neon region/compute |
| Spend anomaly | Meta spend > £50/day or CPA > 2× target | Abdul | Email | Pause campaign |
| GA4 traffic drop | Sessions −40% week on week | Abdul | Weekly report | Check indexing, GSC, ads |
| Review unanswered | New review with no reply > 48h | Abdul | Email | Reply (only if the answering commitment is kept) |

Fallback rule: if the named owner has not acted within 24 hours on a
revenue-affecting alert (orders, checkout, site down), pause paid spend until it
is resolved. That is the only safe default when one person wears every hat.

Implementation today: alerts 1–2 come from an admin digest query; 3–8 come from
log drains or a scheduled log query; 9 needs an external uptime pinger; 11 needs
a scheduled Meta API check. None of these are configured — the table is the
specification. **Monitoring is not live; the error sink is Vercel's console log
with 1-day retention** (see Phase O7).

## P4 — Weekly report template

Send every Monday for the previous Mon–Sun.

```
AQ Beds — week of <date>
1. Headline: <orders> orders, £<revenue>, AOV £<aov>
2. Traffic: <sessions> sessions; top 3 sources by orders
3. Funnel: view <n> → cart <n> (<x>%) → checkout <n> (<x>%) → purchase <n> (<x>%)
4. Paid: spend £<n>, ROAS <x>, best ad <name>, worst ad <name>
5. Organic: GSC clicks <n>, impressions <n>, avg position <n> (or "no property")
6. Money page: top product by revenue, top category by orders
7. What broke: incidents, failed emails, deploy rollbacks
8. Three actions for next week, each with an owner and a date
9. One number to watch: <metric> because <reason>
```

## P5 — Monthly report template

```
AQ Beds — <month>
1. Scoreboard: orders, revenue, AOV, conversion, sessions — this month vs last
2. Channel mix: % of orders by source, with spend and ROAS for paid
3. SEO: pages gaining/losing clicks, new pages indexed, queries entering top 10
4. Content: pages published, links earned (from the Phase Q log)
5. Customer: top 3 objections heard, top 3 requested products/sizes
6. Reliability: uptime, 5xx count, email failures, DB latency trend
7. Decisions: what changed in pricing/offer/copy and why
8. Next month: three bets, expected effect, how success is measured
```

## P6 — Dashboard spec (build only after GA4 exists)

One screen, in this order: revenue + orders today/week/month, funnel with step
drop-offs, channel table (sessions, orders, revenue, ROAS), product table (views,
adds, orders, revenue), and a data-quality strip (events received last hour,
last order age, email failures). Nothing on the screen without a definition in
P1. A dashboard showing numbers nobody can explain is worse than no dashboard.

## Blocked, with the exact unblock

1. **GA4 property** — create one, add the GA4 tag in GTM `GTM-K8P8CZL6` using the
   P2 event names, then the funnel and the monthly organic section become real.
2. **Search Console property** — verify `aqbeds.com`, submit
   `https://www.aqbeds.com/sitemap.xml`, then Phase K's position/volume columns
   can be filled from real data.
3. **Alert delivery** — choose a channel (email via Resend is already configured,
   SMS needs a provider) and a log sink; until then alerts 3–12 are manual.
