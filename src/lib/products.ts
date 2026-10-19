import { createServerFn } from "@tanstack/react-start";
import { PRODUCTS } from "@/features/products/data/products";
import { db } from "./db";

export type Option = { name: string; extraPrice: number };
export type Color = { name: string; hex?: string; image?: string };

export type FabricWithColors = {
  name: string;
  extraPrice: number;
  colors: Color[];
};

export interface DbProductData {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  originalPrice?: number;
  category: string;
  stock: number;
  images: string[];
  rating: number;
  featured: boolean;
  colors: Color[];
  sizes: Option[];
  fabrics: FabricWithColors[];
  mattressOptions: Option[];
  frameOptions: Option[];
  headboardOptions?: Option[];
  storageOptions?: Option[];
}

function parseOptions(raw: string | null) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function mapDbProduct(p: any): DbProductData {
  const opts = parseOptions(p.options);
  // Products seeded into the database only carry their size list (variant
  // rows) - the options JSON is empty, which stripped every colour / fabric /
  // headboard / storage / mattress picker off the PDP and shop facets for all
  // 32 products. Fall back per key to the static catalogue entry with the same
  // slug so the rich option data keeps working; an admin-edited DB option
  // (present + non-empty) always wins over the static copy.
  const staticOpts: any = (PRODUCTS as any[]).find((s: any) => s.slug === p.slug) ?? {};
  const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
  const pick = (dbVal: unknown, staticVal: unknown): any[] => {
    const fromDb = list(dbVal);
    return fromDb.length ? fromDb : list(staticVal);
  };
  const toColor = (c: any): Color => ({
    name: c?.name || "",
    hex: c?.hex || undefined,
    image: c?.image || undefined,
  });
  const fabrics: FabricWithColors[] = pick(opts.fabrics, staticOpts.fabrics).map((f: any) => ({
    name: f?.name || "",
    extraPrice: f?.extraPrice || 0,
    colors: list(f?.colors).map(toColor),
  }));
  const allColors: Color[] = [];
  fabrics.forEach((f) => allColors.push(...f.colors));
  // Products imported without an options payload store their size list as
  // ProductVariant rows - fall back to them so size facets / PDP sizes work.
  const variantSizes: Option[] = (p.variants || [])
    .filter((v: { size?: string | null }) => v.size)
    .map((v: { size: string; priceModifier?: number }) => ({
      name: v.size,
      extraPrice: v.priceModifier || 0,
    }));
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description || "",
    basePrice: p.price,
    originalPrice: p.salePrice || undefined,
    category: p.category,
    stock: p.stock,
    images: (p.images || []).map((i: any) => i.imageUrl),
    rating: p.rating || 0,
    featured: p.featured || false,
    colors: allColors.length ? allColors : pick(opts.colors, staticOpts.colors).map(toColor),
    sizes: opts.sizes?.length ? opts.sizes : variantSizes,
    fabrics,
    mattressOptions: pick(opts.mattressOptions, staticOpts.mattressOptions),
    frameOptions: pick(opts.frameOptions, staticOpts.frameOptions),
    headboardOptions: pick(opts.headboardOptions, staticOpts.headboardOptions),
    storageOptions: pick(opts.storageOptions, staticOpts.storageOptions),
  };
}

export const getDbProductBySlug = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: string }) => {
    try {
      const product = await db.product.findUnique({
        where: { slug: data },
        include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
      });
      if (!product) return null;
      return mapDbProduct(product);
    } catch {
      return null;
    }
  },
);

export const getDbProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
    });
    return products.map(mapDbProduct);
  } catch {
    return [];
  }
});
