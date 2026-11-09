import { useRouterState } from "@tanstack/react-router";

/**
 * Phase J3 — one visible breadcrumb trail plus matching BreadcrumbList JSON-LD
 * on every indexable template.
 *
 * The trail is derived from the pathname, so a new route gets a breadcrumb
 * without touching this file. Labels are the only hand-maintained part: add an
 * entry here when a new top-level page is created.
 *
 * Skipped on the home page (the trail would be a single item), on /admin (not
 * public) and on /checkout (transactional, not a landing page).
 */

const SITE = "https://www.aqbeds.com";

const STATIC_LABELS: Record<string, string> = {
  shop: "Shop",
  category: "Categories",
  product: "Products",
  guides: "Guides",
  faqs: "FAQs",
  delivery: "Delivery",
  returns: "Returns",
  "size-guide": "Size guide",
  about: "About",
  contact: "Contact",
  reviews: "Reviews",
  track: "Track an order",
  terms: "Terms",
  privacy: "Privacy",
};

/** "ottoman-beds" -> "Ottoman Beds", "4ft6-double" -> "4ft6 Double". */
function humanise(segment: string): string {
  return decodeURIComponent(segment)
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** /product/<slug> and /category/<slug> both read Home > Shop > <name>. */
const HEAD_ALIASES: Record<string, { name: string; path: string }> = {
  product: { name: "Shop", path: "/shop" },
  category: { name: "Shop", path: "/shop" },
};

function buildTrail(pathname: string): { name: string; path: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return [];

  const trail: { name: string; path: string }[] = [{ name: "Home", path: "/" }];
  let accumulated = "";

  segments.forEach((segment, index) => {
    accumulated += `/${segment}`;

    const alias = index === 0 ? HEAD_ALIASES[segment] : undefined;
    if (alias) {
      trail.push(alias);
      return;
    }

    // Second-level segments are slugs (product, category, guide) — the slug is
    // the readable name. Everything else uses the static label when it exists.
    const isSlug = index === 1;
    const label = isSlug ? humanise(segment) : STATIC_LABELS[segment] || humanise(segment);
    trail.push({ name: label, path: accumulated });
  });

  return trail;
}

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/checkout")) {
    return null;
  }

  const trail = buildTrail(pathname);
  if (trail.length < 2) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE}${item.path === "/" ? "" : item.path}`,
    })),
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        data-testid="breadcrumbs"
        className="mx-auto w-full max-w-7xl px-4 pt-4"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="font-semibold text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <a href={item.path} className="hover:text-brand hover:underline">
                    {item.name}
                  </a>
                )}
                {!isLast && <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
