import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import {
  REVIEWS_SORTED,
  REVIEW_AVG,
  REVIEW_COUNT,
  REVIEW_AVG_LABEL,
  aggregateRatingJsonLd,
  reviewJsonLd,
} from "@/lib/reviews";

export const Route = createFileRoute("/reviews")({
  head: () => {
    const description = `${REVIEW_AVG_LABEL} out of 5 from ${REVIEW_COUNT} customer reviews of AQ Beds beds, sofas and wardrobes. Free UK delivery. Cash on delivery available.`;
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
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Customer Reviews | AQ Beds",
            url: "https://www.aqbeds.com/reviews",
            aggregateRating: aggregateRatingJsonLd(),
            review: REVIEWS_SORTED.map(reviewJsonLd),
          }),
        },
      ],
    };
  },
  component: ReviewsPage,
});

function ReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<"newest" | "highest">("newest");

  const stars = Math.round(REVIEW_AVG);
  const ratingOptions = [...new Set(REVIEWS_SORTED.map((r) => r.rating))].sort((a, b) => b - a);

  let visible = REVIEWS_SORTED;
  if (ratingFilter !== null) visible = visible.filter((r) => r.rating === ratingFilter);
  if (sort === "highest") {
    visible = [...visible].sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 animate-fade-in">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-3">
        What customers say
      </p>
      <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight">
        Customer reviews
      </h1>

      <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-brand/20 bg-brand/[0.06] px-5 py-2.5">
        <span className="text-sm font-bold">
          ★ {REVIEW_AVG_LABEL} out of 5 · {REVIEW_COUNT} Reviews
        </span>
        <span className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
            />
          ))}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by rating">
          <button
            onClick={() => setRatingFilter(null)}
            className={`h-9 rounded-full border px-4 text-sm font-semibold transition-colors ${
              ratingFilter === null
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-card hover:border-brand/40"
            }`}
          >
            All ({REVIEW_COUNT})
          </button>
          {ratingOptions.map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`h-9 rounded-full border px-4 text-sm font-semibold transition-colors ${
                ratingFilter === r
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-card hover:border-brand/40"
              }`}
            >
              {r} ★ ({REVIEWS_SORTED.filter((x) => x.rating === r).length})
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Sort
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "highest")}
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-brand"
          >
            <option value="newest">Newest first</option>
            <option value="highest">Highest rated</option>
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {visible.map((r) => (
          <ReviewCard key={`${r.author}-${r.date}`} review={r} />
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
