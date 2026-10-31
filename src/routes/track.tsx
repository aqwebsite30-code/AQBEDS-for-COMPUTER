import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Truck } from "lucide-react";

export const Route = createFileRoute("/track")({
  validateSearch: (s) => ({ token: typeof s.token === "string" ? s.token : null }),
  component: TrackPage,
});

function TrackPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/track?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="mt-2 text-muted-foreground">The order could not be found.</p>
        </div>
      </div>
    );
  }

  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  const formatGBP = (n) => `£${n.toFixed(2)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="rounded-full bg-brand/10 px-4 py-2">
            <p className="text-sm font-medium text-brand capitalize">{order.status}</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Delivery Information</h2>
            <div className="space-y-3 rounded-2xl bg-brand/5 p-4">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-brand" />
                <div>
                  <p className="text-sm font-medium">Delivery Window</p>
                  <p className="text-sm text-muted-foreground">Arrive on {order.estimatedArrival || "TBD"}</p>
                </div>
              </div>
              {order.preferredDeliveryDate && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm font-medium">Preferred Date</p>
                  <p className="text-sm text-muted-foreground">Requested: {order.preferredDeliveryDate}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Customer Details</h2>
            <div className="space-y-3 rounded-2xl bg-muted/30 p-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Order Items</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-muted/30"></div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.qty} × {formatGBP(item.unitPrice)}
                  </p>
                </div>
                <div className="text-right font-medium">{formatGBP(item.unitPrice * item.qty)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">Total</p>
              <p className="text-sm text-muted-foreground">All prices include cash on delivery</p>
            </div>
            <div className="text-2xl font-bold text-brand">{formatGBP(order.total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}