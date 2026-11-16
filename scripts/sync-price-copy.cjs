/**
 * Keeps the hardcoded "from £X" copy in step with a price-set change.
 *
 * The catalogue has two places a starting price is written as text: the product
 * copy file (meta descriptions and some descriptions) and the static fallback
 * catalogue used by header search. Both are plain strings, so they cannot follow
 * the database automatically — this script rewrites exactly the prices that the
 * snapshots say changed, and leaves everything else (sofa and wardrobe prices
 * share the same numbers) alone.
 *
 *   node scripts/sync-price-copy.cjs           # report + write
 *   node scripts/sync-price-copy.cjs --dry-run
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();
const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const COPY_FILE = path.join(root, "src/features/products/data/product-copy.json");
const STATIC_FILE = path.join(root, "src/features/products/data/products.ts");

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

async function main() {
  const before = await db.priceSet.findUnique({ where: { name: "prices-1" } });
  const after = await db.priceSet.findUnique({ where: { name: "prices-2" } });
  if (!before || !after) throw new Error("Need both Prices 1 and Prices 2 snapshots first");

  const old = new Map(JSON.parse(before.payload).map((r) => [r.slug, r]));
  const next = new Map(JSON.parse(after.payload).map((r) => [r.slug, r]));

  const changes = [];
  for (const [slug, o] of old) {
    const n = next.get(slug);
    if (!n || o.price === n.price) continue;
    changes.push({ slug, from: o.price, to: n.price });
  }
  if (!changes.length) {
    console.log("No price difference between Prices 1 and Prices 2 — nothing to rewrite");
    return;
  }

  const bySlug = new Map(changes.map((c) => [c.slug, c]));

  // ── 1. Product copy: only inside that product's own entry ────────────────
  const copy = JSON.parse(fs.readFileSync(COPY_FILE, "utf8"));
  let copyEdits = 0;
  for (const [slug, entry] of Object.entries(copy)) {
    const change = bySlug.get(slug);
    if (!change) continue;
    for (const field of ["description", "meta"]) {
      const text = entry[field];
      if (typeof text !== "string") continue;
      const pattern = new RegExp(`from £${change.from}\\b`, "g");
      if (pattern.test(text)) {
        entry[field] = text.replace(pattern, `from £${change.to}`);
        copyEdits++;
        console.log(`copy   ${slug}.${field}: from £${change.from} -> from £${change.to}`);
      }
    }
  }
  if (copyEdits && !dryRun) fs.writeFileSync(COPY_FILE, JSON.stringify(copy, null, 2) + "\n");

  // ── 2. Static catalogue: the product() price arguments and its blurb ─────
  let src = fs.readFileSync(STATIC_FILE, "utf8");
  let staticEdits = 0;
  for (const change of changes) {
    // The call is written both multi-line and single-line in this file, so match
    // on the arguments only: product("slug", "Name", "category", price, sale,
    const callPattern = new RegExp(
      `(product\\(\\s*"${change.slug}",\\s*"[^"]+",\\s*"[^"]+",\\s*)(\\d+)(,\\s*)(\\d+)(,)`,
    );
    const match = src.match(callPattern);
    if (match && Number(match[2]) === change.from) {
      const newSale = Number(match[4]) + (change.to - change.from);
      src = src.replace(callPattern, `$1${change.to}$3${newSale}$5`);
      staticEdits++;
      console.log(`static ${change.slug}: base £${change.from} -> £${change.to}`);
    } else if (match) {
      console.log(
        `static ${change.slug}: SKIPPED — file says £${match[2]}, snapshot says £${change.from}`,
      );
    } else {
      console.log(`static ${change.slug}: no product() call found`);
    }

    // Description text lives in the same block, up to the next product( call.
    const blockStart = src.indexOf(`"${change.slug}",`);
    const blockEnd = src.indexOf("product(", blockStart + 1);
    if (blockStart > -1) {
      const block = src.slice(blockStart, blockEnd === -1 ? undefined : blockEnd);
      const pattern = new RegExp(`from £${change.from}\\b`, "g");
      if (pattern.test(block)) {
        src =
          src.slice(0, blockStart) +
          block.replace(pattern, `from £${change.to}`) +
          src.slice(blockEnd === -1 ? undefined : blockEnd);
        staticEdits++;
        console.log(`static ${change.slug}: description £${change.from} -> £${change.to}`);
      }
    }
  }
  if (staticEdits && !dryRun) fs.writeFileSync(STATIC_FILE, src);

  console.log(
    `${dryRun ? "(dry run) " : ""}${copyEdits} copy edits, ${staticEdits} catalogue edits. ` +
      "Category-level lines (hero, /shop, /collection metas) are hand-checked — search for 'from £'.",
  );
}
