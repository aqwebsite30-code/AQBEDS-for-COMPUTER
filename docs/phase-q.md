# Phase Q — Authority and earned links

40+ real UK prospects, a link log to run them through, and a policy that keeps
the profile clean. Companion file: `docs/phase-q-prospects.csv` (the working
list, one row per prospect).

## What this is and is not

- **Is:** a contact list of real UK publications, trade bodies, charities and
  bloggers, each with a reason they might cover a bed retailer and a specific
  angle to pitch. Every domain was checked live while writing this; the HTTP
  status is recorded in the CSV (`verified 200`, or `403` for sites that block
  bots but serve readers).
- **Is not:** 40 links. Most of these will say no, some will never reply, and a
  consumer title like Elle Decoration may never link to a small Bradford
  retailer. The realistic outcome of working this list properly for 90 days is
  **10–15 earned links**, which is the target in the brief — and hitting it means
  winning roughly one pitch in three from the tier-1 and tier-2 rows, not
  blasting all 50.
- **Contact details are not invented.** The CSV gives the domain only. Contact
  addresses must be read from each site's own contact or contribute page on the
  day of the pitch; guessing an editor's email is how pitches get ignored.

## Policy (non-negotiable)

1. **No paid links.** No sponsored posts, no "guest post packages", no
   link-insertion services. The long lists of "home decor guest posting sites"
   that dominate search results are exactly the paid network this policy
   excludes — useful only as a list of what to avoid.
2. **No PBNs, no link exchanges at scale, no directory blasts.** One listing per
   genuine platform (e.g. Houzz) is a profile, not a campaign.
3. **No link-for-product deals.** A product sample is not payment. Samples only
   go where a title's own testing programme requires one, with no promise of
   coverage and no link condition. Every gifted item is logged.
4. **Disclosure.** Any coverage arising from a sample is disclosed by the
   publisher; we never ask for the disclosure to be dropped.
5. **Nofollow is fine.** A mention in Ideal Home that nofollows is worth more
   than a followed link on a site nobody reads.
6. **Nothing invented in a pitch.** No customer numbers, no review counts, no
   "since 2018" unless it is true and documented. Phase L removed the claims that
   could not be proved; they must not reappear in outreach.

## Tiering

| Tier | What it is | Rows | Realistic links in 90 days |
|---|---|---|---|
| 1 | Regional press and business media (`yorkshirepost.co.uk`, `thetelegraphandargus.co.uk`, `thebusinessdesk.com`, local weeklies) | 13 | 4–6 |
| 2 | Consumer interiors and homes titles (`idealhome.co.uk`, `realhomes.com`, `housebeautiful.com`, `livingetc.com`, `periodliving.co.uk`, …) | 15 | 2–4 |
| 3 | Blogs, trade bodies, charities (`madaboutthehouse.com`, `thesleepcharity.org.uk`, `bedfed.org.uk`, `frn.org.uk`) | 15 | 3–5 |
| 4 | Journalist request services and business press (`responsesource.com`, `smallbusiness.co.uk`, `startups.co.uk`) | 8 | 1–2 |

Trade bodies and design institutes (NBF, FIRA, BIID, SBID) are marked
**membership**, not editorial. A membership link is legitimate and useful for
trust, but it is not a campaign and it costs money — decide separately.

## The four campaigns

**Q1 — Regional business story (weeks 1–4).** One real story for the Yorkshire
press: an independent Bradford retailer selling beds with cash on delivery, with
real order data behind it (26 orders, 17 WhatsApp leads — use the numbers that
exist, never rounded up). Pitch to the Telegraph & Argus first, then The Business
Desk, then Yorkshire Post business. One story, three angles, not three
fabricated stories.

**Q2 — Expert contribution (weeks 3–8).** The angles that get quoted rather than
written: minimum bedroom dimensions for a king bed plus circulation (e-architect,
Homebuilding), gas-lift ottoman safety and mattress weight limits (Ideal Home,
Real Homes), mattress replacement cycle and base support (Sleep Council, The
Sleep Charity). Register with ResponseSource and Press Plugs and answer requests
within the hour.

**Q3 — Local and community (weeks 5–10).** Old mattress disposal and reuse with
the Furniture Reuse Network and Recycle Now; a West Yorkshire angle on what
happens to a mattress after delivery. This is the most defensible link a bed
retailer can earn, because nobody else is writing it.

**Q4 — Blogger sourcing (weeks 6–12).** Four UK interiors bloggers with real
readerships (Mad About The House, Decorator's Notebook, Melanie Lissack,
Grillo Designs). Pitch a sourcing question they can answer with a link —
"upholstered beds under £400" — not a guest post. Expect two replies from four.

## Link log

Every attempt goes in `docs/phase-q-link-log.csv` (create on first send) with:

```
date_first_contact,prospect,domain,tier,angle,campaign,contact_used,status,date_published,url,link_type,notes
```

Rules: one row per prospect per campaign; status is one of `sent`, `followed-up`,
`declined`, `published`, `no-reply`. A published row carries the live URL and
whether the link is followed or nofollowed. The count reported in the monthly
review comes from this file, never from memory.

## 90-day plan

| Weeks | Work | Expected |
|---|---|---|
| 1–2 | Write the regional story, build the press list from the CSV, verify contacts on each site | 0 links |
| 3–4 | Send tier 1 (13 pitches), register on ResponseSource + Press Plugs | 1–2 links |
| 5–6 | Tier 2 pitches (10), expert quotes, follow up tier 1 | 3–5 cumulative |
| 7–8 | Tier 3 (blogs, charity, reuse), second regional angle | 6–9 cumulative |
| 9–10 | Tier 4 business press, follow-ups, publish the mattress-disposal piece | 8–12 cumulative |
| 11–12 | One more consumer pitch round; audit every link against the policy | 10–15 cumulative |

## Reviews — the Trustpilot decision

**Recommendation: do not open a Trustpilot profile yet.** Reasons, in order:

1. Trustpilot's value depends on replying to every review. The brief's condition
   is explicit — Trustpilot only if reviews will be answered. Replying within 48
   hours requires a rota that does not exist yet for one person also packing
   orders.
2. An unclaimed or unmanaged profile with a handful of reviews reads worse than
   no profile. Trustpilot also shows a "no reviews" or low-volume state that
   damages trust more than it builds it.
3. Invitations must go to real buyers. There are 26 orders in the database; the
   41 reviews in `data/reviews.json` are site content, not Trustpilot-eligible
   verified purchases.

**If the owner decides to open one**, the conditions are: invite only real
customers by order email, reply to every review within 48 hours (including the
4★), never dispute a genuine bad review on technicalities, and never offer an
incentive for a review. Until those four are true, the answer is no.

## What to measure

- Links earned (count, by tier) — target 10–15 in 90 days.
- Referring domains (not links) — target 8–12 new.
- Replies per 10 pitches — a healthy rate is 2–4; below 1 means the angle is wrong,
  not that more pitches are needed.
- Traffic from earned links — a mention that sends nobody is still worth having
  for trust, but it should not be reported as traffic.
