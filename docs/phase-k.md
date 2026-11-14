# Phase K — Keyword research with evidence

Status: **complete for K1–K4 and K6; K5 delivered as a recommendation, not a build.**
Sheet: `docs/phase-k-keywords.csv` (250 rows, every row carries its source query).

## Method and sources (K1)

| Source | Used | Rows it can prove |
|---|---|---|
| Google autocomplete, `gl=uk`, `hl=en` | Yes — 1,755 live queries on 2026-11-14 | 250 sheet rows, each stamped with the exact query that returned it |
| Google Autocomplete breadth | Yes | Demand proxy per head term (table below) |
| People Also Ask | No | Requires live SERP access from a UK IP; recorded as owner step |
| Keyword Planner volume bands | No | **No account access from this environment** |
| Search Console positions | No | **No GSC property exists yet** (Phase J/J7 found the same) |
| Competitor category structures | No | Not fetched in this pass; owner step |

Harvest: 11,156 unique UK autocomplete suggestions were collected from 45 seed
terms × 39 modifiers. Those were filtered to bed-relevant queries, stripped of
brand terms (argos, ikea, dunelm, dfs, b&q…), non-UK geographies and alphabet
artefacts such as "bed frame z". The 250-row sheet is a reviewable slice, not
the whole harvest; the raw file is reproducible with `tmp/k-harvest.mjs` and
`tmp/k-build.mjs`.

**No volume and no difficulty number appears in the sheet.** Both columns read
"unmeasured" with the export that would fill them. The brief says never invent a
volume, so the sheet is honest about the gap rather than plausible-looking.

### Autocomplete breadth per head term (demand proxy, not volume)

| Term | Distinct suggestions harvested |
|---|---|
| mattress | 1,443 |
| headboard | 1,298 |
| bed frame | 1,144 |
| ottoman bed | 558 |
| velvet | 540 |
| sofa bed | 426 |
| storage bed | 411 |
| divan bed | 374 |
| bunk bed | 362 |
| wooden bed | 299 |
| kids bed | 290 |
| day bed | 277 |
| metal bed | 265 |
| sleigh bed | 264 |
| tv bed | 251 |
| four poster bed | 182 |
| chesterfield | 143 |
| wingback | 134 |
| guest bed | 94 |
| panel bed | 60 |

Breadth is a signal that a term is actively searched and how many variants it
spawns. It is **not** search volume and must not be reported as such.

## Columns (K2)

`keyword, volume_band, intent, difficulty_band, current_position, target_url,
action, cluster, source`

- **intent**: commercial, transactional (delivery/payment), informational.
- **current_position**: unmeasured — no GSC property, so no position exists yet.
- **action**: `optimise` (existing URL), `create` (no URL exists), `merge`.
- **cluster**: category, size, spec, style, delivery, question.

## Clusters (K3)

| Cluster | Rows | Examples from the sheet |
|---|---|---|
| category (8 head groups) | 60 | ottoman bed with mattress, divan bed with storage, bunk bed uk, sleigh bed |
| size and spec | 85 | 4ft6 bed, super king bed frame, gas lift bed, bed with drawers, no headboard |
| style and material | 40 | crushed velvet bed, wingback bed, chesterfield bed, panel bed leather |
| delivery and payment | 25 | cash on delivery bed, next day delivery bed, free delivery bed, pay on delivery bed |
| question | 40 | are ottoman beds good, what is a divan bed, how to assemble |

Product model terms: covered by 32 product URLs, 24 of which appear in the sheet
(panel line, ambessador, sleigh, bunk beds, oxford, hilton, florida, arizona,
golden wave, luxury cube, alina, sliding wardrobe, divan ottoman, dylan, and the
sofa range). Model terms with no search presence are recorded as "no action".

## Cannibalisation check (K4)

**Result: 4 real conflicts, 0 keyword assigned to two URLs** (the sheet assigns
exactly one target per row, so the check is structural, not cosmetic).

1. **`/shop` vs the category pages — the biggest one.** 100 of 250 rows point at
   `/shop`, including size and spec terms ("4ft6 bed", "bed with drawers") that
   `/category/ottoman-beds`, `/category/divan-beds` and `/category/luxury-beds`
   also serve. `/shop` should own only browse and filter terms; size and spec
   terms belong on the category that actually stocks them.
   *Merge plan:* re-target size/spec rows to the category that stocks the size,
   keep `/shop` for "beds uk", "bed shop", "cheap beds" style browse terms.
