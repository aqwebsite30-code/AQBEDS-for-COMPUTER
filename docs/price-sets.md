# Price sets — "Prices 1" and "Prices 2"

Every product's live price lives in the database (`Product.price` and
`Product.salePrice`; each size is `price + variant.priceModifier`). Nothing in
the storefront reads a price set — the sets are saved snapshots that can be
written back over the live columns. That means switching the whole catalogue
back and forth needs no code change and no deploy.

## What is stored

`PriceSet` (one row per set):

| name       | label     | contents                                              |
| ---------- | --------- | ----------------------------------------------------- |
| `prices-1` | Prices 1  | Every product's price and compare-at price before the rise |
| `prices-2` | Prices 2  | The same list after the £50 bed increase (active now)  |

`isActive` marks whichever set was last applied, so the shop's current prices
can always be identified from the database alone.

## Commands

```bash
npm run prices                                # status: active set, cheapest bed
npm run prices -- snapshot "Prices 3"         # save today's prices under a new name
npm run prices -- use "Prices 1"              # switch the whole catalogue back
npm run prices -- increase 50                 # +£50 on beds, keeping was-prices above
npm run prices -- increase 50 --categories divan-beds,luxury-beds,ottoman-beds
```

Run them with the production `DATABASE_URL`, for example:

```bash
node --env-file=.env.production scripts/price-sets.cjs use "Prices 1"
```

`use` prints how many products changed. It refuses unknown names and lists the
ones that exist.

## After switching, refresh the copy

Hardcoded "from £X" text does not follow the database. After a switch or an
increase, run:

```bash
npm run prices:sync-copy          # rewrites product metas + static catalogue
npm run prices:sync-copy -- --dry-run
```

It only rewrites prices that actually changed between the two snapshots, so
sofa and wardrobe copy keeps its own numbers even where they share a value.
Category-level lines (homepage metadata, hero button, the ottoman-vs-divan
guide, `/shop`) are listed by the script for a hand check.

## Current state (15 Nov 2026)

Prices 1 = before the rise, Prices 2 = after. Beds now start at £235 and end
at £499. Sofas, wardrobes and sliding wardrobes were not part of this change
and still start at £185 / £150 / £260.
