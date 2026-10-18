import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Eye,
  ShoppingCart,
  Wallet,
  PoundSterling,
  Percent,
  TrendingUp,
  Activity,
  Package,
  MessageCircle,
  Banknote,
  Layers,
  Radio,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { db } from "@/lib/db";
import { useState, useEffect } from "react";
import { verifyAuth, adminToken } from "@/lib/auth";

// --- Time helpers - all ranges and day grouping use Europe/London -----------

/** Real instant when the London wall clock last hit 00:00 (DST-aware). */
function londonDayStart(now: Date): Date {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(now)) p[part.type] = part.value;
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  const offset = wall - now.getTime();
  const wallMidnight = Date.UTC(+p.year, +p.month - 1, +p.day);
  return new Date(wallMidnight - offset);
}

/** Start instant for a range: 0 = All (epoch), 1 = Today, N = last N London days. */
function sinceForRange(days: number, now: Date): Date {
  if (days <= 0) return new Date(0);
  const start = londonDayStart(now);
  if (days === 1) return start;
  return new Date(start.getTime() - (days - 1) * 864e5);
}

const VALID_RANGES = [0, 1, 7, 30, 90];

/** Midnight (London) for a calendar date given as YYYY-MM-DD. DST-safe. */
function londonDayStartFor(iso: string): Date {
  // Noon UTC on a date is always that same calendar date in London, so
  // londonDayStart resolves to its 00:00 even across DST boundaries.
  const [y, m, d] = iso.split("-").map(Number);
  return londonDayStart(new Date(Date.UTC(y, m - 1, d, 12)));
}

/** Next calendar date (YYYY-MM-DD) - used as the exclusive day-window end. */
function nextIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** Today's calendar date in Europe/London (client-side; server compares too). */
function todayLondonISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

