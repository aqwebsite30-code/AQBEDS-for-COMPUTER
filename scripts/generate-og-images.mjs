import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

// Social cards are cropped from the catalogue images already on the site.
// Nothing here is a new photograph — it is the same product image, cropped to
// the 1200x630 share ratio.
const OUT = "public/og";
fs.mkdirSync(OUT, { recursive: true });

const db = new PrismaClient();
const products = await db.product.findMany({
  select: { slug: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
});
const cats = await db.product.findMany({ select: { category: true }, distinct: ["category"] });
await db.$disconnect();

let made = 0;
const failed = [];
const render = async (src, dest) => {
  const file = path.join("public", src.replace(/^\//, ""));
  if (!fs.existsSync(file)) {
    failed.push(src);
    return false;
  }
  await sharp(file).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 82 }).toFile(dest);
  made++;
  return true;
};

for (const p of products) {
  const src = p.images[0]?.imageUrl;
  if (!src) {
    failed.push(`no image: ${p.slug}`);
    continue;
  }
  await render(src, path.join(OUT, `${p.slug}.jpg`));
}

const CATEGORY_HERO = {
  "ottoman-beds": "/Home page images/1000152185-clean.webp",
  "divan-beds": "/Home page images/1000152185-clean.webp",
  "luxury-beds": "/Home page images/1000152185-clean.webp",
  sofas: "/Home page images/1000152185-clean.webp",
  wardrobes: "/Wardrobes/alina-wardrobe-main.webp",
  "sliding-wardrobes": "/Wardrobes/alina-wardrobe-main.webp",
};
for (const c of cats) {
  const src = CATEGORY_HERO[c.category];
  if (!src) continue;
  await render(src, path.join(OUT, `category-${c.category}.jpg`));
}

await render("/Home page images/1000152185-clean.webp", "public/og-default.jpg");

console.log(`og images written: ${made}`);
if (failed.length) console.log("missing sources:", failed.slice(0, 10).join(", "));
