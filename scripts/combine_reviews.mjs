import fs from "fs";
import path from "path";

// Read the current reviews.json
currentReviews = JSON.parse(fs.readFileSync("data/reviews.json", "utf8"));
console.log("Current reviews count:", currentReviews.length);

// Find the voice message review (Sarah M.)
const voiceReview = currentReviews.find(r => r.author === "Sarah M.");
console.log("Voice review found:", !!voiceReview);

// Create the combined reviews array
const combinedReviews = [...currentReviews];

// If the voice review exists, update its voice_message path to use mp4 instead of opus
if (voiceReview) {
  // Check if mp4 file exists
  try {
    fs.accessSync("public/voice messgae.mp4", fs.constants.F_OK);
    voiceReview.voice_message = "/voice messgae.mp4";
    console.log("Updated voice message to mp4 format:"); console.log(voiceReview.voice_message);
  } catch (err) {
    console.log("mp4 file not found, keeping opus format");
  }
}

// Sort reviews with GB-first, newest-first within each group
const reviewsSorted = combinedReviews.sort((a, b) => {
  const aGB = a.country === "GB" ? 0 : 1;
  const bGB = b.country === "GB" ? 0 : 1;
  if (aGB !== bGB) return aGB - bGB;
  return b.date.localeCompare(a.date);
});

console.log("Sorted reviews count:", reviewsSorted.length);
console.log("GB reviews:", reviewsSorted.filter(r => r.country === "GB").length);
console.log("Non-GB reviews:", reviewsSorted.filter(r => r.country !== "GB").length);

// Calculate rating
const rating = reviewsSorted.reduce((sum, r) => sum + r.rating, 0) / reviewsSorted.length;
console.log("Average rating:", rating.toFixed(2));

// Save the sorted reviews back to reviews.json
fs.writeFileSync("data/reviews.json", JSON.stringify(reviewsSorted, null, 2));
console.log("Combined and sorted reviews saved to data/reviews.json");

// Also update src/lib/reviews.ts to re-export from the updated reviews.json
const reviewsTs = `import rawData from "../../data/reviews.json";

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
`;

fs.writeFileSync("src/lib/reviews.ts", reviewsTs);
console.log("Updated src/lib/reviews.ts");

console.log("\n✅ Combined and sorted reviews processed successfully!");
console.log("Total reviews:", reviewsSorted.length);
console.log("GB reviews:", reviewsSorted.filter(r => r.country === "GB").length);
console.log("Voice message format updated to mp4:", voiceReview ? voiceReview.voice_message : "N/A");

// Verify the reviews.json file was written correctly
const finalReviews = JSON.parse(fs.readFileSync("data/reviews.json", "utf8"));
console.log("\nVerification - Final reviews count:", finalReviews.length);
const sarahReview = finalReviews.find(r => r.author === "Sarah M.");
console.log("Sarah M. review voice_message:", sarahReview ? sarahReview.voice_message : "NOT FOUND");