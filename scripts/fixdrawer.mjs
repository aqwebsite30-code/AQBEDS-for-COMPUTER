import fs from "fs";
let c = fs.readFileSync("src/features/cart/components/CartDrawer.tsx", "utf8");

c = c.replace(
  `        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 overscroll-contain">
          {items.length === 0 ?`,
  `        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 overscroll-contain">
          <div style={{ paddingBottom: "32px" }}>
          {items.length === 0 ?`
);

c = c.replace(
  `              {/* B7 — "What happens next" mini-map: vertical on mobile, horizontal-ish on desktop */}
              <ol className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">`,
  `              </ol>
              </div>
              {/* B7 — "What happens next" mini-map: vertical on mobile, horizontal-ish on desktop */}
              <ol className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">`
);

fs.writeFileSync("src/features/cart/components/CartDrawer.tsx", c);
console.log("CartDrawer spacing applied.");
