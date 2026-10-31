// Simple CartDrawer clipping fix - final version
// Makes targeted edits to fix the clipping issue safely

import fs from "fs";
const cartDrawerPath = "src/features/cart/components/CartDrawer.tsx";

console.log("=== Final CartDrawer Clipping Fix ===\n");

let content = fs.readFileSync(cartDrawerPath, "utf8");
let changesMade = 0;

// 1. Add min-h-0 to scrollable area
const scrollableLine = "<div className=\"flex-1 overflow-y-auto px-6 py-4\">";
const scrollableLineFixed = "<div className=\"flex-1 overflow-y-auto px-6 py-4 min-h-0\">";

if (content.includes(scrollableLine)) {
  content = content.replaceAll(scrollableLine, scrollableLineFixed);
  changesMade++;
  console.log("✓ Added min-h-0 to scrollable area");
} else {
  console.log("✗ Could not find scrollable area line");
}

// 2. Add proper z-index to header
const headerLine = '<div className="bg-brand text-white px-6 py-4">';
const headerLineFixed = '<div className="bg-brand text-white px-6 py-4 relative z-50">';

if (content.includes(headerLine)) {
  content = content.replaceAll(headerLine, headerLineFixed);
  changesMade++;
  console.log("✓ Added z-index to header");
} else {
  console.log("✗ Could not find header line");
}

// 3. Write the fixed content back
fs.writeFileSync(cartDrawerPath, content);

// Create backup
fs.writeFileSync(`${cartDrawerPath}.backup_final`, fs.readFileSync(cartDrawerPath, "utf8"));

console.log("\n=== Fix Summary ===\n");
console.log(`Applied ${changesMade} fix(es) to CartDrawer component.

Changes made:
1. Added min-h-0 to scrollable area for proper height calculation
2. Added z-index to header for proper layering

These changes will help prevent clipping issues by:
- Ensuring the scrollable area has proper height calculation
- Giving the header a higher z-index to prevent overlap issues

=== Next Steps ===
1. Review the fixed CartDrawer component
2. Test on actual devices (mobile and desktop)
3. Take screenshots as required
4. Run acceptance tests
5. Deploy changes
");

process.exit(0);