/**
 * Named price sets — "Prices 1" (before a rise) and "Prices 2" (after it).
 *
 * The storefront only ever reads Product.price / Product.salePrice, so this
 * script is the whole switching mechanism: snapshot the live prices under a
 * name, then `use` that name to copy it back. Nothing else reads PriceSet.
 *
 *   node scripts/price-sets.cjs status
 *   node scripts/price-sets.cjs snapshot "Prices 1"
 *   node scripts/price-sets.cjs use "Prices 1"
 *   node scripts/price-sets.cjs increase 50 --categories divan-beds,luxury-beds,ottoman-beds
 *
 * `use` refuses to run if the name is unknown, and prints exactly what changed,
 * because a wrong price set is a customer-facing mistake.
 */
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const BED_CATEGORIES = ["divan-beds", "luxury-beds", "ottoman-beds"];

function keyFor(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureTable() {
  // The project has no migrations folder (schema is pushed), so create the one
  // new table explicitly instead of running a whole-schema push against the
  // live database.
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PriceSet" (
      "name" TEXT PRIMARY KEY,
      "label" TEXT NOT NULL,
      "payload" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )
  `);
}

async function liveRows() {
  return db.product.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, name: true, category: true, price: true, salePrice: true },
  });
}

function payloadOf(rows) {
  return JSON.stringify(
    rows.map((r) => ({ id: r.id, slug: r.slug, price: r.price, salePrice: r.salePrice })),
  );
}

async function status() {
  const sets = await db.priceSet.findMany({ orderBy: { name: "asc" } });
  const active = sets.find((s) => s.isActive);
  console.log(active ? `Active: ${active.label}` : "Active: none (no price set recorded)");
  for (const s of sets) {
    const rows = JSON.parse(s.payload);
    const min = Math.min(...rows.map((r) => r.price));
    console.log(
      `  ${s.isActive ? "*" : " "} ${s.label.padEnd(12)} ${rows.length} products, cheapest £${min}, updated ${s.updatedAt.toISOString().slice(0, 10)}`,
    );
  }
  const beds = await db.product.aggregate({
    where: { category: { in: BED_CATEGORIES } },
    _min: { price: true },
    _max: { price: true },
  });
  console.log(`Live beds: £${beds._min.price}–£${beds._max.price}`);
}

async function snapshot(label) {
  const rows = await liveRows();
  const name = keyFor(label);
  await db.priceSet.upsert({
    where: { name },
    update: { label, payload: payloadOf(rows) },
    create: { name, label, payload: payloadOf(rows) },
  });
  const min = Math.min(...rows.map((r) => r.price));
  console.log(`Saved ${label} (${name}): ${rows.length} products, cheapest £${min}`);
}

async function use(label) {
  const name = keyFor(label);
  const set = await db.priceSet.findUnique({ where: { name } });
  if (!set) {
    const all = await db.priceSet.findMany({ select: { label: true } });
    throw new Error(
      `No price set "${label}". Known: ${all.map((s) => s.label).join(", ") || "none"}`,
    );
  }
  const rows = JSON.parse(set.payload);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const live = await liveRows();
  let changed = 0;

  await db.$transaction(
    live
      .filter((p) => bySlug.has(p.slug))
      .map((p) => {
        const target = bySlug.get(p.slug);
        if (target.price === p.price && target.salePrice === p.salePrice) return null;
        changed++;
        return db.product.update({
          where: { id: p.id },
          data: { price: target.price, salePrice: target.salePrice },
        });
      })
      .filter(Boolean),
  );

  await db.priceSet.updateMany({ data: { isActive: false } });
  await db.priceSet.update({ where: { name }, data: { isActive: true } });
  console.log(`Switched to ${set.label}: ${changed} product${changed === 1 ? "" : "s"} changed`);
}

async function increase(amount, opts) {
  const categories = opts.categories?.length ? opts.categories : BED_CATEGORIES;
  const rows = await db.product.findMany({
    where: { category: { in: categories } },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, price: true, salePrice: true },
  });
  await db.$transaction(
    rows.map((p) =>
      db.product.update({
        where: { id: p.id },
        data: {
          price: p.price + amount,
          // The struck "was" price is always above the live price; if it were
          // left behind the new price would appear to be above RRP.
          salePrice: p.salePrice == null ? null : p.salePrice + amount,
        },
      }),
    ),
  );
  for (const p of rows) {
    console.log(
      `${p.slug.padEnd(22)} £${p.price} -> £${p.price + amount}` +
        (p.salePrice == null ? "" : `   (was £${p.salePrice} -> £${p.salePrice + amount})`),
    );
  }
  console.log(`${rows.length} products increased by £${amount} in ${categories.join(", ")}`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const categoriesArg = rest.findIndex((a) => a === "--categories");
  const categories =
    categoriesArg >= 0 ? (rest[categoriesArg + 1] || "").split(",").filter(Boolean) : [];
  const args = rest.filter(
    (a, i) => categoriesArg < 0 || (i !== categoriesArg && i !== categoriesArg + 1),
  );

  await ensureTable();

  switch (command) {
    case "status":
      return status();
    case "snapshot":
      if (!args[0]) throw new Error('Pass a name, e.g. snapshot "Prices 1"');
      return snapshot(args.join(" "));
    case "use":
      if (!args[0]) throw new Error('Pass a name, e.g. use "Prices 1"');
      return use(args.join(" "));
    case "increase": {
      const amount = Number(args[0]);
      if (!Number.isFinite(amount) || amount <= 0)
        throw new Error("Pass an amount, e.g. increase 50");
      return increase(amount, { categories });
    }
    default:
      console.log(
        'Usage:\n  status\n  snapshot "Prices 1"\n  use "Prices 1"\n  increase 50 [--categories divan-beds,luxury-beds,ottoman-beds]',
      );
  }
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
