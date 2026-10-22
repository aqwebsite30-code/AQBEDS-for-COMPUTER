// Unit test: api/meta-capi.js IP fallback (x-forwarded-for / x-real-ip).
// Mocks req/res + Graph API fetch; asserts the outgoing user_data.client_ip_address.
import { Readable } from "node:stream";

process.env.META_CAPI_ACCESS_TOKEN = "test-token";
process.env.META_PIXEL_ID = "1109711544904339";

const handler = (await import("../api/meta-capi.js")).default;

let lastBody = null;
const realFetch = global.fetch;
global.fetch = async (url, opts) => {
  lastBody = JSON.parse(opts.body);
  return { ok: true, status: 200, json: async () => ({ events_received: 1 }) };
};

function makeReq(payload, headers) {
  const req = Readable.from([Buffer.from(JSON.stringify(payload))]);
  req.method = "POST";
  req.headers = headers;
  return req;
}
function makeRes() {
  return {
    statusCode: 0,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end() {},
  };
}

const basePayload = { event_name: "AddToCart", event_time: 1, client_user_agent: "TestUA/1.0" };
const results = [];

// 1. Client-provided IP wins.
await handler(
  makeReq({ ...basePayload, client_ip_address: "203.0.113.50" }, { "x-forwarded-for": "1.1.1.1" }),
  makeRes(),
);
results.push(["client IP wins", lastBody.data[0].user_data.client_ip_address === "203.0.113.50"]);

// 2. Missing IP → first XFF entry (trimmed, before comma).
await handler(
  makeReq({ ...basePayload }, { "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" }),
  makeRes(),
);
results.push(["XFF first entry", lastBody.data[0].user_data.client_ip_address === "203.0.113.7"]);

// 3. Empty-string IP + no XFF → x-real-ip fallback.
await handler(
  makeReq({ ...basePayload, client_ip_address: "" }, { "x-real-ip": "198.51.100.9" }),
  makeRes(),
);
results.push([
  "x-real-ip fallback",
  lastBody.data[0].user_data.client_ip_address === "198.51.100.9",
]);

// 4. Nothing available → no IP field, event still sent.
await handler(makeReq({ ...basePayload }, {}), makeRes());
results.push([
  "no IP → omitted, still sent",
  lastBody.data[0].user_data.client_ip_address === undefined &&
    lastBody.data[0].event_name === "AddToCart",
]);

// 5. UA present + XFF present → both fields together (the "always send IP with UA" case).
await handler(makeReq({ ...basePayload }, { "x-forwarded-for": "  203.0.113.9  " }), makeRes());
results.push([
  "UA+XFF together",
  lastBody.data[0].user_data.client_ip_address === "203.0.113.9" &&
    lastBody.data[0].user_data.client_user_agent === "TestUA/1.0",
]);

global.fetch = realFetch;
let pass = 0;
for (const [name, ok] of results) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} passed`);
process.exit(pass === results.length ? 0 : 1);