function parseItemsJson(raw: string | null): { name?: string; qty?: number; quantity?: number }[] {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Badge labels for the four WhatsApp order entry points.
const SOURCE_BADGE: Record<string, string> = {
  pdp: "WhatsApp-PDP",
  checkout: "WhatsApp-Checkout",
  drawer: "WhatsApp-Cart",
  cart: "WhatsApp-Cart",
};

export const getAnalytics = createServerFn({ method: "GET" }).handler(
  async (opts?: { data?: { token?: string; days?: number } }) => {
    if (!(await verifyAuth(opts?.data?.token))) return null;
    const daysRaw = Number(opts?.data?.days);
    const days = VALID_RANGES.includes(daysRaw) ? daysRaw : 1;
    const since = sinceForRange(days, new Date());
    try {
      // Counts are done in SQL so we never pull the whole table into memory.
      const counts = await db.$queryRaw<
        {
          pageviews: number;
          viewcontent: number;
          addtocart: number;
          checkout: number;
          purchases: number;
          revenue: number;
        }[]
      >`
        SELECT
          count(*) FILTER (WHERE event = 'PageView')::int            AS pageviews,
          count(*) FILTER (WHERE event = 'ViewContent')::int         AS viewcontent,
          count(*) FILTER (WHERE event = 'AddToCart')::int           AS addtocart,
          count(*) FILTER (WHERE event = 'InitiateCheckout')::int    AS checkout,
          count(*) FILTER (WHERE event = 'Purchase')::int            AS purchases,
          COALESCE(sum(value) FILTER (WHERE event = 'Purchase'), 0)::float AS revenue
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since}
      `;
      const c = counts[0] ?? {
        pageviews: 0,
        viewcontent: 0,
        addtocart: 0,
        checkout: 0,
        purchases: 0,
        revenue: 0,
      };

      // Daily buckets are London calendar days (not the DB server's timezone).
      const dailyRaw = await db.$queryRaw<
        {
          day: Date;
          pageviews: number;
          addtocart: number;
          checkout: number;
          purchases: number;
          revenue: number;
        }[]
      >`
        SELECT
          (timezone('Europe/London', "createdAt"))::date AS day,
          count(*) FILTER (WHERE event = 'PageView')::int         AS pageviews,
          count(*) FILTER (WHERE event = 'AddToCart')::int        AS addtocart,
          count(*) FILTER (WHERE event = 'InitiateCheckout')::int AS checkout,
          count(*) FILTER (WHERE event = 'Purchase')::int         AS purchases,
          COALESCE(sum(value) FILTER (WHERE event = 'Purchase'), 0)::float AS revenue
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1
      `;

      const daily = dailyRaw.map((d) => ({
        day: new Date(d.day).toISOString().slice(0, 10),
        pageviews: d.pageviews,
        addtocart: d.addtocart,
        checkout: d.checkout,
        purchases: d.purchases,
        revenue: Number(d.revenue) || 0,
      }));

      const productsRaw = await db.$queryRaw<
        { productId: string; name: string | null; views: number; adds: number }[]
      >`
        SELECT
          "productId",
          max("productName") AS name,
          count(*) FILTER (WHERE event = 'ViewContent')::int AS views,
          count(*) FILTER (WHERE event = 'AddToCart')::int   AS adds
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since} AND "productId" IS NOT NULL AND "productId" <> ''
        GROUP BY "productId"
        ORDER BY views DESC
        LIMIT 15
      `;

      const products = productsRaw.map((p) => ({
        productId: p.productId,
        name: p.name || p.productId,
        views: p.views,
        adds: p.adds,
        conversion: p.views > 0 ? (p.adds / p.views) * 100 : 0,
      }));

      // -- Sales split: website checkout (existing pipeline) vs WhatsApp ----
      const waAgg = await db.$queryRaw<{ cnt: number; sum: number }[]>`
        SELECT count(*)::int AS cnt, COALESCE(sum(value), 0)::float AS sum
        FROM "WhatsAppLead"
        WHERE "createdAt" >= ${since}
      `;
      const waC = waAgg[0] ?? { cnt: 0, sum: 0 };

      const waDailyRaw = await db.$queryRaw<{ day: Date; cnt: number; sum: number }[]>`
        SELECT
          (timezone('Europe/London', "createdAt"))::date AS day,
          count(*)::int AS cnt,
          COALESCE(sum(value), 0)::float AS sum
        FROM "WhatsAppLead"
        WHERE "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1
      `;

      const waLeadsRaw = await db.$queryRaw<
        {
          id: string;
          source: string;
          value: number | null;
          contents: string | null;
          customerName: string | null;
          customerCity: string | null;
          customerPostcode: string | null;
          status: string;
          createdAt: Date;
        }[]
      >`
        SELECT id, source, value, contents, "customerName", "customerCity",
               "customerPostcode", status, "createdAt"
        FROM "WhatsAppLead"
        WHERE "createdAt" >= ${since}
        ORDER BY "createdAt" DESC
        LIMIT 100
      `;

      const waLeads = waLeadsRaw.map((l) => ({
        id: l.id,
        ts: new Date(l.createdAt),
        source: l.source,
        badge: SOURCE_BADGE[l.source] || "WhatsApp",
        value: Number(l.value) || 0,
        items: parseItemsJson(l.contents).map((it) => ({
          name: it.name || "",
          qty: Number(it.quantity) || 0,
        })),
        customerName: l.customerName || "",
        customerCity: l.customerCity || "",
        customerPostcode: l.customerPostcode || "",
        status: l.status,
      }));

      const waDailyMap = new Map(
        waDailyRaw.map((r) => [
          new Date(r.day).toISOString().slice(0, 10),
          { cnt: r.cnt, sum: Number(r.sum) || 0 },
        ]),
      );
      const daySet = new Set<string>([...daily.map((d) => d.day), ...waDailyMap.keys()]);
      const salesDaily = Array.from(daySet)
        .sort()
        .map((day) => ({
          day,
          website: daily.find((d) => d.day === day)?.revenue ?? 0,
          whatsapp: waDailyMap.get(day)?.sum ?? 0,
        }));

      const pageviews = c.pageviews;
      const purchases = c.purchases;
      const revenue = Number(c.revenue) || 0;
      const waRevenue = Number(waC.sum) || 0;
      const waLeadsCount = waC.cnt;

      return {
        days,
        totals: {
          pageviews,
          viewcontent: c.viewcontent,
          addtocart: c.addtocart,
          initiateCheckout: c.checkout,
          purchases,
          revenue,
          conversion: pageviews > 0 ? (purchases / pageviews) * 100 : 0,
          checkoutRate: pageviews > 0 ? (c.checkout / pageviews) * 100 : 0,
          cartRate: pageviews > 0 ? (c.addtocart / pageviews) * 100 : 0,
        },
        sales: {
          website: { revenue, orders: purchases },
          whatsapp: {
            revenue: waRevenue,
            leads: waLeadsCount,
            new: waLeads.filter((l) => l.status === "new").length,
          },
          total: { revenue: revenue + waRevenue },
          daily: salesDaily,
          leads: waLeads,
        },
        // Conversion funnel (product spec): Product views -> Added to cart ->
        // Started checkout -> [Website purchase | WhatsApp order] -> Total orders.
        // Units stay honest - funnel steps are on-site events, order steps are
        // real orders (website purchases + WhatsApp leads). Reconciles with the
        // Sales cards and Live feed because all three read the same range.
        funnel: [
          { name: "Product views", value: c.viewcontent, unit: "events" as const },
          { name: "Added to cart", value: c.addtocart, unit: "events" as const },
          { name: "Started checkout", value: c.checkout, unit: "events" as const },
          { name: "Website purchase", value: purchases, unit: "orders" as const },
          { name: "WhatsApp order", value: waLeadsCount, unit: "orders" as const },
          { name: "Total orders", value: purchases + waLeadsCount, unit: "orders" as const },
        ],
        daily,
        products,
      };
    } catch (err) {
      console.error("getAnalytics error:", (err as Error)?.message || err);
      return null;
    }
  },
);

// --- WhatsApp lead status — manual New ? Confirmed / Lost toggle ------------

export const setLeadStatus = createServerFn({ method: "POST" }).handler(
  async (opts?: { data?: { token?: string; id?: string; status?: string } }) => {
    if (!(await verifyAuth(opts?.data?.token))) return null;
    const id = String(opts?.data?.id || "");
    const status = String(opts?.data?.status || "");
    if (!id || !["new", "confirmed", "lost"].includes(status)) return null;
    try {
      await db.whatsAppLead.update({ where: { id }, data: { status } });
      return { success: true, status };
    } catch {
      return null;
    }
  },
);

// --- Live feed - last 24h of website events + WhatsApp leads + orders -------

const LIVE_CHIP: Record<string, string> = {
  PageView: "pageview",
  AddToCart: "cart",
  InitiateCheckout: "checkout",
  Purchase: "purchase",
  OrderPlaced: "purchase",
};

export const getLiveFeed = createServerFn({ method: "GET" }).handler(
  async (opts?: { data?: { token?: string } }) => {
    if (!(await verifyAuth(opts?.data?.token))) return null;
    const now = new Date();
    const since24 = new Date(now.getTime() - 24 * 36e5);
    const todayStart = londonDayStart(now);
    try {
      const eventsRaw = await db.$queryRaw<
        {
          id: string;
          event: string;
          path: string | null;
          productName: string | null;
          value: number | null;
          visitorId: string | null;
          createdAt: Date;
        }[]
      >`
        SELECT id, event, path, "productName", value, "visitorId", "createdAt"
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since24}
          AND event IN ('PageView', 'AddToCart', 'InitiateCheckout', 'Purchase')
        ORDER BY "createdAt" DESC
        LIMIT 120
      `;

      const leadsRaw = await db.$queryRaw<
        {
          id: string;
          source: string;
          value: number | null;
          contents: string | null;
          customerCity: string | null;
          pageUrl: string | null;
          visitorId: string | null;
          createdAt: Date;
        }[]
      >`
        SELECT id, source, value, contents, "customerCity", "pageUrl", "visitorId", "createdAt"
        FROM "WhatsAppLead"
        WHERE "createdAt" >= ${since24}
        ORDER BY "createdAt" DESC
        LIMIT 100
      `;

      const ordersRaw = await db.$queryRaw<
        { id: string; total: number; items: string; visitorId: string | null; createdAt: Date }[]
      >`
        SELECT id, total, items, "visitorId", "createdAt"
        FROM "Order"
        WHERE "createdAt" >= ${since24}
        ORDER BY "createdAt" DESC
        LIMIT 60
      `;

      const rows: {
        id: string;
        ts: Date;
        type: string;
        chip: string;
        badge: string;
        value: number | null;
        summary: string;
        path: string | null;
        city: string | null;
        visitorId: string | null;
      }[] = [];

      for (const e of eventsRaw) {
        rows.push({
          id: `ae-${e.id}`,
          ts: new Date(e.createdAt),
          type: e.event,
          chip: LIVE_CHIP[e.event] || "other",
          badge: "Website",
          value: e.value != null ? Number(e.value) : null,
          summary: e.productName || "",
          path: e.path || "",
          city: null,
          visitorId: e.visitorId || null,
        });
      }

      for (const l of leadsRaw) {
        let path = "";
        try {
          path = l.pageUrl ? new URL(l.pageUrl).pathname : "";
        } catch {
          path = "";
        }
        rows.push({
          id: `wl-${l.id}`,
          ts: new Date(l.createdAt),
          type: "Purchase",
          chip: "purchase",
          badge: SOURCE_BADGE[l.source] || "WhatsApp",
          value: l.value != null ? Number(l.value) : null,
          summary: parseItemsJson(l.contents)
            .map((it) => `${Number(it.quantity) || 0}× ${it.name || "item"}`)
            .join(", "),
          path,
          city: l.customerCity || null,
          visitorId: l.visitorId || null,
        });
      }

      for (const o of ordersRaw) {
        rows.push({
          id: `ord-${o.id}`,
          ts: new Date(o.createdAt),
          type: "OrderPlaced",
          chip: "purchase",
          badge: "Website",
          value: Number(o.total) || 0,
          summary: parseItemsJson(o.items)
            .map((it) => `${Number(it.qty) || 0}× ${it.name || "item"}`)
            .join(", "),
          path: null,
          city: null,
          visitorId: o.visitorId || null,
        });
      }

      rows.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

      // Header totals - today, Europe/London, by type.
      const todayRaw = await db.$queryRaw<
        {
          pageview: number;
          addtocart: number;
          initiatecheckout: number;
          purchase: number;
        }[]
      >`
        SELECT
          count(*) FILTER (WHERE event = 'PageView')::int         AS pageview,
          count(*) FILTER (WHERE event = 'AddToCart')::int        AS addtocart,
          count(*) FILTER (WHERE event = 'InitiateCheckout')::int AS initiatecheckout,
          count(*) FILTER (WHERE event = 'Purchase')::int         AS purchase
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${todayStart}
      `;
      const t = todayRaw[0] ?? { pageview: 0, addtocart: 0, initiatecheckout: 0, purchase: 0 };

      const todayWa = await db.$queryRaw<{ cnt: number }[]>`
        SELECT count(*)::int AS cnt FROM "WhatsAppLead" WHERE "createdAt" >= ${todayStart}
      `;
      const todayOrders = await db.$queryRaw<{ cnt: number }[]>`
        SELECT count(*)::int AS cnt FROM "Order" WHERE "createdAt" >= ${todayStart}
      `;

      return {
        rows: rows.slice(0, 150),
        today: {
          pageview: t.pageview,
          addtocart: t.addtocart,
          initiateCheckout: t.initiatecheckout,
          purchase: t.purchase,
          whatsapp: todayWa[0]?.cnt ?? 0,
          ordersPlaced: todayOrders[0]?.cnt ?? 0,
        },
      };
    } catch (err) {
      console.error("getLiveFeed error:", (err as Error)?.message || err);
      return null;
    }
  },
);

// --- Day View - one calendar day's full stored activity ---------------------

export const getDayView = createServerFn({ method: "GET" }).handler(
  async (opts?: { data?: { token?: string; date?: string } }) => {
    if (!(await verifyAuth(opts?.data?.token))) return null;
    const date = String(opts?.data?.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const start = londonDayStartFor(date);
    const end = londonDayStartFor(nextIsoDate(date));
    try {
      const eventsRaw = await db.$queryRaw<
        {
          id: string;
          event: string;
          path: string | null;
          productName: string | null;
          value: number | null;
          visitorId: string | null;
          createdAt: Date;
        }[]
      >`
        SELECT id, event, path, "productName", value, "visitorId", "createdAt"
        FROM "AnalyticsEvent"
        WHERE ("date" = ${date} OR ("date" IS NULL AND "createdAt" >= ${start} AND "createdAt" < ${end}))
          AND event IN ('PageView', 'AddToCart', 'InitiateCheckout', 'Purchase')
        ORDER BY "createdAt" DESC
        LIMIT 5000
      `;

      const leadsRaw = await db.$queryRaw<
        {
          id: string;
          source: string;
          value: number | null;
          contents: string | null;
          customerCity: string | null;
          pageUrl: string | null;
          visitorId: string | null;
          createdAt: Date;
        }[]
      >`
        SELECT id, source, value, contents, "customerCity", "pageUrl", "visitorId", "createdAt"
        FROM "WhatsAppLead"
        WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
        ORDER BY "createdAt" DESC
        LIMIT 1000
      `;

      const evAgg = await db.$queryRaw<
        {
          pageview: number;
          addtocart: number;
          checkouts: number;
          orders: number;
          revenue: number;
        }[]
      >`
        SELECT
          count(*) FILTER (WHERE event = 'PageView')::int         AS pageview,
          count(*) FILTER (WHERE event = 'AddToCart')::int        AS addtocart,
          count(*) FILTER (WHERE event = 'InitiateCheckout')::int AS checkouts,
          count(*) FILTER (WHERE event = 'Purchase')::int         AS orders,
          COALESCE(sum(value) FILTER (WHERE event = 'Purchase'), 0)::float AS revenue
        FROM "AnalyticsEvent"
        WHERE ("date" = ${date} OR ("date" IS NULL AND "createdAt" >= ${start} AND "createdAt" < ${end}))
          AND event IN ('PageView', 'AddToCart', 'InitiateCheckout', 'Purchase')
      `;
      const waAgg = await db.$queryRaw<{ cnt: number; revenue: number }[]>`
        SELECT count(*)::int AS cnt,
               COALESCE(sum(value), 0)::float AS revenue
        FROM "WhatsAppLead"
        WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      `;

      const rows: LiveRow[] = [];
      for (const e of eventsRaw) {
        rows.push({
          id: `ae-${e.id}`,
          ts: new Date(e.createdAt),
          type: e.event,
          chip: LIVE_CHIP[e.event] || "other",
          badge: "Website",
          value: e.value != null ? Number(e.value) : null,
          summary: e.productName || "",
          path: e.path || "",
          city: null,
          visitorId: e.visitorId || null,
        });
      }
      for (const l of leadsRaw) {
        let path = "";
        try {
          path = l.pageUrl ? new URL(l.pageUrl).pathname : "";
        } catch {
          path = "";
        }
        rows.push({
          id: `wl-${l.id}`,
          ts: new Date(l.createdAt),
          type: "WhatsAppOrder",
          chip: "purchase",
          badge: SOURCE_BADGE[l.source] || "WhatsApp",
          value: l.value != null ? Number(l.value) : null,
          summary: parseItemsJson(l.contents)
            .map((it) => `${Number(it.quantity) || 0}× ${it.name || "item"}`)
            .join(", "),
          path,
          city: l.customerCity || null,
          visitorId: l.visitorId || null,
        });
      }
      rows.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

      const ev = evAgg[0] ?? { pageview: 0, addtocart: 0, checkouts: 0, orders: 0, revenue: 0 };
      const wa = waAgg[0] ?? { cnt: 0, revenue: 0 };
      return {
        date,
        isToday: date === todayLondonISO(),
        rows,
        summary: {
          pageviews: ev.pageview,
          addtocart: ev.addtocart,
          checkouts: ev.checkouts,
          websiteOrders: ev.orders,
          whatsappOrders: wa.cnt,
          revenue: Number(ev.revenue || 0) + Number(wa.revenue || 0),
        },
      };
    } catch (err) {
      console.error("getDayView error:", (err as Error)?.message || err);
      return null;
    }
  },
);

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const card = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
};

// TanStack types GET server-fns as taking `undefined` in this version, but the
// handler still receives the `{ data }` envelope at runtime. This helper keeps
// call sites fully typed while passing the real envelope the handler reads.
const withData = <T,>(data: T): undefined => ({ data }) as unknown as undefined;

const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 0, label: "All" },
];

