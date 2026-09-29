import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PRODUCTS, searchProducts } from "@/features/products/data/products";
import { getDbProducts } from "@/lib/products";
import { ProductCard } from "@/features/products/components/ProductCard";
import { SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";
import { motion, useInView } from "framer-motion";

type Sort = "featured" | "low" | "high";
type FilterKey = "cat" | "size" | "mattress";

type ShopSearch = {
  q?: string;
  cat?: string[];
  size?: string[];
  mattress?: string[];
  max?: number;
  sort?: Sort;
};

const asList = (v: unknown): string[] =>
  v === undefined || v === null ? [] : Array.isArray(v) ? v.map(String) : [String(v)];

const sentence = (s: string) => s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

// Size options are written "5ft King Size - With Mattress" → split into a size
// facet and a mattress facet (WP-C)
const parseSize = (name: string) => {
  const m = /^(.*?)\s*[-–—]\s*(With Mattress|No Mattress)$/.exec(name);
  return m
    ? { base: m[1], inclusion: m[2] as "With Mattress" | "No Mattress" }
    : { base: name, inclusion: null as null | "With Mattress" | "No Mattress" };
};

export const Route = createFileRoute("/shop")({
  loader: async () => {
    const dbProducts = await getDbProducts();
    return { dbProducts };
  },
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
    cat: asList(s.cat),
    size: asList(s.size),
    mattress: asList(s.mattress),
    max:
      typeof s.max === "number" && Number.isFinite(s.max)
        ? s.max
        : typeof s.max === "string" && Number(s.max)
          ? Number(s.max)
          : undefined,
    sort: s.sort === "low" || s.sort === "high" ? s.sort : "featured",
  }),
  head: () => ({
    meta: [
      { title: "Shop Beds, Sofas & Wardrobes | AQ Beds" },
      {
        name: "description",
        content:
          "Browse every AQ Beds product — ottoman, divan and storage beds, velvet sofas, sofa beds and wardrobes. Free UK delivery. Cash on delivery available.",
      },
      { property: "og:title", content: "Shop Beds, Sofas & Wardrobes | AQ Beds" },
      {
        property: "og:description",
        content:
          "Browse every AQ Beds product — ottoman, divan and storage beds, velvet sofas, sofa beds and wardrobes. Free UK delivery. Cash on delivery available.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { property: "og:url", content: "https://www.aqbeds.com/shop" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shop Beds, Sofas & Wardrobes | AQ Beds" },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { dbProducts } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [showFilters, setShowFilters] = useState(false);

  const cat = useMemo(() => search.cat ?? [], [search.cat]);
  const size = useMemo(() => search.size ?? [], [search.size]);
  const mattress = useMemo(() => search.mattress ?? [], [search.mattress]);
  const sort: Sort = search.sort ?? "featured";

  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true });

  // Every product on the site — the shop is the full catalogue (WP-C)
  const catalogue = useMemo(() => {
    const staticProducts = PRODUCTS as any[];
    const dbList = (dbProducts || []) as any[];
    return [...dbList, ...staticProducts];
  }, [dbProducts]);

  const priceBounds = useMemo(() => {
    const prices = catalogue.map((p) => p.basePrice).filter((n) => typeof n === "number");
    const lo = prices.length ? Math.min(...prices) : 0;
    const hi = prices.length ? Math.max(...prices) : 1000;
    return { lo, hi: Math.ceil(hi / 50) * 50 };
  }, [catalogue]);

  const maxPrice = Math.min(search.max ?? priceBounds.hi, priceBounds.hi);

  const categoryFacet = useMemo(() => {
    const counts = new Map<string, number>();
    catalogue.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return Array.from(counts, ([slug, count]) => ({ slug, count })).sort(
      (a, b) => b.count - a.count,
    );
  }, [catalogue]);

  // Size facet: bed and sofa sizes only. Wardrobe "sizes" are door configurations
  // ("2 Door Plain Wardrobe") and sliding widths, so those categories are excluded;
  // values with no digit ("Double Metal Bunk Bed") are product names, not sizes.
  const sizeFacet = useMemo(() => {
    const skip = new Set(["wardrobes", "sliding-wardrobes", "bedroom-furniture"]);
    const set = new Set<string>();
    catalogue
      .filter((p) => !skip.has(p.category))
      .forEach((p) =>
        p.sizes?.forEach((s: any) => {
          const base = parseSize(s.name).base;
          if (/\d/.test(base)) set.add(base);
        }),
      );
    return Array.from(set).sort();
  }, [catalogue]);

  const hasMattressOptions = useMemo(
    () => catalogue.some((p) => p.sizes?.some((s: any) => parseSize(s.name).inclusion)),
    [catalogue],
  );
  const mattressFacet = ["With Mattress", "No Mattress"];

  const list = useMemo(() => {
    let filtered = catalogue;

    if (search.q) {
      const results = searchProducts(search.q);
      const allowed = new Set(catalogue.map((p) => p.id));
      filtered = results.filter((p) => allowed.has(p.id));
    }

    filtered = filtered.filter((p) => p.basePrice <= maxPrice);

    if (cat.length) filtered = filtered.filter((p) => cat.includes(p.category));

    if (size.length)
      filtered = filtered.filter((p) =>
        p.sizes?.some((s: any) => size.includes(parseSize(s.name).base)),
      );

    if (mattress.length)
      filtered = filtered.filter((p) =>
        p.sizes?.some((s: any) => {
          const inc = parseSize(s.name).inclusion;
          return inc ? mattress.includes(inc) : false;
        }),
      );

    if (sort === "low") return [...filtered].sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "high") return [...filtered].sort((a, b) => b.basePrice - a.basePrice);
    return filtered;
  }, [catalogue, search.q, cat, size, mattress, sort, maxPrice]);

  const hasActiveFilters =
    cat.length > 0 ||
    size.length > 0 ||
    mattress.length > 0 ||
    !!search.q ||
    maxPrice < priceBounds.hi;

  const update = (patch: Partial<ShopSearch>) =>
    navigate({ search: { ...search, ...patch }, replace: true });

  const toggleIn = (key: FilterKey, value: string) => {
    const current = search[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [key]: next } as Partial<ShopSearch>);
  };

  const clearAll = () =>
    navigate({
      search: { cat: [], size: [], mattress: [], max: undefined, q: undefined },
      replace: true,
    });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header Banner ── */}
      <div className="relative bg-[#0a0a0a] text-white overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-blue-500/10 opacity-50" />
        <div ref={headerRef} className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-brand/80 mb-4 block">
              Premium Collection
            </span>
            <h1 className="font-display font-black text-5xl sm:text-7xl tracking-tighter leading-none mb-6">
              Shop All Products
            </h1>
            <p className="text-white/50 text-lg max-w-xl font-light leading-relaxed">
              Beds, sofas and wardrobes, all in one place. Search by size, category or fabric to
              find what fits your room.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* ── Search + Sort bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="search"
              placeholder='Try "King Size", "Ottoman", "Small Double"…'
              value={search.q ?? ""}
              onChange={(e) => update({ q: e.target.value || undefined })}
              className="w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-10 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/30 transition-all duration-300"
            />
            {search.q && (
              <button
                onClick={() => update({ q: undefined })}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v: boolean) => !v)}
            className="lg:hidden inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border border-border bg-card text-sm font-bold active:scale-95 transition-all"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-brand" />}
          </button>
          <div className="relative min-w-[160px] sm:min-w-[180px]">
            <label htmlFor="shop-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(e) => update({ sort: e.target.value as Sort })}
              className="w-full h-12 sm:h-14 rounded-2xl border border-border bg-card px-4 sm:px-5 pr-10 text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand/5 transition-all duration-300"
            >
              <option value="featured">Most popular</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
            <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* ── Sidebar Filters ── */}
          <aside
            className={`${
              showFilters ? "fixed inset-0 z-50 bg-background overflow-y-auto" : "hidden"
            } lg:block lg:sticky lg:top-24 h-fit`}
          >
            <div className={`space-y-4 ${showFilters ? "p-6" : ""}`}>
              {showFilters && (
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h2 className="text-2xl font-black">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    aria-label="Close filters"
                    className="p-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Category Filter */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-4 text-foreground/70">Category</h3>
                <ul className="space-y-2.5">
                  {categoryFacet.map(({ slug, count }) => (
                    <li key={slug}>
                      <label className="flex items-center gap-3 text-sm cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={cat.includes(slug)}
                          onChange={() => toggleIn("cat", slug)}
                          className="rounded accent-brand w-4 h-4 cursor-pointer"
                        />
                        <span
                          className={`transition-colors ${
                            cat.includes(slug)
                              ? "text-brand font-bold"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {sentence(slug)} <span className="text-xs opacity-60">({count})</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Size Filter */}
              {sizeFacet.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="font-display font-bold text-sm text-foreground/70">Size</h3>
                    <a href="/size-guide" className="text-[11px] text-brand underline">
                      Size guide
                    </a>
                  </div>
                  <ul className="space-y-2.5">
                    {sizeFacet.map((sz) => (
                      <li key={sz}>
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={size.includes(sz)}
                            onChange={() => toggleIn("size", sz)}
                            className="rounded accent-brand w-4 h-4 cursor-pointer"
                          />
                          <span
                            className={`transition-colors ${
                              size.includes(sz)
                                ? "text-brand font-bold"
                                : "text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            {sz}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mattress Filter (split out of the size list) */}
              {hasMattressOptions && sizeFacet.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-sm mb-4 text-foreground/70">
                    Mattress
                  </h3>
                  <ul className="space-y-2.5">
                    {mattressFacet.map((inc) => (
                      <li key={inc}>
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={mattress.includes(inc)}
                            onChange={() => toggleIn("mattress", inc)}
                            className="rounded accent-brand w-4 h-4 cursor-pointer"
                          />
                          <span
                            className={`transition-colors ${
                              mattress.includes(inc)
                                ? "text-brand font-bold"
                                : "text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            {inc === "With Mattress" ? "With mattress" : "No mattress"}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price Range */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-sm text-foreground/70">Budget</h3>
                  <span className="text-xs font-black text-brand bg-brand/10 px-2 py-1 rounded-lg">
                    Up to £{maxPrice}
                  </span>
                </div>
                <label htmlFor="shop-budget" className="sr-only">
                  Maximum price
                </label>
                <input
                  id="shop-budget"
                  type="range"
                  min={priceBounds.lo}
                  max={priceBounds.hi}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => update({ max: Number(e.target.value) })}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-2">
                  <span>£{priceBounds.lo}</span>
                  <span>£{priceBounds.hi}</span>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-brand transition-colors uppercase tracking-widest border border-dashed border-border rounded-2xl"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* ── Products Grid ── */}
          <div className="min-h-[400px]">
            {/* Active filter pills + count */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <p className="text-sm font-medium text-muted-foreground mr-2">
                <span className="text-foreground font-black">{list.length}</span> product
                {list.length === 1 ? "" : "s"} found
              </p>
              {search.q && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold">
                  "{search.q}"
                  <button onClick={() => update({ q: undefined })} aria-label="Clear search term">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {cat.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleIn("cat", c)}
                  className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-bold flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
                >
                  {sentence(c)} <X className="h-2.5 w-2.5" />
                </button>
              ))}
              {size.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleIn("size", s)}
                  className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1 hover:bg-emerald-500/20 transition-all"
                >
                  {s} <X className="h-2.5 w-2.5" />
                </button>
              ))}
              {mattress.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleIn("mattress", m)}
                  className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 text-xs font-bold flex items-center gap-1 hover:bg-sky-500/20 transition-all"
                >
                  {m} <X className="h-2.5 w-2.5" />
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
                <div className="text-5xl mb-4">🛋️</div>
                <h3 className="font-display font-black text-xl">No products found</h3>
                <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                  Try a different size, category, or reset your filters.
                </p>
                <button
                  onClick={clearAll}
                  className="mt-6 h-11 px-7 rounded-2xl bg-brand text-brand-foreground font-black text-sm hover:scale-105 active:scale-95 transition-all"
                >
                  Show all products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
