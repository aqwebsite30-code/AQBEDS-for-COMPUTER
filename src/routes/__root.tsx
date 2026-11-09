import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCartBar } from "@/components/layout/MobileCartBar";
import { GlobalEffects } from "@/components/ui/GlobalEffects";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect, useRef, Suspense, lazy } from "react";
import React from "react";
import { Zap } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendPageViewEvent } from "@/lib/meta-capi";
import { generateEventId, getClientTrackingData } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/analytics";
import { CONSENT_BOOTSTRAP, CONSENT_KEY, GTM_ID, hasAdConsent } from "@/lib/consent";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { WHATSAPP_NUMBER } from "@/lib/utils/format";
import { useCart } from "@/features/cart/store/cart";

const PIXEL_ID = "1109711544904339";

/**
 * Meta Pixel loader, defined in the head but only ever executed after the
 * visitor accepts. fbevents.js cannot honour Google Consent Mode, so the only
 * compliant option is not to insert it until ad_storage is granted.
 */
const PIXEL_LOADER = `
window.__aqPixelLoaded = false;
window.__aqLoadPixel = function () {
  if (window.__aqPixelLoaded) return;
  window.__aqPixelLoaded = true;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('set', 'autoConfig', false, '${PIXEL_ID}');
  fbq.disablePushState = true;
  fbq.allowDuplicatePageViews = true;
  fbq('init', '${PIXEL_ID}', { automaticConfiguration: false, automaticConfig: false });
};
var aqStoredConsent = null;
try { aqStoredConsent = localStorage.getItem('${CONSENT_KEY}'); } catch (e) {}
if (aqStoredConsent === 'accepted') window.__aqLoadPixel();
`;

const CartDrawer = lazy(() =>
  import("@/features/cart/components/CartDrawer").then((m) => ({ default: m.CartDrawer })),
);
const LiveChatWidget = lazy(() =>
  import("@/components/layout/LiveChatWidget").then((m) => ({ default: m.LiveChatWidget })),
);
const CookieConsent = lazy(() => import("@/components/layout/CookieConsent"));

