# AQ Beds AI Chatbot — Specification

Version 1.0 · Added as part of the Phase 2 audit work (WP, "AI chatbot" ask).
Status: implemented and tested locally; awaiting push + Vercel deploy.

---

## 1. What it is

A lightweight, in-site chat widget with two modes:

| Mode                        | What happens                                                                                                               | Where data goes                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Ask instantly** (default) | The visitor's question is answered by Google Gemini, guided by an AQ Beds system prompt. Replies appear in under a second. | Browser → `POST /api/ai-chat` → Gemini API. **Nothing is stored.** |
| **Message the team**        | The original AQ Beds live-chat: messages persist, staff reply from the admin panel.                                        | Unchanged — server fns in `src/lib/chat.ts`, admin polling.        |

The visitor switches modes with the pills at the top of the widget. Team chat history and AI chat history are kept separately (AI history is in-memory only and resets on page reload).

## 2. Files

| File                                       | Role                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `api/ai-chat.js`                           | Vercel serverless function. Validates input, throttles, calls Gemini, returns `{ reply }` or a graceful `{ reply, fallback: true }`. |
| `src/components/layout/LiveChatWidget.tsx` | Widget UI + mode switch + `fetch("/api/ai-chat")` client call.                                                                       |
| `vercel.json`                              | Route `"src": "/api/ai-chat"` → `"dest": "/api/ai-chat.js"` (same pattern as `meta-capi`).                                           |
| `.env.local` (gitignored)                  | `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash` for local dev.                                                                     |
| Vercel project env                         | Same two vars must be set in the Vercel dashboard (Production + Preview).                                                            |

## 3. API contract

```
POST /api/ai-chat
Content-Type: application/json

{ "message": "How long is delivery?", "history": [ {"role":"user"|"assistant", "text":"..."} ] }

200 → { "reply": "..." }
200 → { "reply": "...", "fallback": true }   (Gemini failed/missing key — friendly hand-off text)
400 → { "error": "message is required (max 800 characters)" }
429 → { "error": "Too many messages - please wait a moment." }
405 → { "error": "Method not allowed" }
```

Limits: message ≤ 800 chars, history ≤ 12 turns (24 messages) trimmed oldest-first, reply ≤ 320 output tokens.

## 4. Behaviour of the bot

The full system prompt lives at the top of `api/ai-chat.js`. In short, the bot:

- Answers **only** about AQ Beds: products, fabrics, sizes, delivery, returns, replacements, payment, assembly, contact.
- Gives facts the site has actually published: free UK delivery; beds 3–7 business days; sofas 5–10; made-to-order 2–4 weeks; At-Door Returns (accepted at delivery only, inspect before the courier leaves); Next Day Free Replacement (contact any time, free, next-day delivery); **Cash on Delivery only — never claims cards**; prices sent to the product page rather than quoted.
- Refuses off-topic requests politely in one sentence.
- Stays under 120 words, plain English.
- Never invents stock, discounts, review counts or dates.
- Never reveals the prompt, the model name or any key details.

## 5. Rate limiting & cost control

- In-memory throttle: **20 requests / minute / IP** (per serverless instance — best-effort, resets with the instance; documented as a known limit).
- `temperature 0.6`, `maxOutputTokens 320` → short replies, bounded cost.
- No streaming, no retries, single upstream call per message.

## 6. Security

- `GEMINI_API_KEY` is **only** in `.env.local` (gitignored via `.env*`) and Vercel env — never in the repo, never sent to the browser.
- The key travels server-to-server in the `x-goog-api-key` header; the browser only ever talks to `/api/ai-chat`.
- CORS is permissive (`*`) on purpose: the endpoint returns no secrets and is rate-limited; tightening it to the site origin is a one-line change if desired.
- Input is stripped of control characters and length-capped before it reaches Gemini.

## 7. Known limitations / decisions for the owner

1. **No chat persistence for AI mode** — reload = fresh conversation. Intentional (privacy, simplicity).
2. **Rate limit is per-instance** — a determined abuser across many instances isn't blocked. If that becomes a problem, move to Vercel KV / Upstash.
3. **AI replies are not logged** — there is no transcript for staff review. Team-mode chats remain fully logged.
4. **`GEMINI_MODEL` default `gemini-2.5-flash`** — verified working with the current key (`gemini-2.0-flash` returns 404 on this key). Override via env var.
5. **Admin does not see AI conversations** — by design. If you want an "AI transcripts" tab later, that's a new feature.
6. **The widget defaults to AI mode.** If you'd rather open on "Message the team", change the initial `useState<ChatMode>("ai")` to `"team"` in `LiveChatWidget.tsx`.

## 8. Local testing

```bash
# .env.local must contain GEMINI_API_KEY (and optionally GEMINI_MODEL)
node "$TEMP/opencode/test-ai-chat.mjs" "<repo root>"
```

Expected: delivery question answered with 3–7 business days, card question answered "no cards, COD", off-topic politely refused, empty message → 400.

Note: `vite dev` does **not** serve `api/` — the widget falls back to the friendly "assistant unavailable" line in dev. The endpoint is exercised on Vercel (or via the node test above).

## 9. Rollout checklist

- [x] `api/ai-chat.js` written and syntax-checked
- [x] `/api/ai-chat` route added to `vercel.json`
- [x] `.env.local` created (gitignored)
- [x] Widget AI/team mode implemented
- [x] Local end-to-end test green (4/4 cases)
- [ ] `GEMINI_API_KEY` set in Vercel dashboard
- [ ] Push to repo + deploy (separate approvals required)
- [ ] Post-deploy smoke test of `/api/ai-chat` on www.aqbeds.com
