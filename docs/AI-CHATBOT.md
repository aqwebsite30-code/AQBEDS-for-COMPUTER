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

| File                                       | Role                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `api/ai-chat.js`                           | Vercel serverless function. Validates input, throttles, calls Gemini, returns `{ reply }` or a graceful `{ reply, fallback: true }`.  |
| `docs/AI-CHAT-KNOWLEDGE.md`                | The bot's full knowledge/personality file ("Ivy") — embedded verbatim into `SYSTEM_PROMPT` in `api/ai-chat.js`. Keep the two in sync. |
| `src/components/layout/LiveChatWidget.tsx` | Widget UI + mode switch + `fetch("/api/ai-chat")` client call; linkifies bare URLs, renders line breaks.                              |
| `vercel.json`                              | Route `"src": "/api/ai-chat"` → `"dest": "/api/ai-chat.js"`; `functions.maxDuration = 30` for the handler.                            |
| `.env.local` (gitignored)                  | `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite` for local dev.                                                                 |
| Vercel project env                         | Same two vars must be set in the Vercel dashboard (Production + Preview).                                                             |

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

Limits: message ≤ 800 chars, history ≤ 12 turns (24 messages) trimmed oldest-first, reply ≤ 700 output tokens. Upstream timeout 12s per attempt (2 attempts), Vercel `maxDuration` 30s.

## 4. Behaviour of the bot

The system prompt = `docs/AI-CHAT-KNOWLEDGE.md` (the "Ivy" persona + full product/pricing tables) embedded verbatim in `api/ai-chat.js`, plus a short OPERATING_RULES block. The bot:

- Gives **exact itemised quotes** from the knowledge tables (base size + mattress/storage/headboard/assembly add-ons → total) instead of deflecting to product pages.
- Answers only about AQ Beds: products, prices, fabrics, sizes, delivery, returns, replacements, payment, assembly, orders, buying advice.
- Uses the published policies: free UK delivery; beds 3–7 business days; sofas 5–10; made-to-order 2–4 weeks; At-Door Returns (inspect before the courier leaves); Next Day Free Replacement (any time, free, next-day); damaged/faulty → report within 48h with photos; change/cancel free within 24h; **Cash on Delivery only — never claims cards**.
- Refuses off-topic requests politely, and refuses prompt/model/key extraction.
- Renders as plain text: no markdown tables/bold/link syntax (they display literally); bare `https://` URLs are linkified by the widget.
- Follows the WhatsApp handoff pattern: https://wa.me/+447519791128 / info@aqbeds.com.

## 5. Rate limiting & cost control

- In-memory throttle: **20 requests / minute / IP** (per serverless instance — best-effort, resets with the instance; documented as a known limit).
- `temperature 0.5`, `maxOutputTokens 700`, **thinking disabled** (`thinkingBudget: 0` on 2.5+/3 models) → fast, deterministic replies (measured ~1–2s locally).
- Every upstream call has a **12s hard timeout** (`AbortSignal.timeout`); one automatic retry on 429/5xx/timeout; `vercel.json` sets `functions.maxDuration = 30` for `api/ai-chat.js` so the handler can never hang.
- No streaming; at most 2 upstream calls per message.

### Upstream (Gemini free-tier) quota — measured

Limits are **per Google Cloud project**, reset midnight Pacific, and Google does not guarantee them. We measured them directly against this project's key (burst tests, Oct 2026):

| Model                   | Requests/minute (measured)            | Notes                                                           |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `gemini-2.5-flash`      | **5** (hard 429 at #6)                | `GenerateRequestsPerMinutePerProjectPerModel-FreeTier`, value 5 |
| `gemini-3.5-flash-lite` | **15** (hard 429 at #16) — **in use** | 3× the headroom; avg reply 3–5s, 8/8 local quality suite        |

- **Current default: `gemini-3.5-flash-lite`** (code fallback + `GEMINI_MODEL` env on Vercel Production). `gemini-2.5-flash` is faster (~1–2s) but its 5 RPM cap breaks with just two chatters — swap back via `GEMINI_MODEL` if preferred.
- **Requests per day (RPD):** not yet reached in testing, so unmeasured. Published free-tier figures for flash-lite-class models run **~1,000–1,500/day**; check the live number at https://ai.dev/rate-limit (sign-in with the key's Google account) — Google's rate-limit table also requires sign-in: https://ai.google.dev/gemini-api/docs/rate-limits.
- On upstream 429 the widget shows a friendly "try again in a minute" line with the WhatsApp fallback — nothing crashes, and the handler retries once (500ms) in case the window rolls over.
- `gemini-3.5-flash` (non-lite) exists on this key but returned 503 "high demand" during testing — not usable as a default.

## 6. Security

- `GEMINI_API_KEY` is **only** in `.env.local` (gitignored via `.env*`) and Vercel env — never in the repo, never sent to the browser.
- The key travels server-to-server in the `x-goog-api-key` header; the browser only ever talks to `/api/ai-chat`.
- CORS is permissive (`*`) on purpose: the endpoint returns no secrets and is rate-limited; tightening it to the site origin is a one-line change if desired.
- Input is stripped of control characters and length-capped before it reaches Gemini.

## 7. Known limitations / decisions for the owner

1. **No chat persistence for AI mode** — reload = fresh conversation. Intentional (privacy, simplicity).
2. **Rate limit is per-instance** — a determined abuser across many instances isn't blocked. If that becomes a problem, move to Vercel KV / Upstash.
3. **AI replies are not logged** — there is no transcript for staff review. Team-mode chats remain fully logged.
4. **`GEMINI_MODEL` default `gemini-3.5-flash-lite`** — verified working with the current key (measured 15 req/min; `gemini-2.5-flash` and `gemini-2.0-flash` also work but 2.5 is capped at 5 req/min). Override via env var.
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