2. **`/product/sleigh` vs `/category/luxury-beds`.** 9 sleigh rows point at the
   product, 41 category rows also target sleigh styles. *Rule:* the product page
   owns the model name, the category owns "sleigh bed" as a style head term.
3. **`/product/bunk-beds` vs the missing bunk category.** Bunk terms (11 rows)
   land on a product that happens to be called "Bunk Beds", so it acts as a
   category without being one. *Decision:* promote to `/category/bunk-beds` if a
   second bunk model is ever stocked; until then, keep the product URL.
4. **`/product/divan-ottoman-bed` vs `/category/ottoman-beds`.** 2 rows point at
   the category, and the product name also matches "ottoman bed". *Rule:* the
   category owns the head term; the product must target "divan ottoman bed".

Merges are **documented here, not applied in code** — re-targeting is a content
decision that belongs with the copy, and the brief asks for the plan first.

## Missing categories (K5)

Judged on autocomplete breadth, not on opinion:

| Missing URL | Breadth evidence | Verdict |
|---|---|---|
| `/category/mattress` | 1,443 suggestions | **Highest demand gap.** AQ Beds supplies mattresses with beds but does not sell them alone, so a category cannot be built honestly yet. Owner decision: stock mattresses separately, or keep mattress terms on product pages only. |
| `/category/headboards` | 1,298 suggestions | High demand, no standalone headboard products in the catalogue. Same owner decision. |
| `/category/bed-frames` | 1,144 suggestions | High demand. Recommended next category: most frames already exist as beds without mattresses; needs a "frame only" price option before the URL is honest. |
| `/category/metal-beds` | 265 suggestions | 9 sheet rows have no URL. No metal products in the database, so creating the URL now would be an empty page. |
| `/category/wooden-beds` | 299 suggestions | Same: no products. |
| `/category/kids-beds` | 290 suggestions | Same: no dedicated kids products. |
| `/category/sofa-beds` | 426 suggestions | Distinct from `/category/sofas`, which currently absorbs sofa-bed terms. Splitting is justified when two or more sofa-bed models are listed; today only two exist. |

Recommendation: build **bed frames** first (largest gap that the current stock
can support), then split **sofa beds** out of sofas. Do not create empty
category URLs for metal, wooden or kids beds.

## 90-day content calendar (K6)

Owner column: *Content* = needs a named writer (owner decision, Phase J already
flagged that no author exists); *Dev* = can be shipped in this codebase.

| Week | URL | Primary keyword | Format | Words | Internal links | Owner |
|---|---|---|---|---|---|---|
| 1 | `/category/ottoman-beds` | ottoman bed | Category copy above grid | 600 | `/size-guide`, `/guides/ottoman-vs-divan`, 2 products | Dev + Content |
| 2 | `/category/divan-beds` | divan bed | Category copy | 600 | size guide, delivery | Dev + Content |
| 3 | `/category/luxury-beds` | luxury bed | Category copy | 600 | 4 product pages, returns | Dev + Content |
| 4 | `/size-guide` | bed sizes uk | Expand to size-by-room table | 900 | all categories | Content |
| 5 | `/faqs` | cash on delivery bed | Add delivery/payment Q&A block | 500 | `/delivery`, `/returns` | Dev |
| 6 | `/product/ambessador` | ambessador bed | Product description rewrite | 350 | category, size guide | Content |
| 7 | `/product/panel-line` | panel bed | Product description rewrite | 350 | category, guide | Content |
| 8 | `/guides/ottoman-vs-divan` | ottoman vs divan | Refresh with size and price facts | 1,200 | both categories | Content |
| 9 | `/category/bed-frames` | bed frame | New category **if** frame-only pricing exists | 700 | all products | Owner decision first |
| 10 | `/delivery` | next day bed delivery | Delivery explainer with cutoff table | 500 | checkout, faqs | Dev |
| 11 | `/category/sofas` | sofa bed | Split sofa-bed terms or add section | 500 | sofa products | Content |
| 12 | `/guides` hub | bed buying guide | New guide: choosing a bed size for a room | 1,400 | size guide, categories | Content |

Calendar note: week 9 is deliberately gated on an owner decision. The rest can
start without one.

## Owner steps to close the gaps

1. Create a Search Console property and export Queries (fills `current_position`).
2. Export Keyword Planner volumes for the 250 sheet keywords (fills `volume_band`).
3. Export Ahrefs or Moz difficulty (fills `difficulty_band`).
4. Name the content author.
5. Decide on frame-only pricing, standalone mattresses and headboards.
