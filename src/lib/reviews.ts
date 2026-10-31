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

/**
 * Format review date as "DD MMM YYYY" (e.g., "15 Jan 2026")
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Generate JSON-LD structured data for aggregate rating
 */
export function aggregateRatingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "AQ Beds",
    "description": "Premium beds, mattresses, and furniture with cash-on-delivery across UK & Ireland",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": REVIEW_AVG_LABEL,
      "reviewCount": REVIEW_COUNT,
      "bestRating": "5",
      "worstRating": "1"
    }
  };
}

/**
 * Generate JSON-LD structured data for individual reviews
 */
export function reviewsJsonLd(reviews: Review[]) {
  return reviews.map((review) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "datePublished": review.date,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "reviewBody": review.body,
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": "AQ Beds"
    }
  }));
}
