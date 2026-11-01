import fs from "fs";

// Read the current reviews.json
const currentReviews = JSON.parse(fs.readFileSync("data/reviews.json", "utf8"));

console.log("Current reviews count:", currentReviews.length);

// Find reviews with "owner_reply" (these are likely the original AQ Beds reviews)
const reviewsWithOwnerReplies = currentReviews.filter(r => r.owner_reply || r.owner_reply_date);
console.log("Reviews with owner replies:", reviewsWithOwnerReplies.length);

// Find reviews that mention "AQ Beds" in the body (these are likely the original reviews)
const reviewsMentioningAQBeds = currentReviews.filter(r => r.body.includes("AQ Beds"));
console.log("Reviews mentioning AQ Beds:", reviewsMentioningAQBeds.length);

// Find reviews that don't have "(Voice Review)" in title (these are likely the original reviews)
const regularReviews = currentReviews.filter(r => !r.title.includes("Voice Review"));
console.log("Regular reviews (without Voice Review):", regularReviews.length);

// Show first few reviews with owner replies to understand the original reviews
console.log("\nSample reviews with owner replies:")
for (let i = 0; i < Math.min(3, reviewsWithOwnerReplies.length); i++) {
  console.log(`${i + 1}. ${reviewsWithOwnerReplies[i].author} - ${reviewsWithOwnerReplies[i].title}`);
}

// Show first few reviews mentioning AQ Beds
console.log("\nSample reviews mentioning AQ Beds:")
for (let i = 0; i < Math.min(3, reviewsMentioningAQBeds.length); i++) {
  console.log(`${i + 1}. ${reviewsMentioningAQBeds[i].author} - ${reviewsMentioningAQBeds[i].title}`);
}

// Save the analysis
const analysis = {
  currentCount: currentReviews.length,
  reviewsWithOwnerReplies: reviewsWithOwnerReplies.length,
  reviewsMentioningAQBeds: reviewsMentioningAQBeds.length,
  regularReviews: regularReviews.length,
  sampleWithOwnerReplies: reviewsWithOwnerReplies.slice(0, 5).map(r => ({
    author: r.author,
    title: r.title,
    country: r.country,
    hasOwnerReply: !!(r.owner_reply || r.owner_reply_date)
  })),
  sampleMentioningAQBeds: reviewsMentioningAQBeds.slice(0, 5).map(r => ({
    author: r.author,
    title: r.title,
    country: r.country,
    bodyContainsAQBeds: r.body.includes("AQ Beds")
  }))
};

fs.writeFileSync("scripts/reviews-analysis.json", JSON.stringify(analysis, null, 2));
console.log("\nAnalysis saved to scripts/reviews-analysis.json");