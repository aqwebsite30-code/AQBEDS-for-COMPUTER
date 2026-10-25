// ─────────────────────────────────────────────────────────────────────────────
// T1 DELIVERY ENGINE — single source of truth for every delivery date shown
// on the site (product page, basket drawer, checkout, WhatsApp messages,
// order confirmation). Owner policy confirmed 24 Oct 2026:
//
//   RULE A — Mon–Sat before UK_CUTOFF_HOUR (20:00 UK) → delivered NEXT DAY.
//   RULE B — Mon–Sat after cutoff → treated as if placed the next day.
//   RULE C — Sunday orders → TUESDAY or THURSDAY (Monday is the off day).
//   RULE D — Non-delivery days: every Monday + the bank-holiday set below.
//            A computed date that lands on a non-delivery day slides forward.
//   RULE E — Customers may choose their own date (isSelectableDeliveryDate).
//
// All date/time maths runs in Europe/London — never the device timezone.
// ─────────────────────────────────────────────────────────────────────────────

/** 8 PM UK cutoff — single const so the owner can switch it to 19 in one place. */
export const UK_CUTOFF_HOUR = 20;

/** Shown under every date line, everywhere. */
export const DELIVERY_WINDOW_LINE = "📱 We'll text you a 2-hour delivery window";

/** Sunday orders land on one of these two days (Monday is the weekly off day). */
export const SUNDAY_OPTION = "Tue or Thu";

/**
 * Hardcoded UK bank holidays — UNION of England & Wales + Scotland +
 * Northern Ireland (every bank holiday observed by any of the three nations),
 * so no order can land on a bank holiday anywhere in the UK.
 *
 * ⚠️ YEAR ROLL FLAG: covers all of 2026 and all of 2027 only.
 * Extend this list before 1 Jan 2028 (Good Friday/Easter dates move each year).
 */
export const UK_BANK_HOLIDAYS: readonly string[] = [
  // ── 2026 ──
  "2026-01-01", // New Year's Day (Thu) — all nations
  "2026-01-02", // 2 Jan (Fri) — Scotland
  "2026-03-17", // St Patrick's Day (Tue) — Northern Ireland
  "2026-04-03", // Good Friday — all nations
  "2026-04-06", // Easter Monday — England & Wales, Northern Ireland
  "2026-05-04", // Early May bank holiday (Mon) — all nations
  "2026-05-25", // Spring bank holiday (Mon) — all nations
  "2026-07-13", // Battle of the Boyne observed (Mon 12 Jul is Sun) — Northern Ireland
  "2026-08-03", // Summer bank holiday (Mon) — Scotland
  "2026-08-31", // Summer bank holiday (Mon) — England & Wales, Northern Ireland
  "2026-12-25", // Christmas Day (Fri) — all nations
  "2026-12-28", // Boxing Day substitute (26 Sat → Mon) — all nations
  "2026-12-29", // St Stephen's Day substitute (27 Sun → Tue) — Northern Ireland
  // ── 2027 ──
  "2027-01-01", // New Year's Day (Fri) — all nations
  "2027-01-04", // 2 Jan substitute (2 Sat → Mon) — Scotland
  "2027-03-17", // St Patrick's Day (Wed) — Northern Ireland
  "2027-03-26", // Good Friday — all nations
  "2027-03-29", // Easter Monday — England & Wales, Northern Ireland
  "2027-05-03", // Early May bank holiday (Mon) — all nations
  "2027-05-31", // Spring bank holiday (Mon) — all nations
  "2027-07-12", // Battle of the Boyne (Mon) — Northern Ireland
  "2027-08-02", // Summer bank holiday (Mon) — Scotland
  "2027-08-30", // Summer bank holiday (Mon) — England & Wales, Northern Ireland
  "2027-12-27", // Christmas Day substitute (25 Sat → Mon) — all nations
  "2027-12-28", // St Stephen's Day substitute (26 Sun → Tue) — Northern Ireland
];

const HOLIDAYS = new Set<string>(UK_BANK_HOLIDAYS);

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export type LondonParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Wall-clock parts in Europe/London (DST-correct, never device timezone). */
export function londonParts(now: Date): LondonParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(now)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour,
    minute: out.minute,
    second: out.second,
  };
}

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isBankHoliday(dateISO: string): boolean {
  return HOLIDAYS.has(dateISO);
}

/**
 * Delivery days = every day except Monday and every UK bank holiday
 * (Tue–Sun deliver; Sun orders land Tue/Thu because Monday is off).
 */
export function isDeliveryDay(dateISO: string): boolean {
  return dayOfWeek(dateISO) !== 1 && !HOLIDAYS.has(dateISO);
}

