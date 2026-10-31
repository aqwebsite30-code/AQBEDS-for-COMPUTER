// Simple CartDrawer clipping fix
// Makes targeted, safe edits to fix the clipping issue

import fs from "fs";
const cartDrawerPath = "src/features/cart/components/CartDrawer.tsx";

console.log("=== Simple CartDrawer Fix ===\n");

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

// 2. Add proper container structure with height constraints
const asideStart = content.indexOf("<aside className=\"fixed inset-0 z-50 flex\"");
if (asideStart > 0) {
  // Find the closing </aside> tag
  const asideEnd = content.indexOf("</aside>", asideStart);
  if (asideEnd > asideStart) {
    // Find the scrollable area within the aside
    const scrollableInAside = content.substring(asideStart, asideEnd);
    const scrollableWithMinH0 = scrollableInAside.replace(
      'className="flex-1 overflow-y-auto px-6 py-4"',
      'className="flex-1 overflow-y-auto px-6 py-4 min-h-0"'
    );
    
    content = content.substring(0, asideStart) + scrollableWithMinH0 + content.substring(asideEnd);
    changesMade++;
    console.log("✓ Fixed scrollable area inside aside container");
  }
} else {
  console.log("✗ Could not find aside container");
}

// 3. Add appropriate padding at the bottom to account for footer
// Find the footer and add padding to the scrollable area above it
const footerStart = content.indexOf("<footer className=\"border-t border-border px-6 py-5 space-y-3 bg-card\">");
if (footerStart > 0) {
  // Find the scrollable area before the footer
  const beforeFooter = content.substring(0, footerStart);
  const scrollableInBeforeFooter = beforeFooter.match(/<div className="flex-1 overflow-y-auto px-6 py-4[^>]*>/);
  
  if (scrollableInBeforeFooter) {
    const styledScrollable = scrollableInBeforeFooter[0].replace(
      '>',
      ' style="padding-bottom: 80px; /* Account for fixed footer */">'
    );
    
    content = content.replace(scrollableInBeforeFooter[0], styledScrollable);
    changesMade++;
    console.log("✓ Added bottom padding to scrollable area");
  }
} else {
  console.log("✗ Could not find footer");
}

// 4. Add proper z-index to header for better layering
const headerLine = '<div className="bg-brand text-white px-6 py-4">';
const headerLineFixed = '<div className="bg-brand text-white px-6 py-4 relative z-50">';

if (content.includes(headerLine)) {
  content = content.replaceAll(headerLine, headerLineFixed);
  changesMade++;
  console.log("✓ Added z-index to header");
} else {
  console.log("✗ Could not find header line");
}

// 5. Write the fixed content back
fs.writeFileSync(cartDrawerPath, content);

// Create backup
fs.writeFileSync(`${cartDrawerPath}.backup2`, fs.readFileSync(cartDrawerPath, "utf8"));

console.log("\n=== Fix Summary ===\n");
console.log(`Applied ${changesMade} fix(es) to CartDrawer component.

Changes made:
1. Added min-h-0 to scrollable area for proper height calculation
2. Added bottom padding to prevent content being hidden by footer
3. Added z-index to header for proper layering

=== Next Steps ===
1. Review the fixed CartDrawer component
2. Test on actual devices (mobile and desktop)
3. Take screenshots as required
4. Run acceptance tests
5. Deploy changes
");

process.exit(0);