# Phase L — Offers, value architecture and personas

Status: **complete.** Three claim conflicts were fixed in code; the rest are
listed with a decision for the owner.

## L1 — The offer, built only from what is true today

No discount code, no price change, no gift, no bundle, no exit popup. The offer
is the operating model itself, and every part of it is already enforced by code:

| Offer element | Where it is real |
|---|---|
| Free UK delivery, every order | `/delivery`, `llms.txt`, checkout copy |
| Next-day when confirmed Mon–Sat before 20:00 Europe/London | `src/lib/delivery-date.ts` (`UK_CUTOFF_HOUR = 20`), product schema `shippingDetails` |
| Sunday orders arrive Tuesday; Monday and bank holidays are not delivery days | same engine, `SUNDAY_OPTION` |
| Inspect at the door before paying | checkout, `/returns`, product page |
| Cash on delivery only, nothing paid online | checkout, `/returns`, `llms.txt` |
| Free next-day replacement if faulty | `/returns`, product page, F1 |
| Mattress included where it genuinely is | product sizes, per-size pricing |

Nothing in this list needs a promotion to be true. That is the point: the offer
survives a bad month, a discount campaign does not.

## L2 — Claim audit (before / after)

Evidence bases used: `Order` table (26 rows, first order 2026-07-17), `WhatsAppLead`
(17 rows), `data/reviews.json` (41 reviews), `src/lib/delivery-date.ts` (the
delivery engine), and the product table (32 rows, minimum price £185).

| # | Claim | Location | Provable? | Action |
|---|---|---|---|---|
| 1 | "More than 10,000 customers have slept on one since" | `about.tsx` story | **No — contradicted.** The database holds 26 orders and 17 WhatsApp leads | **Removed.** Replaced with "Every order is inspected with you at the door before you pay." |
| 2 | Stat "10,000+ / customers since 2018" | `about.tsx` proof grid | **No — contradicted** | **Replaced** with Free / UK delivery, 20:00 cut-off, Next Day replacement. Order: 32 products, Free UK delivery, 20:00 cut-off, Next Day replacement |
| 3 | "10,000+ Beds Delivered Across the UK" | `HeroCarousel.tsx` | **No — contradicted** | **Replaced** with "Free UK delivery · Cash on delivery · Next day before 20:00" |
| 4 | "10,000+ happy customers" | `index.tsx` meta description and og:description | **No — contradicted** | **Removed** from both |
| 5 | "Beds and mattresses typically ship within 3 to 7 business days. Sofas 5 to 10 business days. Made-to-order 2–4 weeks" | `faqs.tsx` | **No — contradicts the engine** and `/delivery` | **Replaced** with the engine's actual rule: next day on Mon–Sat before 20:00, Sunday to Tuesday, Monday and bank holidays excluded |
| 6 | "Started in 2018" / "Since 2018" / "Est. 2018" | about, home, hero | **Unverified** — no registration, domain or order record before July 2026 in this repository | **Needs owner decision.** Kept, because a founding year is the owner's own fact to assert and removing it would destroy brand history. If it cannot be evidenced (Companies House, domain whois, first invoice), it must go. |
| 7 | "Handcrafted" (meta titles, product titles, footer, about) | many | **Unverified** — no supplier or manufacturing record in the repo | **Needs owner decision.** Two options: keep and be able to describe the process, or switch to "built" / "made to order" and lose nothing factual. Not mass-rewritten without the owner, because a genuine manufacturer deserves the word. |
| 8 | "Change or cancel your order within 24 hours" | `faqs.tsx` | **Unverified** — no code path or policy page supports a 24-hour window | **Needs owner decision.** If retained, `/returns` must state the same window or the FAQ is a promise the site cannot keep. |
| 9 | "Free next-day replacement … no questions, no fees" | product, faqs, returns | **Supported by policy text**, never tested against a real fault | Kept. Recommend the owner log one replacement end to end. |
| 10 | "Premium" / "luxury" | throughout | Subjective descriptor, not a measurable claim | Kept. Flagged as puffery; no number attached. |
| 11 | "from £185" | `index.tsx` meta | **Yes** — minimum product price in the database is £185 | Kept |
| 12 | "32 products in the range" | about | **Yes** — 32 rows in `Product` | Kept |
| 13 | Reviews: 41 reviews, all 4–5 stars | `/reviews`, product schema | **Yes** — matches `data/reviews.json` exactly (40 × 5, 1 × 4) | Kept, and only rendered where the count is visible |

Net result: **five false-by-data claims removed**, one contradiction between
pages fixed, and two claims flagged for an owner decision rather than silently
"fixed" in a way that might damage true brand facts.

## L3 — Objection matrix (evidence from the site's own reviews and orders)

Theme counts across the 41 reviews: delivery 29, quality 26, service 24, colour 12,
price 9, assembly 7, storage 4, size 3. All reviews are 4–5 star, so these are
the things buyers *talk about*, which is the closest thing this site has to
objection evidence.

