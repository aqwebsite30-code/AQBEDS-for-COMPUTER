// Read current reviews.json
const fs = require('fs');
let reviews = JSON.parse(fs.readFileSync('data/reviews.json', 'utf8'));

// Find Sarah M. review
sarahReview = reviews.find(r => r.author === 'Sarah M.');
if (sarahReview) {
  // Check if mp4 exists
  try {
    fs.accessSync('public/voice messgae.mp4', fs.constants.F_OK);
    sarahReview.voice_message = '/voice messgae.mp4';
    console.log('Updated Sarah M. voice message to mp4:', sarahReview.voice_message);
  } catch (err) {
    console.log('mp4 not found, keeping opus format');
  }
}

// Sort reviews with GB-first, newest-first
reviews.sort((a, b) => {
  const aGB = a.country === 'GB' ? 0 : 1;
  const bGB = b.country === 'GB' ? 0 : 1;
  if (aGB !== bGB) return aGB - bGB;
  return b.date.localeCompare(a.date);
});

// Save back
fs.writeFileSync('data/reviews.json', JSON.stringify(reviews, null, 2));
console.log('Reviews sorted and saved. Total:', reviews.length);

// Verify
sarahFinal = reviews.find(r => r.author === 'Sarah M.');
console.log('Sarah final voice_message:', sarahFinal ? sarahFinal.voice_message : 'NOT FOUND');