type StatCardProps = {
  title: string;
  value: string | number;
  sub?: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  delay: number;
};

type FunnelBarProps = {
  name: string;
  value: number;
  max: number;
  delay: number;
  unit: "events" | "orders";
  pctAbove: number | null;
  pctBase: number | null;
  accent?: boolean;
};

type StatusPillsProps = {
  id: string;
  status: string;
  busy: boolean;
  onSet: (id: string, status: string) => void;
};

type LiveRow = {
  id: string;
  ts: Date | string;
  type: string;
  chip: string;
  badge: string;
  value: number | null;
  summary: string;
  path: string | null;
  city: string | null;
  visitorId: string | null;
};

type LiveToday = {
  pageview: number;
  addtocart: number;
  initiateCheckout: number;
  purchase: number;
  whatsapp: number;
  ordersPlaced: number;
};

type LiveFeed = { rows: LiveRow[]; today: LiveToday };

type DaySummary = {
  pageviews: number;
  addtocart: number;
  checkouts: number;
  websiteOrders: number;
  whatsappOrders: number;
  revenue: number;
};

type DayViewData = {
  date: string;
  isToday: boolean;
  rows: LiveRow[];
  summary: DaySummary;
};

type LeadRow = {
  id: string;
  ts: Date | string;
  source: string;
  badge: string;
  value: number;
  items: { name: string; qty: number }[];
  customerName: string;
  customerCity: string;
  customerPostcode: string;
  status: string;
};

