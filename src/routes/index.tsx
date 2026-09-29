import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useMotionValue, useTransform, useSpring, useInView } from "framer-motion";
import { CATEGORIES, PRODUCTS } from "@/features/products/data/products";
import { ProductCard } from "@/features/products/components/ProductCard";
import { responsiveSrc } from "@/lib/responsive-image";
import { TESTIMONIALS } from "@/features/home/data/testimonials";
import { HeroCarousel } from "@/components/ui/HeroCarousel";
import { ArrowRight, Truck, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
import React, { useRef, lazy, Suspense, useState, useEffect } from "react";

const HOME_CATEGORIES = CATEGORIES.filter((c) => c.slug !== "all-beds" && !c.noindex).slice(0, 10);
const HOME_CATEGORY_COUNT = 1 + HOME_CATEGORIES.length;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AQ Beds | Handcrafted Ottoman, Divan & Storage Beds UK" },
      {
        name: "description",
        content:
          "Handcrafted ottoman, divan & luxury beds from £185, with mattresses included. Free UK delivery. Cash on delivery available. 10,000+ happy customers.",
      },
      { property: "og:title", content: "AQ Beds | Handcrafted Ottoman, Divan & Storage Beds UK" },
      {
        property: "og:description",
        content:
          "Handcrafted ottoman, divan & luxury beds from £185, with mattresses included. Free UK delivery. Cash on delivery available. 10,000+ happy customers.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { property: "og:url", content: "https://www.aqbeds.com" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AQ Beds | Handcrafted Ottoman, Divan & Storage Beds UK" },
      {
        name: "twitter:description",
        content:
          "Handcrafted ottoman, divan & luxury beds from £185, with mattresses included. Free UK delivery. Cash on delivery available.",
      },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AQ Beds",
          url: "https://www.aqbeds.com",
          logo: "https://www.aqbeds.com/apple-touch-icon.png",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+44-7519-791128",
            contactType: "customer service",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "AQ Beds",
          url: "https://www.aqbeds.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.aqbeds.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: Home,
});

const Testimonials = lazy(() => import("@/features/home/components/LazySections"));
const PromoBanner = lazy(() =>
  import("@/features/home/components/LazySections").then((m) => ({ default: m.PromoBanner })),
);

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "20px" });

  // Bug 1 Fix: Ensure initial sections are visible if JavaScript/IO is delayed or on first render
  const [hasAppeared, setHasAppeared] = useState(false);
  useEffect(() => {
    if (inView) setHasAppeared(true);
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView || hasAppeared ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.4, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Home() {
  // Best Sellers - Only Beds
  const bestsellingSlugs = [
    "ambessador", // Bed
    "divan-ottoman-bed", // Bed
    "panel-line", // Bed
    "florida-bed", // Bed
    "sleigh", // Bed
    "oxford-wingback", // Bed
    "hilton", // Bed
    "arizona", // Bed
  ];
  const featured = bestsellingSlugs
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean) as typeof PRODUCTS;
  const disableHero = typeof window !== "undefined" && (window as any).__AQ_FLAGS?.DISABLE_HERO;

  const reviews = TESTIMONIALS;

  return (
    <div className="overflow-x-hidden">
      {!disableHero && <HeroCarousel />}

      {/* ══════════════════════════════════════════════════════
          TRUST BADGES — Elevated glass
      ══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Truck, t: "Free UK Delivery", s: "To your door" },
              { icon: Wallet, t: "Cash on Delivery", s: "Pay when it arrives" },
              { icon: ShieldCheck, t: "At-Door Returns", s: "Check it when it arrives" },
              {
                icon: MessageCircle,
                t: "Next Day Free Replacement",
                s: "Free, the very next day",
              },
            ].map(({ icon: Icon, t, s }) => (
              <div
                key={t}
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-brand/30 hover:shadow-luxury transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-xl bg-brand/10 text-brand grid place-items-center flex-shrink-0 group-hover:bg-brand group-hover:text-white transition-all duration-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{t}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORIES — Bento Grid
      ══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-2">
              Find Your Fit
            </p>
            <h2 className="font-display font-black text-3xl sm:text-5xl">Shop By Category</h2>
            <p className="text-muted-foreground mt-3 max-w-md">
              Shop by the problem you're solving — more storage, a bigger bed, or a full bedroom
              upgrade.
            </p>
          </div>
          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-brand hover:gap-3 transition-all group"
          >
            Shop All {HOME_CATEGORY_COUNT} Categories{" "}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* All Beds - Large Card (Spans full width on mobile for impact) */}
          <Reveal className="col-span-2 md:row-span-2 h-full">
            <Link
              to="/category/$slug"
              params={{ slug: "all-beds" }}
              className="group relative overflow-hidden rounded-3xl block w-full h-full min-h-[220px] sm:min-h-[320px] md:min-h-[440px] tap-highlight-transparent"
            >
              <div className="absolute inset-0">
                <img
                  src={CATEGORIES.find((c) => c.slug === "all-beds")?.image}
                  srcSet={
                    responsiveSrc(CATEGORIES.find((c) => c.slug === "all-beds")?.image ?? "").srcSet
                  }
                  sizes="(min-width: 768px) 50vw, 100vw"
                  alt="Panel Line bed"
                  className="h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-110"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-brand/20 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white">
                <h3 className="font-display font-black text-2xl sm:text-4xl">All Beds</h3>
                <p className="text-xs sm:text-base text-white/70 mt-1 sm:mt-2">
                  Our entire collection of handcrafted beds
                </p>
                <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold mt-4 sm:mt-6 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm md:group-hover:bg-brand md:group-hover:border-brand transition-all">
                  Shop All Beds <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Other Categories - Use a more attractive 4:5 aspect ratio on mobile instead of square */}
          {HOME_CATEGORIES.map((c, i) => {
            const content = (
              <Link
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl block aspect-[4/5] sm:aspect-square cursor-pointer active:scale-[0.98] transition-transform tap-highlight-transparent bg-muted"
              >
                <div className="absolute inset-0">
                  <img
                    {...responsiveSrc(c.image)}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-white">
                  <h3 className="font-display font-bold text-base sm:text-xl">{c.name}</h3>
                  <p className="hidden sm:block text-[10px] sm:text-xs text-white/70 mt-1 opacity-0 md:group-hover:opacity-100 translate-y-2 md:group-hover:translate-y-0 transition-all duration-300">
                    {c.blurb}
                  </p>
                </div>
              </Link>
            );
            return (
              <React.Fragment key={c.slug}>
                <div className="hidden md:block">
                  <Reveal delay={(i + 1) * 0.05} className="h-full">
                    {content}
                  </Reveal>
                </div>
                <div className="block md:hidden">{content}</div>
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════════════════════ */}
      <section id="bestsellers" className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <Reveal className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-2">
              Bestsellers
            </p>
            <h2 className="font-display font-black text-3xl sm:text-5xl">Our Most Loved Beds</h2>
            <p className="text-muted-foreground mt-3 max-w-md">
              Trusted by UK sleepers since 2018 — free UK delivery, Cash on Delivery and Next Day
              Free Replacement.
            </p>
          </div>
          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-brand hover:gap-3 transition-all group"
          >
            Shop All Beds{" "}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PROMO BANNER & TESTIMONIALS (LAZY LOADED)
      ══════════════════════════════════════════════════════ */}
      <Suspense fallback={null}>
        <PromoBanner />
        <Testimonials reviews={reviews} />
      </Suspense>
    </div>
  );
}