/** First delivery day strictly after `dateISO` (slides past Mondays + holidays). */
export function nextDeliveryDay(dateISO: string): string {
  let d = dateISO;
  for (let i = 0; i < 60; i++) {
    d = addDays(d, 1);
    if (isDeliveryDay(d)) return d;
  }
  return d;
}

/** "Sun 25 Oct" — safe from timezone drift (UTC-based parse). */
export function formatDeliveryDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** RULE E — is this date selectable in the preferred-date picker? */
export function isSelectableDeliveryDate(dateISO: string, earliestISO?: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false;
  if (earliestISO && dateISO < earliestISO) return false;
  return isDeliveryDay(dateISO);
}

/** "8 PM" for 20:00, "7 PM" for 19:00 — human wording for the cutoff. */
function cutoffHourLabel(): string {
  const h24 = UK_CUTOFF_HOUR % 12 === 0 ? 12 : UK_CUTOFF_HOUR % 12;
  return `${h24} PM`;
}

function formatCountdown(totalSeconds: number, withSeconds: boolean): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (withSeconds) {
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export type DeliveryDate = { iso: string; label: string };

export type DeliveryInfo = {
  /** Time left until the 20:00 UK cutoff today, e.g. "2h 14m". */
  cutoffCountdown: string;
  /** Same countdown with seconds — for ticking displays (B1 drawer bar). */
  cutoffCountdownLive: string;
  /** Raw seconds until cutoff (≤ 0 once past). */
  remainingSeconds: number;
  /** Mon–Sat AND before 20:00 UK. */
  isBeforeCutoff: boolean;
  /** Today (UK) is Sunday. */
  isSunday: boolean;
  /** Earliest date this order can arrive — the T1 default delivery date. */
  defaultDate: DeliveryDate;
  /** "Tue or Thu" — shown for Sunday orders (RULE C). */
  sundayOption: string;
  /** Dynamic headline for the current UK weekday/time. */
  headline: string;
  /** Headline with a seconds-level countdown (live ticking version). */
  headlineLive: string;
  /** Stable headline without a countdown — safe for SSR/hydration. */
  headlineStatic: string;
  /** Standing note under every date line: "📱 We'll text you a 2-hour …". */
  windowLine: string;
};

/**
 * The one delivery function the whole site uses.
 * `nowUK` is any instant — all wall-clock maths happens in Europe/London.
 */
export function getDeliveryInfo(nowUK: Date): DeliveryInfo {
  const { year, month, day, hour, minute, second } = londonParts(nowUK);
  const today = iso(year, month, day);
  const dow = dayOfWeek(today);

  const remainingSeconds = UK_CUTOFF_HOUR * 3600 - (hour * 3600 + minute * 60 + second);
  const isSunday = dow === 0;
  const isBeforeCutoff = !isSunday && remainingSeconds > 0;

  // RULE A/B: an order placed Mon–Sat before the cutoff counts as today's order;
  // anything after the cutoff (and every Sunday) counts as the next calendar day.
  const effectiveOrderDate = isBeforeCutoff ? today : addDays(today, 1);
  const defaultISO = nextDeliveryDay(effectiveOrderDate);
  const defaultDate: DeliveryDate = { iso: defaultISO, label: formatDeliveryDate(defaultISO) };

  const countdown = formatCountdown(remainingSeconds, false);
  const countdownLive = formatCountdown(remainingSeconds, true);

  let headline: string;
  let headlineStatic: string;
  if (isSunday) {
    headline = "Sunday orders arrive Tuesday or Thursday — Monday is our off day";
    headlineStatic = headline;
  } else if (isBeforeCutoff) {
    headline = `⏱ Order within ${countdown} → delivered TOMORROW (${defaultDate.label})`;
    headlineStatic = `Order before ${cutoffHourLabel()} UK → delivered TOMORROW (${defaultDate.label})`;
  } else {
    headline = `Order tonight → arrives ${defaultDate.label}`;
    headlineStatic = headline;
  }
  const headlineLive =
    isSunday || !isBeforeCutoff
      ? headline
      : `⏱ Order within ${countdownLive} → delivered TOMORROW (${defaultDate.label})`;

  return {
    cutoffCountdown: countdown,
    cutoffCountdownLive: countdownLive,
    remainingSeconds,
    isBeforeCutoff,
    isSunday,
    defaultDate,
    sundayOption: SUNDAY_OPTION,
    headline,
    headlineLive,
    headlineStatic,
    windowLine: DELIVERY_WINDOW_LINE,
  };
}
