import { Star } from "lucide-react";
import { Review, formatReviewDate } from "@/lib/reviews";

export function ReviewCard({ review, clamp = false }: { review: Review; clamp?: boolean }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{formatReviewDate(review.date)}</span>
      </div>
      <h3 className="mb-1.5 text-sm font-semibold">{review.title}</h3>
      <blockquote
        className={`flex-1 text-sm italic leading-relaxed text-foreground/85 ${clamp ? "line-clamp-5" : ""}`}
      >
        &ldquo;{review.body}&rdquo;
      </blockquote>
      {review.owner_reply && (
        <div className="mt-4 rounded-2xl border border-brand/10 bg-brand/[0.05] p-3">
          <p className="mb-1 text-[11px] font-bold text-brand">
            AQ Beds replied
            {review.owner_reply_date ? ` · ${formatReviewDate(review.owner_reply_date)}` : ""}
          </p>
          <p className="text-xs leading-relaxed text-foreground/75">{review.owner_reply}</p>
        </div>
      )}
      <figcaption className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-sm">
        <span className="truncate font-bold text-brand">{review.author}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">{review.country}</span>
          {review.verified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Verified
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
