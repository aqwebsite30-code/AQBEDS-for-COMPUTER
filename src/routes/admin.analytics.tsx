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
  Users,
  Clock,
  Package,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { db } from "@/lib/db";
import { useState, useEffect } from "react";
import { verifyAuth, adminToken } from "@/lib/auth";

export const getAnalytics = createServerFn({ method: "GET" }).handler(
  async (opts?: { data?: { token?: string; days?: number } }) => {
    if (!(await verifyAuth(opts?.data?.token))) return null;
    const daysRaw = Number(opts?.data?.days);
    const days = [7, 30, 90, 365].includes(daysRaw) ? daysRaw : 30;
    const since = new Date(Date.now() - days * 864e5);
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
          date_trunc('day', "createdAt") AS day,
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

      const sessionsRaw = await db.$queryRaw<
        {
          sessionId: string;
          visitorId: string;
          firstSeen: Date;
          lastSeen: Date;
          eventCount: number;
          purchases: number;
          events: string[];
          path: string | null;
        }[]
      >`
        SELECT
          "sessionId",
          min("visitorId") AS "visitorId",
          min("createdAt") AS "firstSeen",
          max("createdAt") AS "lastSeen",
          count(*)::int AS eventCount,
          count(*) FILTER (WHERE event = 'Purchase')::int AS purchases,
          array_agg(DISTINCT event) AS events,
          min(path) AS path
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since}
        GROUP BY "sessionId"
        ORDER BY max("createdAt") DESC
        LIMIT 40
      `;

      const sessions = sessionsRaw.map((s) => ({
        sessionId: s.sessionId,
        visitorId: s.visitorId,
        firstSeen: new Date(s.firstSeen),
        lastSeen: new Date(s.lastSeen),
        eventCount: s.eventCount,
        purchases: s.purchases,
        events: Array.isArray(s.events) ? s.events : [],
        path: s.path,
      }));

      const products = productsRaw.map((p) => ({
        productId: p.productId,
        name: p.name || p.productId,
        views: p.views,
        adds: p.adds,
        conversion: p.views > 0 ? (p.adds / p.views) * 100 : 0,
      }));

      const pageviews = c.pageviews;
      const purchases = c.purchases;
      const revenue = Number(c.revenue) || 0;

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
        funnel: [
          { name: "Page View", value: pageviews },
          { name: "View Content", value: c.viewcontent },
          { name: "Add to Cart", value: c.addtocart },
          { name: "Checkout", value: c.checkout },
          { name: "Purchase", value: purchases },
        ],
        daily,
        products,
        sessions,
      };
    } catch (err: any) {
      console.error("getAnalytics error:", err?.message || err);
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

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];

function StatCard({ title, value, sub, Icon, color, bg, delay }: any) {
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

function FunnelBar({ name, value, max, delay }: any) {
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
        <span className="text-sm font-bold text-white">{value.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.1, duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
        />
      </div>
    </motion.div>
  );
}

const EVENT_STYLE: Record<string, string> = {
  PageView: "bg-blue-500/10 text-blue-300",
  ViewContent: "bg-indigo-500/10 text-indigo-300",
  AddToCart: "bg-amber-500/10 text-amber-300",
  InitiateCheckout: "bg-purple-500/10 text-purple-300",
  Purchase: "bg-emerald-500/10 text-emerald-300",
};

function fmtTime(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"products" | "sessions">("products");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAnalytics({ data: { token: adminToken(), days } })
      .then((res) => {
        if (alive) setData(res);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [days]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        {loading ? (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            <p className="text-gray-500 text-sm mt-4">Loading analytics…</p>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    );
  }

  const t = data.totals;
  const funnelMax = Math.max(...data.funnel.map((f: any) => f.value), 1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-wrap justify-between items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            On-site funnel — page views, carts, checkouts and purchases.
          </p>
        </div>
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
      </motion.div>

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
          title="Revenue"
          value={`£${Math.round(t.revenue).toLocaleString()}`}
          sub={
            t.purchases > 0
              ? `£${Math.round(t.revenue / t.purchases)} avg order`
              : "No purchases yet"
          }
          Icon={PoundSterling}
          color="text-amber-400"
          bg="bg-amber-500/10"
          delay={0.28}
        />
        <StatCard
          title="Conversion"
          value={`${t.conversion.toFixed(2)}%`}
          sub="Purchases per page view"
          Icon={Percent}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          delay={0.35}
        />
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
            {data.funnel.map((f: any, i: number) => (
              <FunnelBar
                key={f.name}
                name={f.name}
                value={f.value}
                max={funnelMax}
                delay={i * 0.08}
              />
            ))}
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
                    tickFormatter={(v: string) => v.slice(5)}
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

      {/* Products / Sessions toggle */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <button
            onClick={() => setTab("products")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === "products"
                ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
                : "text-gray-500 hover:text-gray-300 border border-transparent"
            }`}
          >
            <Package className="w-4 h-4" /> Top Products
          </button>
          <button
            onClick={() => setTab("sessions")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === "sessions"
                ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
                : "text-gray-500 hover:text-gray-300 border border-transparent"
            }`}
          >
            <Users className="w-4 h-4" /> Recent Sessions
          </button>
        </div>

        {tab === "products" ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={card}
          >
            {data.products.length === 0 ? (
              <div className="py-16 text-center text-gray-600 text-sm">
                No product activity yet — events appear here once visitors start viewing items.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[3fr_1fr_1fr_1fr] px-5 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/[0.04]">
                  <span>Product</span>
                  <span>Views</span>
                  <span>Adds</span>
                  <span>Conv.</span>
                </div>
                {data.products.map((p: any) => (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={card}
          >
            {data.sessions.length === 0 ? (
              <div className="py-16 text-center text-gray-600 text-sm">
                No sessions yet — activity trails show up here as people browse.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] px-5 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/[0.04]">
                  <span>Visitor</span>
                  <span>Activity</span>
                  <span>Events</span>
                  <span>Bought</span>
                  <span>Last seen</span>
                </div>
                {data.sessions.map((s: any) => (
                  <div
                    key={s.sessionId}
                    className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] items-center px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs text-gray-300 font-mono truncate">
                        {s.visitorId.slice(0, 8)}…
                      </p>
                      <p className="text-[10px] text-gray-600 truncate flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtTime(s.lastSeen)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 pr-3">
                      {s.events
                        .sort((a: string, b: string) =>
                          a === "Purchase" ? -1 : b === "Purchase" ? 1 : 0,
                        )
                        .map((ev: string) => (
                          <span
                            key={ev}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              EVENT_STYLE[ev] ?? "bg-gray-500/10 text-gray-300"
                            }`}
                          >
                            {ev}
                          </span>
                        ))}
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">{s.eventCount}</span>
                    <span>
                      {s.purchases > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] text-gray-500">
                          No
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">{fmtTime(s.lastSeen)}</span>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
