import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CATEGORIES, type Category, getByCategory } from "@/features/products/data/products";
import { getDbProducts } from "@/lib/products";
import { responsiveSrc } from "@/lib/responsive-image";
import { ProductCard } from "@/features/products/components/ProductCard";
import { motion } from "framer-motion";

// Buying-guide interlinks for the storage-bed family (§7.3)
const GUIDE_LINKS: Record<string, string> = {
  "ottoman-beds": "Ottoman vs divan — how to choose →",
  "divan-beds": "Ottoman vs divan — how to choose →",
  "storage-beds": "Ottoman vs divan — how to choose →",
};

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const cat = CATEGORIES.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    const dbProducts = await getDbProducts();
    return { category: cat, dbProducts };
  },
  head: ({ loaderData }) => {
    const noindex = !!loaderData?.category.noindex;
    const titleBySlug: Record<string, string> = {
      "divan-beds": "Divan Beds with Storage Drawers | Free UK Delivery - AQ Beds",
      "ottoman-beds": "Ottoman Beds with Gas-Lift Storage | From £350 - AQ Beds",
      "luxury-beds": "Luxury Beds from £210 | Velvet Wingback & Sleigh Beds - AQ Beds",
      wardrobes: "Wardrobes & Sliding Wardrobes UK from £150 - AQ Beds",
      sofas: "Velvet Sofas & Sofa Beds from £185 - AQ Beds",
      "sliding-wardrobes": "Sliding Wardrobes UK | Space-Saving Storage - AQ Beds",
      "all-beds": "All Beds | Ottoman, Divan & Storage Beds UK - AQ Beds",
    };
    const title = loaderData
      ? titleBySlug[loaderData.category.slug] || `${loaderData.category.name} - AQ Beds`
      : "Category - AQ Beds";
    const desc = loaderData
      ? `${loaderData.category.intro || loaderData.category.blurb}`.slice(0, 158)
      : "";
    return {
      meta: loaderData
        ? [
            { title },
            { name: "description", content: desc },
            ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
            { property: "og:title", content: title },
            { property: "og:description", content: desc },
            { property: "og:image", content: `https://www.aqbeds.com${loaderData.category.image}` },
            {
              property: "og:url",
              content: `https://www.aqbeds.com/category/${loaderData.category.slug}`,
            },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: title },
            { name: "twitter:description", content: desc },
            {
              name: "twitter:image",
              content: `https://www.aqbeds.com${loaderData.category.image}`,
            },
          ]
        : [],
      links: loaderData
        ? [
            {
              rel: "canonical",
              href:
                loaderData.category.slug === "all-beds"
                  ? "https://www.aqbeds.com/shop"
                  : `https://www.aqbeds.com/category/${loaderData.category.slug}`,
            },
          ]
        : [],
      scripts:
        loaderData && !noindex
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "CollectionPage",
                  name: loaderData.category.name,
                  url: `https://www.aqbeds.com/category/${loaderData.category.slug}`,
                  description: desc,
                }),
              },
            ]
          : [],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => <div className="p-10 text-center">Category not found.</div>,
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
});

function CategoryPage() {
  const { category, dbProducts } = Route.useLoaderData();
  const staticProducts = getByCategory(category.slug as Category) as any[];
  const dbFiltered = (dbProducts || []).filter((p) => p.category === category.slug);
  // Render each slug once - DB wins over the static fallback (same fix as /shop).
  const dbFilteredSlugs = new Set(dbFiltered.map((p: { slug?: string }) => p.slug));
  const products = [...dbFiltered, ...staticProducts.filter((p) => !dbFilteredSlugs.has(p.slug))];

  // Count label uses the right noun for the category (WP-B.3)
  const noun = category.slug.includes("wardrobe")
    ? "wardrobe"
    : category.slug === "sofas"
      ? "sofa"
      : category.slug === "mattresses"
        ? "mattress"
        : category.slug === "headboards"
          ? "headboard"
          : "bed";
  const countLabel = `${products.length} ${products.length === 1 ? noun : `${noun}s`}`;

  return (
    <div className="animate-fade-in bg-background min-h-screen">
      <section className="relative w-full aspect-video overflow-hidden bg-background">
        <img
          {...responsiveSrc(category.image)}
          sizes="100vw"
          alt={category.name}
          className="h-full w-full object-cover object-center"
        />
        {/* Cinematic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 sm:pb-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/70 font-bold">
              {category.name}
            </span>
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl mt-2 tracking-tighter leading-none">
              {category.name}
            </h1>
            <p className="mt-4 text-sm sm:text-lg text-white/70 max-w-3xl font-light leading-relaxed">
              {category.intro || category.blurb}
            </p>
            {GUIDE_LINKS[category.slug] && (
              <Link
                to="/guides/ottoman-vs-divan"
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white border-b border-white/40 pb-0.5 hover:border-white transition-colors"
              >
                {GUIDE_LINKS[category.slug]}
              </Link>
            )}
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-sm text-muted-foreground mb-6">{countLabel}</div>
        {products.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="font-display font-black text-xl">Coming Soon</h3>
            <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
              We are working hard to bring you the best {category.name.toLowerCase()}! Please check
              back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
