const fs = require('fs');

// Read current reviews.json
currentReviews = JSON.parse(fs.readFileSync('data/reviews.json', 'utf8'));

// Try to get reviews from git show 55c4f7c:data/reviews.json
const { execSync } = require('child_process');

let originalReviews;
try {
  // Try to get original reviews from git
  const output = execSync('git show 55c4f7c:data/reviews.json', { encoding: 'utf8' });
  originalReviews = JSON.parse(output);
  console.log("Original reviews count from git:", originalReviews ? originalReviews.length : "N/A");
} catch (err) {
  console.log("Could not get original reviews from git, trying alternative method...");
  
  // Alternative: look for backup or reference files
  const possibleFiles = [
    'data/reviews.json.backup',
    'data/reviews.json.orig',
    'data/reviews.original.json',
    'data/reviews.old.json',
    'reviews-original.json',
    'reviews-backup.json'
  ];
  
  for (const file of possibleFiles) {
    try {
      if (fs.existsSync(file)) {
        originalReviews = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(`Found original reviews in ${file}: ${originalReviews.length} reviews`);
        break;
      }
    } catch (e) {
      // File doesn't exist or can't be parsed
    }
  }
  
  if (!originalReviews) {
    console.log("Could not find original reviews file. Looking at git diff output...");
    
    // Try to run git diff to see what changed
    try {
      const diffOutput = execSync('git diff 55c4f7c data/reviews.json --stat', { encoding: 'utf8' });
      console.log("Git diff output:", diffOutput);
    } catch (e) {
      // Git diff also failed
    }
  }
}

// Analyze current reviews
console.log("\nCurrent reviews analysis:");
console.log("Total current reviews:", currentReviews.length);

// Find voice message review
const voiceReview = currentReviews.find(r => r.voice_message);
console.log("Voice message review:", voiceReview ? voiceReview.author : "None found");

// Find reviews with owner replies
const reviewsWithOwnerReplies = currentReviews.filter(r => r.owner_reply || r.owner_reply_date);
console.log("Reviews with owner replies:", reviewsWithOwnerReplies.length);

// Find reviews mentioning "AQ Beds" in body
const reviewsMentioningAQBeds = currentReviews.filter(r => r.body.includes("AQ Beds"));
console.log("Reviews mentioning AQ Beds:", reviewsMentioningAQBeds.length);

// Check if the current reviews look like the combination of original + new
if (originalReviews) {
  console.log("\nOriginal vs Current comparison:");
  console.log("Original reviews:", originalReviews.length);
  console.log("Current reviews:", currentReviews.length);
  
  // Find reviews in original but not in current (deleted)
  const deletedReviews = originalReviews.filter(orig => 
    !currentReviews.some(curr => curr.author === orig.author && curr.date === orig.date)
  );
  console.log("Deleted reviews:", deletedReviews.length);
  if (deletedReviews.length > 0) {
    console.log("Deleted review authors:", deletedReviews.map(r => r.author));
  }
  
  // Find reviews in current but not in original (added)
  const addedReviews = currentReviews.filter(curr => 
    !originalReviews.some(orig => orig.author === curr.author && orig.date === curr.date)
  );
  console.log("Added reviews:", addedReviews.length);
  if (addedReviews.length > 0) {
    console.log("Added review authors:", addedReviews.map(r => r.author));
  }
}

console.log("\nVoice message path in current reviews:", voiceReview ? voiceReview.voice_message : "NOT FOUND");

// Check if the current voice_message is mp4
if (voiceReview && voiceReview.voice_message) {
  const isMP4 = voiceReview.voice_message.includes('.mp4');
  const isOPUS = voiceReview.voice_message.includes('.opus');
  console.log("Voice message format - MP4:", isMP4, "OPUS:", isOPUS);
}