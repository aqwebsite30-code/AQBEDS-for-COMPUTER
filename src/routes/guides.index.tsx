import { createFileRoute, Link } from "@tanstack/react-router";

const GUIDES = [
  {
    to: "/guides/ottoman-vs-divan" as const,
    title: "Ottoman vs divan bed: which has more storage?",
    blurb:
      "How each storage bed works, what fits inside, the space you need around it, and a straight answer on which one suits your room.",
  },
  {
    to: "/size-guide" as const,
    title: "UK bed sizes and mattress size chart",
    blurb:
      "Single, double, king and super king measurements for frames and mattresses, so you can check a bed against your room before you order.",
  },
  {
    to: "/delivery" as const,
    title: "Delivery dates and the 8 PM cut-off",
    blurb:
      "How next-day delivery works, what happens on a Sunday order, and what to check at the door before you pay.",
  },
];

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Bed Buying Guides | Sizes, Storage and Delivery | AQ Beds" },
      {
        name: "description",
        content:
          "Practical bed buying guides from AQ Beds: ottoman vs divan storage, UK bed and mattress sizes, and how next-day delivery works with cash on delivery.",
      },
      {
        property: "og:title",
        content: "Bed Buying Guides | Sizes, Storage and Delivery | AQ Beds",
      },
      {
        property: "og:description",
        content:
          "Ottoman vs divan storage, UK bed sizes and next-day delivery explained without the sales pitch.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/og/divan-ottoman-bed.jpg",
      },
      { property: "og:url", content: "https://www.aqbeds.com/guides" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Bed buying guides | AQ Beds" },
      {
        name: "twitter:description",
        content: "Storage beds, UK sizes and delivery explained plainly.",
      },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/og/divan-ottoman-bed.jpg",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/guides" }],
  }),
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 animate-fade-in">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
        AQ Beds guides
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
        Buying a bed, without the guesswork
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Short, factual guides on the things customers ask us most: how storage
        beds differ, which size fits a room, and exactly when your bed will
        arrive.
      </p>

      <ul className="mt-12 space-y-6">
        {GUIDES.map((guide) => (
          <li
            key={guide.to}
            className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30"
          >
            <h2 className="font-serif text-xl text-foreground">
              <Link to={guide.to} className="hover:underline">
                {guide.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {guide.blurb}
            </p>
            <Link
              to={guide.to}
              className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
            >
              Read the guide
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 text-sm text-muted-foreground">
        Prefer to ask directly?{" "}
        <Link to="/contact" className="underline underline-offset-4">
          Contact AQ Beds
        </Link>{" "}
        and we will answer with the same detail.
      </p>
    </div>
  );
}
