/**
 * Cookie consent + Google Consent Mode v2.
 *
 * UK GDPR: no analytics or advertising storage may be written, and no such tag
 * may load, until the visitor chooses. The defaults are pushed BEFORE the GTM
 * container loads (see the bootstrap script below, rendered ahead of gtm.js in
 * the document head), so a tag inside the container can never run against an
 * unknown state.
 *
 * One container only. To move the site to the other container id, change
 * GTM_ID here — never add a second gtm.js script to the page.
 */
export const GTM_ID = "GTM-K8P8CZL6";

/** localStorage key holding the visitor's choice: "accepted" | "rejected". */
export const CONSENT_KEY = "aq_cookie_consent";

/** Fired on window whenever the visitor accepts or rejects, so UI can react. */
export const CONSENT_EVENT = "aq-consent-change";

export type ConsentChoice = "accepted" | "rejected";

const GRANTED = {
  analytics_storage: "granted",
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
} as const;

const DENIED = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

/** Read the stored choice. null means the visitor has not decided yet. */
export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

/** True only when the visitor has actively accepted analytics + ads storage. */
export function hasAdConsent(): boolean {
  return getStoredConsent() === "accepted";
}

/**
 * Executed in the document head. Pushes the denied defaults, then loads the
 * container only if this visitor has already accepted. Nothing from Google or
 * Meta is requested before a choice — see the Phase B consent report.
 */
export const CONSENT_BOOTSTRAP = `(function(){
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  window.__aqLoadGtm = function(){
    if (window.__aqGtmLoaded) return;
    window.__aqGtmLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';
    document.head.appendChild(s);
  };
  var stored = null;
  try { stored = localStorage.getItem('${CONSENT_KEY}'); } catch (e) {}
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('js', new Date());
  if (stored === 'accepted') {
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
    gtag('set', 'ads_data_redaction', false);
    window.__aqLoadGtm();
  }
})();`;

/** Load the GTM container. Called on Accept — never before a choice. */
export function loadGtm() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __aqLoadGtm?: () => void };
  if (typeof w.__aqLoadGtm === "function") w.__aqLoadGtm();
}

/** Push a consent update into the same dataLayer the container is reading. */
export function updateConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  }
  w.gtag("consent", "update", granted ? GRANTED : DENIED);
  w.gtag("set", "ads_data_redaction", !granted);
}

/** Load the Meta Pixel — the loader itself refuses to run twice. */
export function loadMetaPixel() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __aqLoadPixel?: () => void };
  if (typeof w.__aqLoadPixel === "function") w.__aqLoadPixel();
}
