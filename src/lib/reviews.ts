import rawData from "../../data/reviews.json";

export interface Review {
  author: string;
  country: string;
  date: string;
  rating: number;
  title: string;
  body: string;
  product_slug: string | null;
  verified: boolean;
  owner_reply?: string;
  owner_reply_date?: string;
  voice_message?: string;
}

export const REVIEWS: Review[] = rawData as Review[];

// T2/Section 2 — GB reviews first, newest-first within each group. Never shuffle.
export const REVIEWS_SORTED: Review[] = [...REVIEWS].sort((a, b) => {
  const aGB = a.country === "GB" ? 0 : 1;
  const bGB = b.country === "GB" ? 0 : 1;
  if (aGB !== bGB) return aGB - bGB;
  return b.date.localeCompare(a.date);
});

export const REVIEW_COUNT = REVIEWS.length;

export const REVIEW_AVG = REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEW_COUNT;

export const REVIEW_AVG_LABEL = (Math.round(REVIEW_AVG * 100) / 100).toFixed(2);

export const TOP_REVIEWS: Review[] = REVIEWS_SORTED.slice(0, 6);
