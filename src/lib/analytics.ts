// AQ Beds first-party analytics beacon.
//
// IMPORTANT: This is completely separate from the Meta Pixel / CAPI pipeline
// (`meta-pixel.ts`, `meta-capi.ts`, `/api/meta-capi`). It only mirrors funnel
// events into our own database for the /admin/analytics dashboard. It never
// touches, replaces, or interferes with Meta events — every call is fire-and-
// forget and swallows its own errors so a failure here can never affect Meta.

const SESSION_KEY = "aqbeds_sid";
const ENDPOINT = "/api/analytics";

export type AnalyticsEventName =
  "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

export interface AnalyticsEventData {
  path?: string;
  referrer?: string;
  productId?: string;
  productName?: string;
  value?: number;
  currency?: string;
}

/** Stable visitor ID — reuses the same `aqbeds_vid` UUID the pixel uses. */
function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let vid = localStorage.getItem("aqbeds_vid");
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem("aqbeds_vid", vid);
    }
    return vid;
  } catch {
    return "";
  }
}

/** Per-tab session ID, kept in sessionStorage so it resets when the tab closes. */
export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

function getDevice(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  return "desktop";
}

/**
 * Fire a first-party analytics event. Safe to call anywhere, including next to
 * Meta pixel calls — it is fully independent and never throws.
 */
export function trackEvent(event: AnalyticsEventName, data: AnalyticsEventData = {}): void {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      event,
      visitorId: getVisitorId(),
      sessionId: getAnalyticsSessionId(),
      path: data.path ?? window.location.pathname + window.location.search,
      referrer: data.referrer ?? (document.referrer || ""),
      productId: data.productId ?? "",
      productName: data.productName ?? "",
      value: typeof data.value === "number" && isFinite(data.value) ? data.value : null,
      currency: data.currency ?? "GBP",
      device: getDevice(),
    };
    const body = JSON.stringify(payload);
    // sendBeacon keeps working during unload; fetch(keepalive) is the fallback.
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* analytics must never break the page */
  }
}
