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
// Only categories that actually render products get a sitemap entry; an empty
// category 404s, which is worse than being absent from the sitemap.
const filledCategories = new Set();
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
  for (const p of products) if (p.category) filledCategories.add(p.category);

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

  // Phase J2 — the full reference: stable business facts first, then the catalogue
  // generated from the database so names, categories and prices cannot drift.
  const full = `# AQ Beds — full plain-text reference

Source: ${BASE}
Summary file: ${BASE}/llms.txt
Generated from the product catalogue on ${today}: ${products.length} products.

This file states what AQ Beds sells, where it delivers, how payment works and what
happens if an item is faulty. It contains no marketing copy.

## Business

Name: AQ Beds
Website: ${BASE}
Sells: beds, mattresses supplied with beds, sofas and bedroom furniture, direct to
customers in the United Kingdom.
Business model: direct-to-consumer, order online or by WhatsApp, cash paid on delivery.
No showroom address is published and none should be inferred, and no company
registration number or VAT number is published on this site.
Contact: info@aqbeds.com · +44 7519 791128 (phone and WhatsApp)

## Catalogue (${products.length} products)

Prices are the \"from\" price at the time this file was generated; the price on each
product page is authoritative.

${catalogue}

## Sizes

Bed sizes offered across the range, where the model supports them: 2ft6 small single,
3ft single, 4ft small double, 4ft6 double, 5ft king, 6ft super king.

Mattresses: on most bed models the mattress is included on some sizes and optional on
others. Each product page lists the sizes with and without a mattress, and the price
differs between them.

## Materials

Frames are built from solid timber and engineered wood. Upholstery options across the
range are crushed velvet, plush velvet, chenille and soft matte finishes, in a fixed
colour palette per product shown on the product page. Mattress options range from
comfort foam to 2000 pocket sprung, with orthopaedic options on some models.

## Delivery

- Cost: free, to any UK address, including Scotland, Wales and Northern Ireland.
- Cut-off: orders confirmed Monday to Saturday before 20:00 Europe/London are delivered
  the next day.
- After the cut-off: an order placed after 20:00 Europe/London counts as the next day's
  order.
- Sunday: orders placed on Sunday are delivered on Tuesday.
- Non-delivery days: Monday, and UK bank holidays observed in England and Wales,
  Scotland or Northern Ireland. A date that falls on one of these moves to the next
  delivery day.
- Choice: the customer can pick a later delivery date at checkout.
- On the day: the item is inspected with the customer at the door before payment.

## Payment

- Method: cash on delivery only.
- Nothing is paid online. The website checkout and the WhatsApp order flow both record
  the order without taking payment.
- No card payment, no finance and no buy-now-pay-later is offered.

## Guarantee, returns and faults

- Inspection: every item is inspected at the door before the customer pays.
- Fault or damage: report it before the courier leaves, or within 24 hours of delivery,
  and the item is replaced free of charge with next-day delivery.
- Returns: accepted at the time of delivery only.
- Contact for a fault: info@aqbeds.com or +44 7519 791128 (WhatsApp).
- Full wording: ${BASE}/returns

## Orders and tracking

- Order reference format: AQ- followed by six characters, for example AQ-M2EZYE. This is
  the reference quoted in the confirmation email and used for tracking.
- Track an order: ${BASE}/track (accepts the order reference).

## Pages

- Home: ${BASE}/
- Shop: ${BASE}/shop
- Delivery: ${BASE}/delivery
- Returns: ${BASE}/returns
- FAQs: ${BASE}/faqs
- Size guide: ${BASE}/size-guide
- Reviews: ${BASE}/reviews
- Track an order: ${BASE}/track
- About: ${BASE}/about
- Contact: ${BASE}/contact
- Guides: ${BASE}/guides
- Ottoman vs divan beds: ${BASE}/guides/ottoman-vs-divan
- Terms: ${BASE}/terms
- Privacy: ${BASE}/privacy

## Questions answered on the site

Do you offer free delivery? Yes. Delivery is free on every order to any UK address.

Do you offer cash on delivery? Yes. Cash on delivery is the only payment method, and
the item is inspected before payment is made.

How quickly is an order delivered? Orders confirmed Monday to Saturday before 20:00
Europe/London are delivered the next day. Sunday orders arrive on Tuesday. Monday and UK
bank holidays are not delivery days.

What happens if the item is faulty? Report it before the courier leaves, or within 24
hours of delivery, and it is replaced free of charge with next-day delivery.

What sizes are available? 2ft6 small single to 6ft super king on beds, depending on the
model.

Can the delivery date be changed? Yes. A later delivery date can be chosen at checkout.

## Crawler notes

- robots.txt: ${BASE}/robots.txt
- Sitemap: ${BASE}/sitemap.xml
- The same HTML is served to crawlers and to shoppers.
`;
  fs.writeFileSync(path.join(process.cwd(), "public", "llms-full.txt"), full);
  console.log(`llms-full.txt: wrote ${products.length} products`);
} catch (err) {
  console.warn("sitemap: product query failed, keeping product list empty —", err.message);
}

for (const [slug, priority] of CATEGORIES) {
  if (!filledCategories.has(slug)) continue;
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