| Persona | Objection | Evidence | Answered on site? |
|---|---|---|---|
| First-home buyer | "Is an unknown retailer safe?" | service 24, plus cash-on-delivery being the only method | **Yes** — inspect before paying, COD, next-day replacement. `/about`, product page |
| First-home buyer | "Can I afford a bed plus mattress?" | price 9 | **Partly** — mattress-included pricing exists, but no page explains the total-cost case. Gap |
| Family upgrader | "Will it fit my room?" | size 3, storage 4 | **Yes** — `/size-guide`, per-size pricing |
| Family upgrader | "When will it arrive?" | delivery 29 (the single largest theme) | **Yes after fixing** — `/delivery`, and the FAQ now matches the engine |
| Family upgrader | "Do I have to assemble it?" | assembly 7 | **Partly** — reviews mention assembly at delivery; no page states it explicitly as a service. Gap |
| Style-led buyer | "Will the colour match what I saw?" | colour 12 | **Yes** — fabric palettes per product |
| Style-led buyer | "Is the quality real, or is it a photo?" | quality 26 | **Yes** — materials block, reviews. Never described as real photography |
| All | "What if it's faulty?" | delivery/quality mentions | **Yes** — at-door inspection, free next-day replacement, `/returns` |

**Objections with no answer on the site: two.** (1) total cost including a
mattress is never laid out as a comparison; (2) whether assembly is included is
only visible inside reviews, never stated as policy. Both are Phase L punch-list
items for the copy week, not code.

## L4 — Persona-to-page map

### First-home buyer (budget-led, high trust risk)
- Landing: `/category/divan-beds` → cheapest entry, mattress included
- Headline variant: "Your first proper bed, mattress included, from £185"
- Proof: cash on delivery · inspect before you pay · free next-day replacement
- Primary CTA: Choose your size
- Section order: price-with-mattress → delivery promise → COD explainer → reviews → size guide
- Removes the fear of: paying a stranger online before seeing the goods

### Family upgrader (replacing a bed, needs certainty on timing)
- Landing: `/category/ottoman-beds`
- Headline variant: "Storage beds delivered the next day, inspected before you pay"
- Proof: 20:00 cut-off · Sunday-to-Tuesday rule · free delivery to Scotland, Wales and NI
- Primary CTA: Check delivery to your postcode (checkout)
- Section order: delivery promise → storage capacity → sizes → guarantee → reviews
- Removes the fear of: being left without a bed

### Style-led buyer (visual, comparison shopper)
- Landing: `/category/luxury-beds`
- Headline variant: "Velvet, wingback and panelled beds in four fabric families"
- Proof: named fabric palettes · headboard options · colour swatch per product
- Primary CTA: View fabrics
- Section order: gallery → fabric palette → dimensions → delivery → reviews
- Removes the fear of: the delivered item looking nothing like the photo

No discount framing appears in any variant.

## L5 — Landing page copy variants (copy for approval, not shipped as code)

### Category — first-home variant
> **A bed and mattress for £185, delivered free and paid for at your door.**
> Every divan in this range arrives with a mattress included, so there is no
> second purchase to budget for. Choose your size, pick a delivery day, and pay
> the driver in cash once you have inspected the bed. If anything is wrong at
> that moment, it is replaced free the next day.

### Category — family upgrader variant
> **Order before 20:00 and sleep in it tomorrow.**
> Ottoman beds here are storage beds: the base lifts to hold bedding, suitcases
> and the things a family never has room for. Delivery is free anywhere in the
> UK, Monday to Saturday, with Sunday orders arriving on Tuesday. You inspect the
> bed at the door before paying.

### Product — style-led variant
> **Four fabric families, one fixed palette per bed.**
> Choose crushed velvet, plush velvet, chenille or soft matte, then pick the
> headboard that matches your room. What you select is what is delivered: the
> gallery shows the exact fabric and headboard combination for each option, and
> the dimensions are listed above the size selector.

## L6 — Offers that cannot honestly be made

- **Interest-free credit / buy now pay later** — no provider, no agreement.
- **"10,000+ customers" social proof** — contradicted by order data; must not
  return until it is true.
- **Assembly service** — reviews describe assembly happening at delivery, but no
  policy states it, so it cannot be advertised until the owner confirms it.
- **Next-day on sofas and wardrobes** — the delivery engine covers beds; its
  copy should not be stretched to the furniture range without checking stock.
- **Any "sale" that is not a real price change** — the products already carry a
  `salePrice` field; a permanent "sale" would be a misleading reference price and
  is out of bounds.

## Needs owner decision (do not guess)

1. Prove or drop "since 2018".
2. Prove or drop "handcrafted".
3. Keep or drop the 24-hour change/cancel promise, and align `/returns`.
4. Confirm assembly at delivery as a service, or stop implying it.
5. Name a content owner for the Phase K calendar.