function NotFoundComponent() {
  // Section 9 — honest, brand-consistent 404 with the correct page title.
  useEffect(() => {
    document.title = "Page Not Found — AQ Beds";
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-brand grid place-items-center text-brand-foreground font-display font-black text-sm shadow-[0_0_20px_rgba(11,60,93,0.3)]">
          AQ
        </div>
        <h1 className="mt-6 text-4xl sm:text-5xl font-display font-black text-foreground">
          Page not found
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you were looking for has moved or does not exist.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90"
          >
            Back to homepage
          </Link>
          <Link
            to="/track"
            search={{ token: "" }}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-5 text-sm font-bold transition-colors hover:border-brand/40"
          >
            Track my order
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              "Hi AQ Beds, I need help finding a page.",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            Message us
          </a>
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Handcrafted Ottoman, Divan and Storage Beds | AQ Beds" },
      {
        name: "description",
        content:
          "Premium ottoman, divan, storage beds & sofas with a mattress included, customisable online. Free UK delivery. Cash on delivery available.",
      },
      { property: "og:title", content: "AQ Beds — Luxury Beds & Sofas | Handcrafted in the UK" },
      {
        property: "og:description",
        content:
          "Premium ottoman, divan & storage beds with a mattress included. Free UK delivery. Cash on delivery available.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "AQ Beds" },
      { property: "og:url", content: "https://www.aqbeds.com" },
      { property: "og:image", content: "https://www.aqbeds.com/og-default.jpg" },
      {
        property: "og:image:alt",
        content: "AQ Beds — ottoman, divan and storage beds",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "AQ Beds — Luxury Ottoman, Divan & Storage Beds | Handcrafted in the UK",
      },
      {
        name: "twitter:description",
        content:
          "Premium ottoman, divan & storage beds with a mattress included. Free UK delivery. Cash on delivery available.",
      },
      { name: "twitter:image", content: "https://www.aqbeds.com/og-default.jpg" },
      {
        name: "twitter:image:alt",
        content: "AQ Beds — ottoman, divan and storage beds",
      },
      {
        name: "facebook-domain-verification",
        content: "j5x8wcmujnt0s2q9qm70q62e1cs42d",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
      // Critical Preloads for instant rendering
      {
        rel: "preload",
        href: "/fonts/inter-v12-latin-regular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/inter-v12-latin-700.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/poppins-v20-latin-700.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      // Critical Preloads for instant rendering
      {
        rel: "preload",
        href: "/Home%20page%20images/1000152185-clean.webp",
        as: "image",
        media: "(min-width: 768px)",
      },
      {
        rel: "preload",
        href: "/Home%20page%20images%20for%20mobile/1000155658-clean.webp",
        as: "image",
        media: "(max-width: 767px)",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * J5 — one Organization entity, emitted on every page.
 *
 * No legalName is set because no registered company name is published on the
 * site, and no postal address is set because none is published either. sameAs
 * lists only profiles the business actually owns; no social profile URL exists
 * in this codebase yet, so the key is omitted rather than guessed. Add the URLs
 * here once they are live.
 */
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.aqbeds.com/#organization",
  name: "AQ Beds",
  url: "https://www.aqbeds.com",
  logo: {
    "@type": "ImageObject",
    url: "https://www.aqbeds.com/apple-touch-icon.png",
  },
  description:
    "UK retailer of ottoman, divan and luxury beds, sofas, wardrobes and bedroom furniture, sold direct with free UK delivery and cash on delivery.",
  areaServed: { "@type": "Country", name: "United Kingdom" },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "+44-7519-791128",
      email: "info@aqbeds.com",
      areaServed: "GB",
      availableLanguage: "en",
    },
  ],
};

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        {/* Search engine ownership verification (Search Console + Bing). */}
        <meta
          name="google-site-verification"
          content="ltp3aArkcYwmRpS3b4xfh47CgwrRO0jDuWHxmavycI0"
        />
        <meta name="msvalidate.01" content="E166FBD2BC7AA8D07B30C232AA752973" />
        {/* Consent Mode v2 defaults. Must precede gtm.js so every tag in the
            container starts denied (see src/lib/consent.ts). */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP }} />
        {/* Google Tag Manager — one container only, and loaded by the bootstrap
            script above only after an Accept. To switch containers, change
            GTM_ID in src/lib/consent.ts (never add a second gtm.js script). */}
        {/* Meta Pixel is defined here but only inserted after an Accept. */}
        <script dangerouslySetInnerHTML={{ __html: PIXEL_LOADER }} />
      </head>
      <body>
        {/* Standard GTM fallback for visitors without JavaScript. */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { motion, AnimatePresence } from "framer-motion";

// Task 4: Diagnostic Isolation Flags
const FLAGS = {
  DISABLE_CHAT: false,
  DISABLE_MOTION: false,
  DISABLE_HERO: false,
  DISABLE_SUGGESTIONS: false,
};

if (typeof window !== "undefined") {
  (window as any).__AQ_FLAGS = FLAGS;
}

const trackVisitSimple = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: any }) => {
    try {
      const schema = z.object({
        token: z.string().min(1),
        pageUrl: z.string().optional().or(z.literal("")),
        referrer: z.string().optional().or(z.literal("")),
      });
      const parsed = schema.parse(data);
      const sp = await db.salesperson.findFirst({
        where: { token: parsed.token, status: "active" },
        select: { id: true, token: true },
      });
      if (sp) {
        await db.siteVisit.create({
          data: {
            salespersonId: sp.id,
            token: sp.token,
            pageUrl: parsed.pageUrl || null,
            referrer: parsed.referrer || null,
            userAgent: null,
          },
        });
      }
      return { success: true, found: !!sp };
    } catch (err: any) {
      console.error("[trackVisitSimple] error:", err?.message || err);
      return { success: false, error: err?.message || "unknown" };
    }
  },
);

// Module-level guard: exactly ONE PageView per route path per document
// session (survives StrictMode double-mount, resets on full page reload).
let lastPageViewPath: string | null = null;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useRouter().state.location;
  const isAdmin = location.pathname.startsWith("/admin");
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t");
    if (token) {
      try {
        localStorage.setItem("aq_tracking_token", token);
      } catch {
        /* storage unavailable */
      }
      try {
        document.cookie = `aq_t=${encodeURIComponent(token)}; expires=${new Date(Date.now() + 30 * 864e5).toUTCString()}; path=/; SameSite=Lax;`;
      } catch {
        /* cookie unavailable */
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.toString());
      // trackVisitSimple is defined at module level in this same file
      trackVisitSimple({
        data: { token, pageUrl: window.location.href, referrer: document.referrer || "" },
      })
        .then((r) => console.log("[track] ", r))
        .catch((e) => console.error("[track] ", e));
    }
  }, []);

  useEffect(() => {
    // The cart store skips hydration so the first client render matches the
    // server HTML; pull the saved basket in once React is mounted.
    void useCart.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Faster timeout for a responsive feel
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  // Single client-side PageView per route load (mount + pathname change only).
  // fbq.disablePushState stops Meta history hooks from auto-firing
  // PageView with ob3_plugin-set_ on SPA navigations. This effect is the
  // ONE browser PageView; sharedEventId is string-identical for browser + CAPI.
  useEffect(() => {
    if (lastPageViewPath === location.pathname) return;
    lastPageViewPath = location.pathname;
    const sharedEventId = String(generateEventId());
    const fireBrowserPageView = () => {
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq.disablePushState = true;
        window.fbq.allowDuplicatePageViews = true;
        window.fbq("set", "autoConfig", false, "1109711544904339");
        window.fbq("track", "PageView", {}, { eventID: sharedEventId });
      }
    };
    fireBrowserPageView();
    // UK GDPR: the server-side Meta PageView is advertising measurement, so it
    // is held back until ad_storage is granted.
    if (!hasAdConsent()) return;
    const tracking = getClientTrackingData();
    sendPageViewEvent({
      event_id: sharedEventId,
      page_url: window.location.href,
      external_id: tracking.external_id,
      fbp: tracking.fbp,
      fbc: tracking.fbc,
      client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
  }, [location.pathname]);

  // First-party analytics (separate from the Meta Pixel above — never touches it).
  // One PageView per SPA route change, tracked for the /admin/analytics dashboard.
  useEffect(() => {
    trackEvent("PageView", { path: window.location.pathname + window.location.search });
  }, [location.pathname, location.search]);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait">
        {showPreloader && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-[#F4F9FF] select-none pointer-events-none"
          >
            <div className="relative flex flex-col items-center gap-10">
              {/* Faster Animated Bed Drawing */}
              <div className="relative">
                <svg
                  width="140"
                  height="100"
                  viewBox="0 0 160 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="relative z-10"
                >
                  <motion.path
                    d="M30 80 H130 V100 H30 V80 Z"
                    stroke="#0B3C5D"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  <motion.path
                    d="M35 30 V80 M125 30 V80 M35 30 C35 25 40 20 45 20 H115 C120 20 125 25 125 30"
                    stroke="#0B3C5D"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
                  />
                  <motion.path
                    d="M45 70 H70 V80 H45 V70 Z M90 70 H115 V80 H90 V70 Z"
                    stroke="#0B3C5D"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeInOut", delay: 0.6 }}
                  />
                  <motion.path
                    d="M30 80 H130 V100 H30 V80 Z M35 30 V80 M125 30 V80 M35 30 C35 25 40 20 45 20 H115 C120 20 125 25 125 30"
                    fill="#0B3C5D"
                    initial={{ fillOpacity: 0 }}
                    animate={{ fillOpacity: 0.1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  />
                </svg>

                {/* Light soft Glow */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.4, scale: 1.2 }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="absolute inset-0 bg-white blur-3xl rounded-full"
                />
              </div>

              <div className="flex flex-col items-center gap-3 relative z-20">
                {/* Brand Logo & Name */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl font-display font-black text-[#0B3C5D] tracking-tighter">
                    AQ
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#0B3C5D]/40 mt-0.5 translate-x-[0.25em]">
                    Beds
                  </span>
                </motion.div>

                {/* Faster Shimmer Line */}
                <div className="w-16 h-[1px] bg-[#0B3C5D]/10 relative overflow-hidden rounded-full">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 0.2,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B3C5D]/30 to-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlobalEffects />
      <Toaster />
      <div
        className={`min-h-screen flex flex-col ${FLAGS.DISABLE_MOTION ? "framer-motion-disabled" : ""}`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>

        {!isAdmin && <Header />}

        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 ${!isAdmin ? "pb-20 sm:pb-0" : ""}`}
        >
          {/* J3 — visible breadcrumb + BreadcrumbList, derived from the path. */}
          <Breadcrumbs />
          <Outlet />
        </main>

        {!isAdmin && <Footer />}
      </div>
      {!isAdmin && (
        <>
          <Suspense fallback={null}>
            <CartDrawer />
          </Suspense>
          {!FLAGS.DISABLE_CHAT && (
            <Suspense fallback={null}>
              <LiveChatWidget />
            </Suspense>
          )}
          <MobileCartBar />
        </>
      )}
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </QueryClientProvider>
  );
}
