# AQ Beds — SEO, AEO, CRO and measurement plan (Phases F, G, H)

Written from this site's own routes, copy and review data. No search volume is stated
anywhere in this document because no Search Console or Keyword Planner access was
available in this run — every volume cell is marked BLOCKED and must be filled from those
two sources. Nothing here is invented.

## F1 — Keyword map

Intent key: C = commercial (ready to buy), I = informational, T = transactional/local.

| URL | Primary keyword | Secondary keywords | Intent | Target words | Links in | Links out |
| --- | --- | --- | --- | --- | --- | --- |
| / | beds uk, bed frames uk | handcrafted beds uk, beds direct from manufacturer | C | 900 | header, footer, every guide | shop, 8 categories, guides, size guide |
| /shop | beds and sofas | bed frames, ottoman beds uk, divan beds | C | 700 | header, footer, home | all products, all categories |
| /category/ottoman-beds | ottoman beds | gas lift storage bed, ottoman bed with mattress, storage bed uk | C | 1200 | home, shop, guides, PDPs | products, divan-beds, size-guide, FAQs |
| /category/divan-beds | divan beds | divan bed with drawers, divan base and mattress | C | 1200 | home, shop, PDPs | products, ottoman-beds, size-guide |
| /category/luxury-beds | luxury beds | velvet bed frame, wingback bed, sleigh bed uk | C | 1100 | home, shop, PDPs | products, ottoman-beds, guides |
| /category/sofas | velvet sofas | chesterfield sofa uk, sofa bed uk | C | 900 | home, shop, PDPs | products, sofas guide |
| /category/wardrobes | wardrobes | sliding wardrobe uk, bedroom wardrobe | C | 900 | home, shop | products, bedroom-furniture |
| /category/sliding-wardrobes | sliding wardrobes | mirrored sliding wardrobe, fitted look wardrobe | C | 900 | home, shop, wardrobes | products, bedroom-furniture |
| /category/bedroom-furniture | bedroom furniture sets | bedside table, chest of drawers uk | C | 800 | home, shop | wardrobes, beds |
| /product/* (32) | {model} bed | {model} ottoman bed, {model} bed dimensions, {model} bed price | C | 400 unique | category grid, related products, guides | category, 2 related products, size-guide |
| /size-guide | bed sizes uk | single bed size, super king size, bed size chart cm | I | 1400 | footer, PDPs, categories | category pages, guides |
| /delivery | next day bed delivery uk | free uk delivery beds, bed delivery cut off time | T | 800 | footer, PDPs, checkout | shop, returns, FAQs |
| /returns | bed returns uk | faulty bed replacement, 14 day returns | T | 600 | footer, delivery | delivery, FAQs, contact |
| /faqs | bed buying faqs | cash on delivery beds, mattress included | I | 900 | footer, delivery | categories, size-guide, contact |
| /reviews | aq beds reviews | bed shop reviews uk | C | 500 + review text | footer, home, PDPs | products, contact |
| /guides/ottoman-vs-divan | ottoman vs divan bed | which bed has more storage, ottoman or divan | I | 1800 | guides hub, categories | 3 products, both categories |
| /guides/bed-sizes-uk | bed size guide uk | what size bed for two people, king vs super king | I | 1500 | guides hub, size-guide | 3 products, categories |
| /about | aq beds uk | handcrafted beds since 2018 | I | 500 | footer | shop, contact, reviews |
| /contact | contact aq beds | bed shop phone number uk | T | 300 | footer | shop, track, delivery |

Conflicts checked:

- /shop and /category/all-beds target the same head term. The category canonicalises to
  /shop, so it is excluded from the sitemap in this branch and must stay noindex-free but
  unlinked from the header.
- storage-beds, mattresses and headboards are noindex in the catalogue; they must never
  appear in the sitemap or internal body copy as link targets.
- No two product URLs share a primary keyword; each uses its model name.
- /guides/bed-sizes-uk and /size-guide both touch size terms — the guide gets
  informational queries (king vs super king), the tool page keeps "bed sizes uk".
  Whichever ranks first, the other links to it rather than repeating the table.

## F2 — Category template

Current: H1 from the category name, an intro paragraph, product grid, four-question FAQ
where the category has one, size and delivery blocks. Gaps against the brief: the intro is
60-120 words rather than a 40-60 word answer-first summary followed by a 200-300 word
"how to choose" block, and the FAQ is not emitted as FAQPage schema on category templates.
Both are copy-only changes that need the owner to approve new category prose; no specs can
be invented, so the blocks must be written from the existing product facts.

## F3 — Product template

Working: model name, price, size/colour selectors, stock and delivery promise, primary CTA,
trust facts, dimensions, what is included, delivery rules, review quotes, related products.
Missing: shippingDetails and hasMerchantReturnPolicy in schema (D5), and the aggregateRating
node is currently the whole LocalBusiness object — see E list. Word count per product is
300-500 unique words for the 32 catalogue items, so the 250-word floor is met.

## F4 — Guide queue

Drafted in this run: none of the new guides — a 1,200-word guide per topic is a content
decision that must be written from real product facts and reviewed by the owner, not
generated inside a technical pass. /guides hub does not exist yet either (the only live
guide is /guides/ottoman-vs-divan, reached from the footer).

Order and target lengths, ready for a writing pass:

1. Bed size guide UK — 1,400 words. Facts already on /size-guide.
2. How to measure your room for a bed — 1,200 words.
3. Gas lift storage explained — 1,300 words. Facts on /category/ottoman-beds.
4. Mattress firmness explained — 1,200 words.
5. How next-day UK delivery works — 1,200 words. Cutoff 20:00 Europe/London, Mon-Sat.
6. Bed frame fabrics and care — 1,300 words. Velvet and plush ranges only.

Author: BLOCKED — no named person supplied. Use the business as author until the owner
supplies a real name, role and one-line bio. Never invent an author.

## F5 — AEO / GEO

- /llms.txt and /llms-full.txt added (llms-full regenerated at build from the catalogue).
- Answer-first paragraphs exist on category intros; the 40-60 word rewrite is pending copy.
- Entity consistency: "AQ Beds", https://www.aqbeds.com, +44 7519 791128, info@aqbeds.com
  are used identically in footer, contact, llms files and Organization schema.
- Organization sameAs: only profiles that exist. BLOCKED — no verified social profile URLs
  were supplied; the schema must not list invented ones.

## G1 — Ad-to-landing match

BLOCKED — no live ad creatives or account access. Once supplied, the check is: headline in
the ad's first line appears in the page's H1 or first screen; price and delivery promise in
the ad match the PDP. Fix the page, never the promise.

## G2/G3 — Product and checkout CRO status

Measured on the production build at 375px and 1440px in this run:

- Price and delivery promise sit above the fold on PDP; one primary CTA; guarantee line
  directly above the button on checkout.
- Selectors keep scroll position (no jump observed).
- Cart totals are visible in the drawer; checkout is single column, sticky Place Order on
  mobile, delivery date and pay-on-delivery line above the button.
- Remaining risk: /shop issues a 307 to a query string carrying empty filter arrays
  (`?cat=[]&size=[]...`) on the current build. That is an indexable duplicate of /shop and
  must be fixed before the branch ships. Reported, not fixed, because the cause is the
  route's search-parameter validation and needs a decision on filter defaults.

## G4 — Post-purchase sequence (defined, not wired)

Blocked on domain verification, so nothing is scheduled. The sequence:

1. Immediately on order: "Order {id} confirmed" — items, total, chosen delivery date,
   track link /track?token=, WhatsApp link, pay-on-delivery reminder. No emojis.
2. Morning of delivery date: "Your bed is being delivered today" — same order id, driver
   contact route, what to have ready.
3. Delivery date + 3 days: review request — one link to /reviews, no incentive, no
   discount. Never buy, never edit, never delete a review.
4. Delivery date + 14 days: one cross-sell (mattress or headboard matching the frame),
   no discount framing.

Sender must be orders@aqbeds.com on the verified domain. onboarding@resend.dev is never
used.

## G5 — Personas (from this site's own reviews and catalogue)

1. First-home buyer — searches "cheap bed with mattress", "divan bed under £300". Fears
   paying before seeing the bed, and a mattress that arrives separate. Needs cash on
   delivery, a mattress included, delivery date chosen at checkout. Lands on
   /category/divan-beds or /shop sorted low-to-high. Objection map: price → price and
   included mattress block; trust → 41 reviews, guarantee line; delivery → next-day promise
   above the CTA.
2. Family upgrader — searches "super king ottoman bed", "bed with storage for bedding".
   Fears losing floor space and a frame that squeaks. Needs gas-lift storage capacity,
   dimensions against the room, replacement-if-faulty. Lands on /category/ottoman-beds and
   /size-guide. Objection map: size → dimensions table and size guide; storage → lift-up
   explanation; risk → door inspection and free replacement.
3. Style-led buyer — searches "velvet wingback bed", "gold trim bed frame". Fears the
   colour looking different in the room and a cheap finish. Needs fabric swatch names,
   colour range per model, close-up imagery. Lands on /category/luxury-beds and specific
   model pages. Objection map: finish → material and colour sections; comparison → related
   products; confidence → reviews with photos where they exist.

No discount framing anywhere in these journeys.

## H1 — GA4 events

Implemented in code (`src/lib/analytics.ts`, `src/lib/meta-capi.ts`): page_view, view_item,
add_to_cart, begin_checkout, purchase, generate_lead (WhatsApp clicks), checkout_error.
Parameters required on purchase: value, currency GBP, transaction_id (order id), items.
Consent: nothing fires before an Accept (Phase B). GA4 only receives data when the GTM
container `GTM-K8P8CZL6` exists and contains the GA4 tag — the container was reachable at
run time but fired no collect request in the capture, so the container's tag configuration
must be checked by the owner. BLOCKED on GA4 property access.

## H2 — Key events and funnel

Mark purchase and generate_lead as key events in GA4 admin (owner action, no API access).
Funnel exploration: Session start → view_item → add_to_cart → begin_checkout → purchase,
broken down by device category.

## H3 — Search Console

BLOCKED — no GSC property access. On access: submit https://www.aqbeds.com/sitemap.xml
(now regenerated per deploy), confirm the sitemap is fetched without errors, check
Coverage for the noindex utility routes, and read Core Web Vitals from the field data.

## H4 — Weekly report template

Columns: week, sessions, orders, revenue, conversion by step (view_item → add_to_cart →
begin_checkout → purchase), top 10 queries, top 10 landing pages, CWV status (LCP/CLS/INP),
index errors, CAPI success rate, email delivery failures.

## H5 — Rank tracking

30 keywords, all already in the F1 table as primary or secondary terms: beds uk, bed frames
uk, handcrafted beds uk, ottoman beds, gas lift storage bed, ottoman bed with mattress,
divan beds, divan bed with drawers, divan base and mattress, luxury beds, velvet bed frame,
wingback bed, sleigh bed uk, velvet sofas, chesterfield sofa uk, sofa bed uk, wardrobes,
sliding wardrobes, mirrored sliding wardrobe, bedroom furniture sets, bed sizes uk, single
bed size, super king size, bed size chart cm, next day bed delivery uk, free uk delivery
beds, bed delivery cut off time, bed returns uk, cash on delivery beds, ottoman vs divan
bed. Current positions: BLOCKED (needs GSC or a rank tracker).

## H6 — Alerts

| Alert | Threshold | Notified |
| --- | --- | --- |
| Conversion rate drop | > 30% day on day | owner email + WhatsApp |
| CAPI failures | any 4xx/5xx from /api/meta-capi in 15 min | owner email |
| Email failures | any Resend non-2xx | owner email |
| 5xx spike | > 5 in 5 min | owner email |
| Checkout errors | checkout_error rate > 3% of begin_checkout | owner email |

All five are BLOCKED on a monitoring destination (no Sentry/uptime account in this project).
They are defined here so the owner can approve one tool; nothing is invented or wired.
