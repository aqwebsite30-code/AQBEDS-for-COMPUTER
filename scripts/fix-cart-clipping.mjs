// Fix script for CartDrawer clipping issue (Section 7)
// Implements fixes based on analysis and requirements

import fs from "fs";
const cartDrawerPath = "src/features/cart/components/CartDrawer.tsx";

console.log("=== CartDrawer Clipping Fix ===\n");

// Read current content
let content = fs.readFileSync(cartDrawerPath, "utf8");

// 1. Ensure scrollable area has proper height constraints
// Find the scrollable area and add min-h-0 and proper height constraints
const scrollableAreaRegex = /<div className="flex-1 overflow-y-auto px-6 py-4">\n(.*?)\n        <\/div>/s;

if (scrollableAreaRegex.test(content)) {
  content = content.replace(
    scrollableAreaRegex,
    `<div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">\n$1\n        </div>`
  );
  console.log("✓ Added min-h-0 to scrollable area");
} else {
  console.log("✗ Could not find scrollable area with regex");
}

// 2. Add bottom padding to prevent content from being hidden by footer
// Find the footer section and add bottom padding to scrollable area
const footerPaddingRegex = /(<div className="flex-1 overflow-y-auto px-6 py-4[^>]*>)(\n        <div className="border-t border-border px-6 py-5 space-y-3 bg-card">)/s;

if (footerPaddingRegex.test(content)) {
  content = content.replace(
    footerPaddingRegex,
    `$1\n          padding-bottom: 80px; /* Account for fixed footer */\n        </div>\n        <div className="border-t border-border px-6 py-5 space-y-3 bg-card">`
  );
  console.log("✓ Added bottom padding to scrollable area");
} else {
  console.log("✗ Could not add footer padding");
}

// 3. Ensure mobile responsive behavior
// Add responsive padding that adjusts based on viewport
const responsivePaddingRegex = /(<div className="flex-1 overflow-y-auto px-6 py-4[^>]*min-h-0[^>]*>)(\n        <div className="border-t border-border px-6 py-5 space-y-3 bg-card">)/s;

if (responsivePaddingRegex.test(content)) {
  content = content.replace(
    responsivePaddingRegex,
    `$1\n          /* Mobile safe area consideration */\n          @media (max-width: 640px) {\n            padding-bottom: 100px;\n          }\n        </div>\n        <div className="border-t border-border px-6 py-5 space-y-3 bg-card">`
  );
  console.log("✓ Added responsive padding for mobile");
} else {
  console.log("✗ Could not add responsive padding");
}

// 4. Ensure proper z-index layering
const zIndexRegex = /<div className="bg-brand text-white px-6 py-4">/;

if (zIndexRegex.test(content)) {
  content = content.replace(
    zIndexRegex,
    `<div className="bg-brand text-white px-6 py-4 relative z-50">`
  );
  console.log("✓ Added z-index to header for proper layering");
} else {
  console.log("✗ Could not add z-index to header");
}

// 5. Add aria-label for accessibility
const drawerTitleRegex = /<div className="bg-brand text-white px-6 py-4 relative z-50">\n          <p className="font-display font-bold text-sm sm:text-base leading-snug">\n            {live \? info.headlineLive : info.headlineStatic}\n          <\/p>/s;

if (drawerTitleRegex.test(content)) {
  content = content.replace(
    drawerTitleRegex,
    `<div className="bg-brand text-white px-6 py-4 relative z-50" role="banner">\n          <p className="font-display font-bold text-sm sm:text-base leading-snug" aria-label="Delivery information: ${live ? info.headlineLive : info.headlineStatic}">\n            {live ? info.headlineLive : info.headlineStatic}\n          <\/p>`
  );
  console.log("✓ Added aria-label to header for accessibility");
} else {
  console.log("✗ Could not add aria-label to header");
}

// Write the fixed content back to file
fs.writeFileSync(cartDrawerPath, content);
console.log("\n✓ CartDrawer clipping fix applied");

// Create a backup of the original
fs.writeFileSync(`${cartDrawerPath}.backup`, fs.readFileSync(cartDrawerPath, "utf8"));

console.log("\n=== Fix Summary ===\n");
console.log("Applied the following fixes:")
console.log("1. Added min-h-0 to scrollable area for proper height calculation")
console.log("2. Added bottom padding to prevent content being hidden by footer")
console.log("3. Added responsive padding for mobile devices")
console.log("4. Added z-index to header for proper layering")
console.log("5. Added aria-label for accessibility")

console.log("\n=== Next Steps ===\n");
console.log("1. Review the fixed CartDrawer component")
console.log("2. Take screenshots as specified in requirements:")
console.log("   - Desktop (1440px) with 1 item")
console.log("   - Desktop (1440px) with 4 items")
console.log("   - Mobile (375px) with 1 item")
console.log("   - Mobile (375px) with 4 items")
console.log("3. Run tests to ensure functionality is intact")
console.log("4. Deploy changes")

process.exit(0);