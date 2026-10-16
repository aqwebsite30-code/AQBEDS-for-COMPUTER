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
}

export const REVIEWS: Review[] = rawData;

export const REVIEWS_SORTED: Review[] = [...REVIEWS].sort((a, b) => b.date.localeCompare(a.date));

export const REVIEW_COUNT = REVIEWS.length;

export const REVIEW_AVG = REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEW_COUNT;

export const REVIEW_AVG_LABEL = (Math.round(REVIEW_AVG * 100) / 100).toFixed(2);

export const TOP_REVIEWS: Review[] = REVIEWS_SORTED.slice(0, 6);

export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatReviewDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[month - 1]} ${year}`;
}

export function aggregateRatingJsonLd() {
  return {
    "@type": "AggregateRating",
    ratingValue: REVIEW_AVG_LABEL,
    reviewCount: REVIEW_COUNT,
    ratingCount: REVIEW_COUNT,
  };
}

export function reviewJsonLd(r: Review) {
  return {
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    datePublished: r.date,
    name: r.title,
    reviewBody: r.body,
    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
  };
}
