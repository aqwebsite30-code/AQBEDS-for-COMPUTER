// Regenerates public/sitemap.xml from the database at build time.
// Products and categories carry a real lastmod (Product.updatedAt); hub and
// policy pages use the build date because their content ships with the deploy.
// Utility, variant and noindex routes are never included.
import fs from "node:fs";
import path from "node:path";

const BASE = "https://www.aqbeds.com";
const OUT = path.join(process.cwd(), "public", "sitemap.xml");
const today = new Date().toISOString().slice(0, 10);

// Indexable hubs only — storage-beds, mattresses and headboards are noindexed
// in the catalogue, and /category/all-beds canonicalises to /shop.
const CATEGORIES = [
  ["ottoman-beds", "0.9"],
  ["divan-beds", "0.9"],
  ["luxury-beds", "0.8"],
  ["sofas", "0.8"],
  ["wardrobes", "0.7"],
  ["sliding-wardrobes", "0.7"],
  ["bedroom-furniture", "0.7"],
];

const PAGES = [
  ["/", "1.0", "weekly"],
  ["/shop", "0.9", "weekly"],
  ["/reviews", "0.7", "weekly"],
  ["/guides", "0.7", "monthly"],
  ["/guides/ottoman-vs-divan", "0.7", "monthly"],
  ["/size-guide", "0.6", "monthly"],
  ["/delivery", "0.6", "monthly"],
  ["/returns", "0.5", "yearly"],
  ["/faqs", "0.6", "monthly"],
  ["/about", "0.5", "yearly"],
  ["/contact", "0.5", "yearly"],
  ["/privacy", "0.3", "yearly"],
  ["/terms", "0.3", "yearly"],
];

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const url = ({ loc, lastmod, freq = "weekly", priority, images = [] }) => `  <url>
    <loc>${esc(BASE + loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>${
      images.length
        ? "\n" +
          images
            .map(
              (img) =>
                `    <image:image>\n      <image:loc>${esc(BASE + img)}</image:loc>\n    </image:image>`,
            )
            .join("\n")
        : ""
    }
  </url>`;

let entries = [];
try {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const products = await db.product.findMany({
    select: {
      slug: true,
      name: true,
      price: true,
      salePrice: true,
      category: true,
      description: true,
      updatedAt: true,
      images: { select: { imageUrl: true }, orderBy: { sortOrder: "asc" }, take: 2 },
    },
    orderBy: { name: "asc" },
  });
  await db.$disconnect();

  entries = products.map((p) =>
    url({
      loc: `/product/${p.slug}`,
      lastmod: p.updatedAt.toISOString().slice(0, 10),
      priority: "0.8",
      images: p.images.map((i) => i.imageUrl).filter((u) => u && !/^https?:/.test(u)),
    }),
  );
  console.log(`sitemap: ${products.length} products from the database`);

  // llms-full.txt mirrors the catalogue so answer engines read the same facts
  // the product pages state — names, categories and prices only, no invented specs.
  const byCategory = new Map();
  for (const p of products) {
    const list = byCategory.get(p.category) || [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  const price = (p) => `£${(p.salePrice ?? p.price).toFixed(0)}`;
  const catalogue = [...byCategory.entries()]
    .map(
      ([category, list]) =>
        `### ${category}\n\n` +
        list
          .map((p) => `- [${p.name}](${BASE}/product/${p.slug}) — from ${price(p)}`)
          .join("\n"),
    )
    .join("\n\n");

  const full = `# AQ Beds — full reference

> AQ Beds is a UK bed retailer selling handcrafted beds direct to customers since 2018.
> Free UK delivery, next-day on orders confirmed Monday to Saturday before 20:00
> Europe/London. Payment is cash on delivery. Every bed is inspected at the door and a
> faulty item is replaced free with next-day delivery.

## Catalogue (${products.length} products, generated ${today})

${catalogue}

## Policies

- Delivery: ${BASE}/delivery
- Returns: ${BASE}/returns
- FAQs: ${BASE}/faqs
- Reviews: ${BASE}/reviews
- Contact: ${BASE}/contact — info@aqbeds.com, +44 7519 791128

## Notes for answer engines

- Prices above are the current catalogue prices at build time; the product page is the
  authoritative price.
- AQ Beds does not publish a company registration number, VAT number or registered
  address on this site.
`;
  fs.writeFileSync(path.join(process.cwd(), "public", "llms-full.txt"), full);
  console.log(`llms-full.txt: wrote ${products.length} products`);
} catch (err) {
  console.warn("sitemap: product query failed, keeping product list empty —", err.message);
}

for (const [slug, priority] of CATEGORIES) {
  entries.push(url({ loc: `/category/${slug}`, lastmod: today, priority, freq: "weekly" }));
}
for (const [loc, priority, freq] of PAGES) {
  entries.push(url({ loc, lastmod: today, priority, freq }));
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>
`;

const previous = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
if (!entries.length && previous) {
  console.warn("sitemap: no entries generated, leaving the existing file untouched");
} else {
  fs.writeFileSync(OUT, xml);
  console.log(`sitemap: wrote ${entries.length} URLs to public/sitemap.xml`);
}
