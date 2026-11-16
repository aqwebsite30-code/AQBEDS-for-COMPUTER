import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Truck } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/utils/format";
import { formatDeliveryDate, getDeliveryInfo, isDeliveryDay } from "@/lib/delivery-date";

type TrackResult = {
  success: true;
  reference?: string | null;
  status: string;
  createdAt: string;
  firstName: string;
  postcode: string;
  itemsCount: number;
  preferredDeliveryDate?: string | null;
};

type HistoryOrder = {
  reference: string | null;
  status: string;
  createdAt: string;
  itemsCount: number;
  itemNames: string[];
  total: number;
  preferredDeliveryDate?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Order confirmed",
  processing: "Being prepared",
  delivered: "Delivered",
  cancelled: "Order cancelled",
};

const HELP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi AQ Beds, I need help tracking my order.",
)}`;

export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Track My Order — AQ Beds" },
      {
        name: "description",
        content: "Enter your AQ Beds order tracking reference to see exactly where your bed is.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/track" }],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [reference, setReference] = useState(token);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  // Order history: email + postcode returns every order with its tracking code.
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [history, setHistory] = useState<HistoryOrder[] | null>(null);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    setReference(token);
    if (!token) {
      setResult(null);
      setNotFound(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setResult(null);
      setNotFound(false);
      setFailed(false);
      try {
        const res = await fetch(`/api/track?token=${encodeURIComponent(token)}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          setFailed(true);
          return;
        }
        const data = (await res.json()) as TrackResult;
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // The delivery date is derived here with the same engine the site uses, so the
  // API function never has to carry a second copy of the delivery policy.
  const estimatedDelivery = result
    ? formatDeliveryDate(
        result.preferredDeliveryDate && isDeliveryDay(result.preferredDeliveryDate)
          ? result.preferredDeliveryDate
          : getDeliveryInfo(new Date(result.createdAt)).defaultDate.iso,
      )
    : "";

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = reference.trim();
    navigate({ to: "/track", search: { token: next } });
  };

  const onSubmitHistory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mail = email.trim();
    const code = postcode.trim();
    if (!mail || !code) {
      setHistoryError("Enter the email and postcode you ordered with.");
      return;
    }
    setHistoryBusy(true);
    setHistoryError("");
    setHistory(null);
    try {
      const res = await fetch(
        `/api/track?email=${encodeURIComponent(mail)}&postcode=${encodeURIComponent(code)}`,
      );
      if (!res.ok) throw new Error("lookup failed");
      const data = (await res.json()) as { orders?: HistoryOrder[] };
      setHistory(data.orders ?? []);
    } catch {
      setHistoryError("We could not load your orders right now. Please try again.");
    } finally {
      setHistoryBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20 animate-fade-in">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/60 mb-3">
        Delivery updates
      </p>
      <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight">
        Track your order
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-lg">
        Enter the tracking link from your confirmation message — we will show exactly where your bed
        is.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <label
          htmlFor="tracking-reference"
          className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Order tracking reference
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="tracking-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="e.g. AQ-..."
            autoComplete="off"
            className="h-12 flex-1 rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-black text-brand-foreground transition-opacity hover:opacity-90"
          >
            Track my order
          </button>
        </div>
      </form>

      {loading ? (
        <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden="true" />
          Looking up your order
        </div>
      ) : null}

      {notFound ? (
        <div className="mt-10 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">
            We cannot find that order with those details.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Double-check your reference — or message us and we will find it in seconds.
          </p>
        </div>
      ) : null}

      {failed ? (
        <div className="mt-10 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">We cannot load that order right now.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Try again in a moment — or message us and we will check it for you.
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="mt-10 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold">
              {STATUS_LABELS[result.status] || "Order confirmed"}
            </h2>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Order number
              </dt>
              <dd className="mt-1 font-display text-base font-bold tracking-[0.08em]">
                {result.reference || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Order placed
              </dt>
              <dd className="mt-1">{new Date(result.createdAt).toLocaleDateString("en-GB")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Name
              </dt>
              <dd className="mt-1">{result.firstName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Postcode
              </dt>
              <dd className="mt-1">{result.postcode || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Items
              </dt>
              <dd className="mt-1">{result.itemsCount}</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/[0.06] p-4">
            <Truck className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Estimated delivery
              </p>
              <p className="mt-1 text-sm font-semibold">{estimatedDelivery}</p>
            </div>
          </div>

          {result.status === "delivered" ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Something wrong? You are covered — free next-day replacement if faulty.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10 rounded-3xl border border-brand/10 bg-brand/[0.03] p-6">
        <h2 className="font-display text-lg font-bold">See all your orders</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Use the email and postcode from your order and we will show every order with its tracking
          code.
        </p>
        <form onSubmit={onSubmitHistory} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:border-brand"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Postcode
              <input
                value={postcode}
                onChange={(event) => setPostcode(event.target.value.toUpperCase())}
                placeholder="LS1 4AB"
                autoComplete="postal-code"
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:border-brand"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={historyBusy}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-sm font-black text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {historyBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Show my orders
          </button>
        </form>

        {historyError ? <p className="mt-4 text-sm text-red-600">{historyError}</p> : null}

        {history && history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No orders found for that email and postcode. Check the postcode you used at checkout, or
            message us and we will find it.
          </p>
        ) : null}

        {history && history.length > 0 ? (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {history.map((order) => {
              const code = order.reference || "";
              return (
                <li key={code || order.createdAt}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/track", search: { token: code } })}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-brand/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-black tracking-[0.08em]">
                        {code || "—"}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")} · {order.itemsCount}{" "}
                        item{order.itemsCount === 1 ? "" : "s"}
                        {order.itemNames.length > 0 ? ` · ${order.itemNames.join(", ")}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand">
                        {STATUS_LABELS[order.status] || "Order confirmed"}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: "GBP",
                          maximumFractionDigits: 0,
                        }).format(order.total)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="mt-10 rounded-3xl border border-brand/10 bg-brand/[0.03] p-6">
        <p className="text-sm font-semibold">Placed an order but missing your link?</p>
        <a
          href={HELP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-whatsapp px-5 text-sm font-black text-whatsapp-foreground transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Message us on WhatsApp
        </a>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link to="/" className="font-semibold text-brand underline-offset-2 hover:underline">
          Back to homepage
        </Link>
      </p>
    </div>
  );
}