type AnalyticsData = {
  days: number;
  totals: {
    pageviews: number;
    viewcontent: number;
    addtocart: number;
    initiateCheckout: number;
    purchases: number;
    revenue: number;
    conversion: number;
    checkoutRate: number;
    cartRate: number;
  };
  sales: {
    website: { revenue: number; orders: number };
    whatsapp: { revenue: number; leads: number; new: number };
    total: { revenue: number };
    daily: { day: string; website: number; whatsapp: number }[];
    leads: LeadRow[];
  };
  funnel: { name: string; value: number; unit: "events" | "orders" }[];
  daily: {
    day: string;
    pageviews: number;
    addtocart: number;
    checkout: number;
    purchases: number;
    revenue: number;
  }[];
  products: { productId: string; name: string; views: number; adds: number; conversion: number }[];
};

function StatCard({ title, value, sub, Icon, color, bg, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={card}
    >
      <div
        className={`absolute -top-8 -right-8 w-32 h-32 ${bg} rounded-full blur-2xl opacity-60`}
      />
      <div className="relative">
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${bg} mb-5`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-500 mt-1.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function FunnelBar({ name, value, max, delay, unit, pctAbove, pctBase, accent }: FunnelBarProps) {
  const pct = max > 0 ? Math.max((value / max) * 100, 0.5) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-1.5"
    >
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-gray-400 font-medium">{name}</span>
        <span className="text-sm font-bold text-white">
          {value.toLocaleString()}{" "}
          <span className="text-[10px] text-gray-500 font-medium">{unit}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.1, duration: 0.7, ease: "easeOut" }}
          className={
            accent
              ? "h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              : "h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
          }
        />
      </div>
      {(pctAbove != null || pctBase != null) && (
        <div className="flex flex-wrap gap-x-3 text-[10px] text-gray-500">
          {pctAbove != null && <span>{pctAbove}% of step above</span>}
          {pctBase != null && <span>{pctBase}% of step 1</span>}
        </div>
      )}
    </motion.div>
  );
}

const EVENT_STYLE: Record<string, string> = {
  PageView: "bg-blue-500/10 text-blue-300",
  ViewContent: "bg-indigo-500/10 text-indigo-300",
  AddToCart: "bg-amber-500/10 text-amber-300",
  InitiateCheckout: "bg-purple-500/10 text-purple-300",
  Purchase: "bg-emerald-500/10 text-emerald-300",
  OrderPlaced: "bg-cyan-500/10 text-cyan-300",
  WhatsAppOrder: "bg-teal-500/10 text-teal-300",
};

const TYPE_LABEL: Record<string, string> = {
  PageView: "Page view",
  AddToCart: "Add to cart",
  InitiateCheckout: "Initiate checkout",
  Purchase: "Purchase",
  OrderPlaced: "Order placed",
};

// Day View labels - exactly the five event types the brief lists.
const DAY_TYPE_LABEL: Record<string, string> = {
  PageView: "PageView",
  AddToCart: "AddToCart",
  InitiateCheckout: "Checkout",
  Purchase: "Website Purchase",
  WhatsAppOrder: "WhatsApp Order",
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-sky-500/15 text-sky-300" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/15 text-emerald-300" },
  lost: { label: "Lost", cls: "bg-red-500/15 text-red-300" },
};

function badgeClass(badge: string): string {
  return badge === "Website"
    ? "bg-sky-500/10 text-sky-300 border border-sky-500/20"
    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Axis label for a YYYY-MM-DD bucket: "2026-10-17" -> "17 Oct". */
function dayTick(v: string): string {
  const [, m, d] = v.split("-");
  const dd = Number(d);
  const mm = MONTH_SHORT[Number(m) - 1];
  return mm ? `${dd} ${mm}` : v;
}

/** Chart/row timestamp - 12-hour clock in Europe/London, e.g. "3:42 PM". */
function fmtClock(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London",
  });
}

/** Visitor ID shortened to its stable first 8 chars (full value on hover). */
function shortId(id?: string | null): string {
  return id ? id.slice(0, 8) : "";
}

/** Human day label for the picker: "2026-10-17" -> "17 Oct 2026". */
function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-");
  const mm = MONTH_SHORT[Number(m) - 1];
  return mm ? `${Number(d)} ${mm} ${y}` : iso;
}

function StatusPills({ status, onSet, busy, id }: StatusPillsProps) {
  return (
    <div className="flex gap-1">
      {["new", "confirmed", "lost"].map((key) => (
        <button
          key={key}
          type="button"
          disabled={busy}
          onClick={() => onSet(id, key)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all disabled:opacity-50 ${
            status === key
              ? STATUS_STYLES[key].cls
              : "bg-white/[0.04] text-gray-500 hover:text-gray-300"
          }`}
        >
          {STATUS_STYLES[key].label}
        </button>
      ))}
    </div>
  );
}

