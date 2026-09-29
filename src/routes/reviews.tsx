import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/features/home/data/testimonials";

export const Route = createFileRoute("/reviews")({
  head: () => {
    const avg = TESTIMONIALS.reduce((sum, r) => sum + r.rating, 0) / TESTIMONIALS.length;
    const description = `${avg.toFixed(1)} out of 5 from ${TESTIMONIALS.length} customer reviews of AQ Beds beds, sofas and wardrobes. Free UK delivery. Cash on delivery available.`;
    return {
      meta: [
        { title: "Customer Reviews | AQ Beds" },
        { name: "description", content: description },
        { property: "og:title", content: "Customer Reviews | AQ Beds" },
        { property: "og:description", content: description },
        {
          property: "og:image",
          content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
        },
        { property: "og:url", content: "https://www.aqbeds.com/reviews" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Customer Reviews | AQ Beds" },
        {
          name: "twitter:image",
          content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
        },
      ],
      links: [{ rel: "canonical", href: "https://www.aqbeds.com/reviews" }],
    };
  },
  component: ReviewsPage,
});

function ReviewsPage() {
  const avg = TESTIMONIALS.reduce((sum, r) => sum + r.rating, 0) / TESTIMONIALS.length;
  const stars = Math.round(avg);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 animate-fade-in">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-3">
        What customers say
      </p>
      <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight">
        Customer reviews
      </h1>

      <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-brand/20 bg-brand/[0.06] px-5 py-2.5">
        <span className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
            />
          ))}
        </span>
        <span className="text-sm font-bold">
          {avg.toFixed(1)}/5 from {TESTIMONIALS.length} review{TESTIMONIALS.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {TESTIMONIALS.map((r) => (
          <figure
            key={r.name}
            className="rounded-3xl border border-border bg-card p-6 flex flex-col"
          >
            <div className="flex gap-0.5 mb-4" aria-label={`${r.rating} out of 5 stars`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <blockquote className="text-sm text-foreground/85 leading-relaxed italic flex-1">
              "{r.comment}"
            </blockquote>
            <figcaption className="mt-5 pt-4 border-t border-border/60 text-sm">
              <span className="font-bold text-brand">{r.name}</span>
              <span className="text-muted-foreground"> · {r.city}</span>
              <p className="text-xs text-muted-foreground mt-1">Product: {r.product}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-12 rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 text-center">
        <h2 className="font-display font-black text-2xl">Bought from us?</h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Reply to your order email or message us on WhatsApp and we will publish your review on
          this page. Thinking about ordering? See the range first.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/shop"
            className="inline-flex h-11 items-center rounded-2xl bg-brand text-brand-foreground px-6 text-sm font-black hover:opacity-90 transition-opacity"
          >
            Shop the range
          </Link>
          <Link
            to="/size-guide"
            className="inline-flex h-11 items-center rounded-2xl border border-border px-6 text-sm font-bold hover:border-brand/40 transition-colors"
          >
            Read the size guide
          </Link>
        </div>
      </div>
    </div>
  );
}
