# Email setup (Resend)

Order mail runs through Resend (`src/lib/email/index.ts`). Two things must be
true for it to reach customers.

## 1. API key

`RESEND_API_KEY` is read from the environment. It is set in `.env` locally and
in Vercel for **Production** and **Preview**. Rotating it means updating all
three places, then redeploying.

## 2. A verified sending domain — currently outstanding

`from: AQ Beds <orders@aqbeds.com>`. Resend rejects that sender until
`aqbeds.com` is verified in the Resend account (`resend.com/domains`). Right now
the account has no verified domain, so:

- **Customer confirmation emails** fail and are logged with the order id. The
  order itself is still saved; nothing is lost.
- **Business alerts** still arrive, because the code retries them from
  `onboarding@resend.dev`, which Resend allows to reach the account owner's own
  inbox (`info@aqbeds.com`).

The API key in use is restricted to sending, so the domain cannot be created
from this project. To finish the job:

1. Open `resend.com/domains` → **Add domain** → `aqbeds.com`.
2. Add the DKIM, SPF and MX records Resend shows at the DNS provider that holds
   `aqbeds.com` (the domain's nameservers are not on Vercel, so this has to be
   the registrar/host panel).
3. Click **Verify**. Status turns `verified`, usually within minutes.
4. Nothing in the code needs changing — the next order email goes out from
   `orders@aqbeds.com`. `RESEND_FROM` can override the sender if needed.

## What a customer receives

- Subject: `Your AQ Beds order AQ-XXXXXX is confirmed`
- "Pay nothing today" note, due-on-delivery total, delivery address, and a
  **Track your order** button pointing at `/track?token=<reference>`.