// --- Live Events view (Analytics ? Live) ------------------------------------

const LIVE_CHIPS = [
  { key: "all", label: "All" },
  { key: "purchase", label: "Purchases" },
  { key: "cart", label: "Add to cart" },
  { key: "checkout", label: "Checkout" },
  { key: "pageview", label: "Page views" },
];

function LiveEvents() {
  const [feed, setFeed] = useState<LiveFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [chip, setChip] = useState("all");

  useEffect(() => {
    const refresh = setInterval(() => setTick((t) => t + 1), 15000);
    const clockId = setInterval(() => setClock(Date.now()), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(clockId);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getLiveFeed(withData({ token: adminToken() }))
      .then((res) => {
        if (!alive) return;
        if (res) {
          setFeed(res);
          setUpdatedAt(Date.now());
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const rows: LiveRow[] = feed?.rows ?? [];
  const visible = chip === "all" ? rows : rows.filter((r) => r.chip === chip);
  const today = feed?.today ?? {
    pageview: 0,
    addtocart: 0,
    initiateCheckout: 0,
    purchase: 0,
    whatsapp: 0,
    ordersPlaced: 0,
  };
  const age = updatedAt != null ? Math.max(0, Math.round((clock - updatedAt) / 1000)) : null;

  return (
    <div className="space-y-5">
      {/* Today's totals header (Europe/London) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl p-5"
        style={card}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" /> Today (Europe/London)
          </h2>
          <p className="text-[11px] text-gray-500">
            {age != null ? `Updated ${age}s ago` : loading ? "Loading..." : "Waiting..."}
            {!loading && (
              <button
                type="button"
                onClick={() => setTick((t) => t + 1)}
                className="ml-3 text-blue-400 hover:text-blue-300 font-semibold"
              >
                Refresh now
              </button>
            )}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Page views", value: today.pageview },
            { label: "Add to cart", value: today.addtocart },
            { label: "Checkouts", value: today.initiateCheckout },
            { label: "Purchases", value: today.purchase },
            { label: "WhatsApp", value: today.whatsapp },
            { label: "Orders placed", value: today.ordersPlaced },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3"
            >
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1">
        {LIVE_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setChip(c.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              chip === c.key
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        {loading && rows.length === 0 ? (
          <div className="py-20 text-center text-gray-600 text-sm">Loading live feed...</div>
        ) : visible.length === 0 ? (
          <div className="py-20 text-center text-gray-600 text-sm">
            {chip === "all" ? "No activity today" : "No activity today"}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[90px_110px_140px_2fr_1.2fr_90px_100px_80px] gap-2 px-5 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/[0.04]">
              <span>Time</span>
              <span>Type</span>
              <span>Source</span>
              <span>Summary</span>
              <span>Path</span>
              <span>Visitor</span>
              <span>City</span>
              <span className="text-right">Value</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {visible.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[90px_110px_140px_2fr_1.2fr_90px_100px_80px] gap-2 items-center px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[11px] text-gray-500 font-mono">{fmtClock(r.ts)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${
                      EVENT_STYLE[r.type] ?? "bg-gray-500/10 text-gray-300"
                    }`}
                  >
                    {TYPE_LABEL[r.type] || r.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${badgeClass(r.badge)}`}
                  >
                    {r.badge}
                  </span>
                  <span className="text-xs text-gray-300 truncate pr-2">{r.summary || "-"}</span>
                  <span className="text-[11px] text-gray-500 font-mono truncate">
                    {r.path || "-"}
                  </span>
                  <span
                    className="text-[11px] text-gray-500 font-mono truncate"
                    title={r.visitorId || undefined}
                  >
                    {shortId(r.visitorId) || "-"}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate">{r.city || "-"}</span>
                  <span className="text-xs text-gray-200 font-semibold text-right">
                    {r.value != null ? `£${Math.round(r.value).toLocaleString()}` : "-"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Day View - pick one calendar date, see everything that happened -------

function DayView() {
  const [picked, setPicked] = useState(() => todayLondonISO());
  const [feed, setFeed] = useState<DayViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [chip, setChip] = useState("all");

  const isToday = picked === todayLondonISO();

  // Auto-refresh ONLY while the picked date is today (brief requirement).
  useEffect(() => {
    if (!isToday) return;
    const refresher = setInterval(() => setTick((n) => n + 1), 15_000);
    const ticker = setInterval(() => setClock(Date.now()), 1_000);
    return () => {
      clearInterval(refresher);
      clearInterval(ticker);
    };
  }, [isToday]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    setFeed((f) => (f && f.date === picked ? f : null));
    getDayView(withData({ token: adminToken(), date: picked }))
      .then((res) => {
        if (!alive) return;
        if (res) {
          setFeed(res);
          setUpdatedAt(Date.now());
        } else {
          setError(true);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [picked, tick]);

  const s = feed?.summary;
  const rows = (feed?.rows ?? []).filter((r) => chip === "all" || r.chip === chip);
  const age = updatedAt != null ? Math.max(0, Math.round((clock - updatedAt) / 1000)) : null;
  const displayDate = dayLabel(picked);

  const summaryChips: { label: string; value: string | number }[] = s
    ? [
        { label: "Page views", value: s.pageviews },
        { label: "Add to carts", value: s.addtocart },
        { label: "Checkouts", value: s.checkouts },
        { label: "Website orders", value: s.websiteOrders },
        { label: "WhatsApp orders", value: s.whatsappOrders },
        { label: "Revenue", value: `£${Math.round(s.revenue).toLocaleString()}` },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Date picker + freshness */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label
            htmlFor="day-view-date"
            className="text-[10px] text-gray-500 uppercase tracking-widest font-bold"
          >
            Date
          </label>
          <input
            id="day-view-date"
            type="date"
            value={picked}
            max={todayLondonISO()}
            onChange={(e) => {
              const v = e.target.value;
              if (v) setPicked(v);
            }}
            style={{ colorScheme: "dark" }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/40"
          />
          <span className="text-xs text-gray-400 font-semibold">{displayDate}</span>
        </div>
        <p className="text-[11px] text-gray-500">
          {isToday ? (
            <>
              {age != null ? `Updated ${age}s ago` : loading ? "Loading..." : "Waiting..."}
              {!loading && (
                <button
                  type="button"
                  onClick={() => setTick((n) => n + 1)}
                  className="ml-3 text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Refresh now
                </button>
              )}
            </>
          ) : (
            <span className="text-gray-600">Static snapshot - past date</span>
          )}
        </p>
      </div>

      {/* Day summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(loading && !s ? [] : summaryChips).map((c) => (
          <div key={c.label} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</p>
            <p className="text-xl font-bold text-white mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter chips - same keys as Live */}
      <div className="flex flex-wrap gap-1">
        {LIVE_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setChip(c.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              chip === c.key
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Activity table - identical 8-column format to Live (Time/Type/Source/Summary/Path/Visitor/City/Value). */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        {error ? (
          <div className="py-20 text-center text-red-400/80 text-sm">
            Could not load {displayDate} - try again.
          </div>
        ) : loading && !feed ? (
          <div className="py-20 text-center text-gray-600 text-sm">Loading day...</div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-gray-600 text-sm">
            No activity on {displayDate}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[90px_110px_140px_2fr_1.2fr_90px_100px_80px] gap-2 px-5 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/[0.04]">
              <span>Time</span>
              <span>Type</span>
              <span>Source</span>
              <span>Summary</span>
              <span>Path</span>
              <span>Visitor</span>
              <span>City</span>
              <span className="text-right">Value</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[90px_110px_140px_2fr_1.2fr_90px_100px_80px] gap-2 items-center px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[11px] text-gray-500 font-mono">{fmtClock(r.ts)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${
                      EVENT_STYLE[r.type] ?? "bg-gray-500/10 text-gray-300"
                    }`}
                  >
                    {DAY_TYPE_LABEL[r.type] || r.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${badgeClass(r.badge)}`}
                  >
                    {r.badge}
                  </span>
                  <span className="text-xs text-gray-300 truncate pr-2">{r.summary || "-"}</span>
                  <span className="text-[11px] text-gray-500 font-mono truncate">
                    {r.path || "-"}
                  </span>
                  <span
                    className="text-[11px] text-gray-500 font-mono truncate"
                    title={r.visitorId || undefined}
                  >
                    {shortId(r.visitorId) || "-"}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate">{r.city || "-"}</span>
                  <span className="text-xs text-gray-200 font-semibold text-right">
                    {r.value != null ? `£${Math.round(r.value).toLocaleString()}` : "-"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// --- Main analytics page -----------------------------------------------------

function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(1);

  const [view, setView] = useState<"overview" | "live" | "day">("overview");
  const [leadBusy, setLeadBusy] = useState<string | null>(null);

  useEffect(() => {
    if (view !== "overview") return;
    let alive = true;
    setLoading(true);
    getAnalytics(withData({ token: adminToken(), days }))
      .then((res) => {
        if (alive) setData(res);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [days, view]);

  const handleLeadStatus = async (id: string, status: string) => {
    setLeadBusy(id);
    try {
      const res = await setLeadStatus(withData({ token: adminToken(), id, status }));
      if (res?.success && data?.sales?.leads) {
        setData({
          ...data,
          sales: {
            ...data.sales,
            leads: data.sales.leads.map((l) => (l.id === id ? { ...l, status } : l)),
          },
        });
      }
    } finally {
      setLeadBusy(null);
    }
  };

  const header = (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap justify-between items-center gap-4"
    >
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {view === "day"
            ? "One calendar day - every stored event, order and lead for the picked date."
            : view === "live"
              ? "Live event stream - the last 24 hours, auto-refreshing."
              : "On-site funnel and sales - website checkout vs WhatsApp orders."}
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        {view === "overview" && (
          <div className="flex gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  days === r.days
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "live", label: "Live" },
              { key: "day", label: "Day View" },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                view === v.key
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {v.key === "live" && <Radio className="w-3 h-3" />}
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  if (view === "live") {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {header}
        <LiveEvents />
      </div>
    );
  }

  if (view === "day") {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {header}
        <DayView />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {header}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            <p className="text-gray-500 text-sm mt-4">Loading analytics...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
            <div className="p-4 bg-red-500/10 rounded-2xl mb-4 text-red-500">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Analytics Error</h2>
            </div>
            <p className="text-gray-400 max-w-md">
              We couldn't load analytics data. Please check the database connection.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all"
            >
              Try Refreshing
            </button>
          </div>
        )}
      </div>
    );
  }

  const t = data.totals;
  const s = data.sales;
  const funnelMax = Math.max(...data.funnel.map((f) => f.value), 1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {header}

      {loading && <div className="h-0.5 w-full bg-blue-500/40 rounded-full animate-pulse" />}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Page Views"
          value={t.pageviews.toLocaleString()}
          sub={`${data.daily.length} day${data.daily.length === 1 ? "" : "s"} of data`}
          Icon={Eye}
          color="text-blue-400"
          bg="bg-blue-500/10"
          delay={0}
        />
        <StatCard
          title="Add to Cart"
          value={t.addtocart.toLocaleString()}
          sub={`${t.cartRate.toFixed(1)}% of page views`}
          Icon={ShoppingCart}
          color="text-amber-400"
          bg="bg-amber-500/10"
          delay={0.07}
        />
        <StatCard
          title="Initiate Checkout"
          value={t.initiateCheckout.toLocaleString()}
          sub={`${t.checkoutRate.toFixed(1)}% of page views`}
          Icon={Wallet}
          color="text-purple-400"
          bg="bg-purple-500/10"
          delay={0.14}
        />
        <StatCard
          title="Purchases"
          value={t.purchases.toLocaleString()}
          sub={`${t.conversion.toFixed(2)}% conversion`}
          Icon={Package}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          delay={0.21}
        />
        <StatCard
          title="Website Revenue"
          value={`£${Math.round(t.revenue).toLocaleString()}`}
          sub={
            t.purchases > 0
              ? `£${Math.round(t.revenue / t.purchases)} avg order`
              : "No website purchases yet"
          }
          Icon={PoundSterling}
          color="text-amber-400"
          bg="bg-amber-500/10"
          delay={0.28}
        />
        <StatCard
          title="Conversion"
          value={`${t.conversion.toFixed(2)}%`}
          sub="Website purchases per page view"
          Icon={Percent}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          delay={0.35}
        />
      </div>

      {/* -- Sales split: website checkout vs WhatsApp -------------------- */}
      <div className="space-y-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Banknote className="w-4 h-4 text-amber-400" /> Sales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Website Checkout"
            value={`£${Math.round(s.website.revenue).toLocaleString()}`}
            sub={`${s.website.orders} order${s.website.orders === 1 ? "" : "s"}  - checkout flow`}
            Icon={PoundSterling}
            color="text-sky-400"
            bg="bg-sky-500/10"
            delay={0}
          />
          <StatCard
            title="WhatsApp Orders"
            value={`£${Math.round(s.whatsapp.revenue).toLocaleString()}`}
            sub={`${s.whatsapp.leads} lead${s.whatsapp.leads === 1 ? "" : "s"} · ${s.whatsapp.new} new`}
            Icon={MessageCircle}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
            delay={0.07}
          />
          <StatCard
            title="Total Sales"
            value={`£${Math.round(s.total.revenue).toLocaleString()}`}
            sub="Both channels combined"
            Icon={Layers}
            color="text-amber-400"
            bg="bg-amber-500/10"
            delay={0.14}
          />
        </div>

        {/* Stacked daily breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="rounded-2xl p-6"
          style={card}
        >
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Daily Sales by Source
          </h2>
          <div className="h-[240px]">
            {s.daily.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                No sales in this range yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.daily} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    tickFormatter={dayTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#9ca3af" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                  <Bar dataKey="website" name="Website Checkout" stackId="sales" fill="#38bdf8" />
                  <Bar
                    dataKey="whatsapp"
                    name="WhatsApp"
                    stackId="sales"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Breakdown - mirrors the two Sales cards above, always visible. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pb-4 text-xs">
            <span className="text-gray-400">
              Website Checkout:{" "}
              <span className="text-sky-300 font-bold">
                {s.website.orders} order{s.website.orders === 1 ? "" : "s"}
              </span>
              {" \u00b7 "}
              <span className="text-white font-bold">
                £{Math.round(s.website.revenue).toLocaleString()}
              </span>
            </span>
            <span className="text-gray-700 font-bold">|</span>
            <span className="text-gray-400">
              WhatsApp:{" "}
              <span className="text-emerald-300 font-bold">
                {s.whatsapp.leads} order{s.whatsapp.leads === 1 ? "" : "s"}
              </span>
              {" \u00b7 "}
              <span className="text-white font-bold">
                £{Math.round(s.whatsapp.revenue).toLocaleString()}
              </span>
            </span>
          </div>
        </motion.div>

        {/* WhatsApp order leads */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={card}
        >
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">WhatsApp Orders</h2>
          </div>
          {s.leads.length === 0 ? (
            <div className="py-14 text-center text-gray-600 text-sm">
              No WhatsApp orders in this range yet - leads appear the moment a customer opens a
              WhatsApp order.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[90px_140px_80px_2fr_2fr_150px] gap-2 px-5 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/[0.04]">
                <span>Time</span>
                <span>Source</span>
                <span className="text-right">Value</span>
                <span>Products</span>
                <span>Customer</span>
                <span>Status</span>
              </div>
              {s.leads.map((l) => (
                <div
                  key={l.id}
                  className="grid grid-cols-[90px_140px_80px_2fr_2fr_150px] gap-2 items-center px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[11px] text-gray-500 font-mono">{fmtClock(l.ts)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${badgeClass(l.badge)}`}
                  >
                    {l.badge}
                  </span>
                  <span className="text-xs text-gray-200 font-semibold text-right">
                    £{Math.round(l.value).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-300 truncate pr-2">
                    {l.items.map((it) => `${it.qty}× ${it.name || "item"}`).join(", ") || "-"}
                  </span>
                  <span className="text-xs text-gray-300 truncate pr-2">
                    {l.customerName || "-"}
                    {l.customerCity || l.customerPostcode
                      ? ` · ${[l.customerCity, l.customerPostcode].filter(Boolean).join(" ")}`
                      : ""}
                  </span>
                  <StatusPills
                    status={l.status}
                    onSet={handleLeadStatus}
                    busy={leadBusy === l.id}
                    id={l.id}
                  />
                </div>
              ))}
            </>
          )}
        </motion.div>
      </div>

      {/* Funnel + trend */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl p-6"
          style={card}
        >
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Conversion Funnel
          </h2>
          <div className="space-y-4">
            {data.funnel.map((f, i) => {
              const base = data.funnel[0]?.value ?? 0;
              const above =
                i === 0
                  ? 0
                  : i >= 3
                    ? (data.funnel[2]?.value ?? 0)
                    : (data.funnel[i - 1]?.value ?? 0);
              const pctAbove = i > 0 && above > 0 ? Math.round((f.value / above) * 100) : null;
              const pctBase = i > 0 && base > 0 ? Math.round((f.value / base) * 100) : null;
              return (
                <FunnelBar
                  key={f.name}
                  name={f.name}
                  value={f.value}
                  max={funnelMax}
                  delay={i * 0.08}
                  unit={f.unit}
                  pctAbove={pctAbove}
                  pctBase={pctBase}
                  accent={i >= 3}
                />
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.4 }}
          className="rounded-2xl p-6"
          style={card}
        >
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Daily Trend
          </h2>
          <div className="h-[260px]">
            {data.daily.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                No events in this range yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    tickFormatter={dayTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#9ca3af" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    name="Page Views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#pv)"
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    name="Purchases"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#pr)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top products */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={card}
        >
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Top Products</h2>
          </div>
          {data.products.length === 0 ? (
            <div className="py-16 text-center text-gray-600 text-sm">
              No product activity yet - events appear here once visitors start viewing items.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr] px-5 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/[0.04]">
                <span>Product</span>
                <span>Views</span>
                <span>Adds</span>
                <span>Conv.</span>
              </div>
              {data.products.map((p) => (
                <div
                  key={p.productId}
                  className="grid grid-cols-[3fr_1fr_1fr_1fr] items-center px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm text-white font-semibold truncate pr-3">{p.name}</span>
                  <span className="text-sm text-gray-300 font-semibold">{p.views}</span>
                  <span className="text-sm text-gray-300 font-semibold">{p.adds}</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {p.conversion.toFixed(1)}%
                  </span>
                </div>
              ))}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
