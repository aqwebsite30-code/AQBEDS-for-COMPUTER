import { formatGBP } from "./utils/format";
import type { ArrivalWindow } from "./delivery-date";

export type CustomerDetails = {
  name: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
};

export type SelectionRow = { label: string; value: string };

export type OrderMessageItem = {
  name: string;
  qty: number;
  unitPrice: number;
  rows: SelectionRow[];
  url?: string;
};

export const ORDER_DETAILS_KEY = "aqbeds-order-details";

const EMPTY_DETAILS: CustomerDetails = {
  name: "",
  phone: "",
  address: "",
  city: "",
  postcode: "",
};

export function loadOrderDetails(): CustomerDetails {
  if (typeof window === "undefined") return { ...EMPTY_DETAILS };
  try {
    const raw = window.localStorage.getItem(ORDER_DETAILS_KEY);
    if (!raw) return { ...EMPTY_DETAILS };
    const parsed = JSON.parse(raw) as Partial<CustomerDetails>;
    return {
      name: String(parsed.name || ""),
      phone: String(parsed.phone || ""),
      address: String(parsed.address || ""),
      city: String(parsed.city || ""),
      postcode: String(parsed.postcode || ""),
    };
  } catch {
    return { ...EMPTY_DETAILS };
  }
}

export function saveOrderDetails(details: CustomerDetails): void {
  try {
    window.localStorage.setItem(ORDER_DETAILS_KEY, JSON.stringify(details));
  } catch {
    /* storage unavailable — prefills just won't persist */
  }
}

export const CUSTOMER_FIELDS: { key: keyof CustomerDetails; label: string; inputName: string }[] = [
  { key: "name", label: "Name", inputName: "name" },
  { key: "phone", label: "Phone", inputName: "phone" },
  { key: "address", label: "Full address", inputName: "addr1" },
  { key: "city", label: "City", inputName: "city" },
  { key: "postcode", label: "Postcode", inputName: "postcode" },
];

export function missingCustomerFields(
  details: Partial<CustomerDetails>,
): (keyof CustomerDetails)[] {
  return CUSTOMER_FIELDS.filter((f) => !String(details[f.key] || "").trim()).map((f) => f.key);
}

export function rowsFromOptionsRecord(record: Record<string, string>): SelectionRow[] {
  return Object.entries(record || {}).map(([label, value]) => ({
    label: label === "Color" ? "Colour" : label,
    value: String(value),
  }));
}

function weekdayShort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
}

export function arrivalLine(window: ArrivalWindow): string {
  const range = window.label.replace(/^Arrives:\s*/, "");
  return `Arrives: ${weekdayShort(window.firstISO)}–${weekdayShort(window.secondISO)} ${range}`;
}

const SEP = "——————————————";
const MESSAGE_CAP = 1800;

export function buildOrderMessage(
  items: OrderMessageItem[],
  customer: CustomerDetails,
  opts: { arrival?: ArrivalWindow | null; orderNo?: string; payment?: string } = {},
): string {
  const payment = opts.payment || "Cash on Delivery";
  const basketTotal = formatGBP(items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0));

  const assemble = (withUrls: boolean, rowCap: number): string => {
    const blocks = items.map((it) => {
      const rows = it.rows.slice(0, rowCap);
      const lines = [
        `${it.qty}× ${it.name}`,
        ...rows.map((r) => `${r.label}: ${r.value}`),
        `Qty: ${it.qty} · Total: ${formatGBP(it.unitPrice * it.qty)}`,
      ];
      if (withUrls && it.url) lines.push(`Url: ${it.url}`);
      return lines.join("\n");
    });

    const lines: string[] = [`NEW ORDER — aqbeds.com`];
    if (opts.orderNo) lines.push(`Order No: ${opts.orderNo}`);
    lines.push(SEP);
    lines.push(blocks.join("\n"));
    lines.push(`Basket total: ${basketTotal}`);
    lines.push(SEP);
    lines.push(`CUSTOMER`);
    lines.push(`Name: ${customer.name}`);
    lines.push(`Phone: ${customer.phone}`);
    lines.push(`Address: ${customer.address}`);
    lines.push(`City: ${customer.city}`);
    lines.push(`Postcode: ${customer.postcode}`);
    lines.push(SEP);
    if (opts.arrival) lines.push(arrivalLine(opts.arrival));
    lines.push(`Payment: ${payment}`);
    return lines.join("\n");
  };

  let message = assemble(true, Number.POSITIVE_INFINITY);
  if (message.length > MESSAGE_CAP) message = assemble(false, Number.POSITIVE_INFINITY);

  let rowCap = Math.max(...items.map((it) => it.rows.length), 0);
  while (message.length > MESSAGE_CAP && rowCap > 0) {
    rowCap -= 1;
    message = assemble(false, rowCap);
  }
  return message;
}
