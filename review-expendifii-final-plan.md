# Review by Expendifii — Final Plan

**Sameer / Expendifii**
Frontend: Next.js 16 App Router (Turbopack), React 19, TanStack Query, Tailwind v4, Nivo, qrcode
Backend: separate service at `NEXT_PUBLIC_API_URL`
Status: **fully built and deployed. Zero customers.**

---

# PART 0 — WHAT CHANGED IN THIS PLAN

Earlier versions of this document assumed you had a prototype. You do not. You have a complete three-portal SaaS in production: admin panel with onboarding wizard, hardware inventory, plan tiers, poster generator, business dashboard with plan-gated Nivo analytics, and a public customer flow.

That changes the advice in one important way. The earlier plan said "do not build the admin panel, dashboard or analytics yet." That instruction is now void — they exist, they work, and you should **leave them alone**. Do not rebuild, do not polish, do not extend.

What actually remains is much smaller than it looked:

| Area | Status | Action |
|---|---|---|
| Admin panel, hardware, plans | Built | Leave alone |
| Poster generator | Built | Leave alone |
| Business dashboard + analytics | Built | Leave alone, feed it new data later |
| Three-portal auth | Built | One security fix (below) |
| Analytics event model | Built | Extend with two event types |
| **`/r/[code]` customer flow** | **Built the wrong way** | **Rebuild. This is the only real work.** |
| Review suggestion pool (admin + business screens) | Built | Repurpose into Menu management |
| Landing page copy | Built, risky | Strip, day 1 |
| Payments | Not built | Correct. Leave until 10 paying customers. |

**One screen to rebuild, one screen to repurpose, one page to edit.** That is the whole scope.

---

# PART 1 — THE DECISIONS

### The product

A feedback tool for small F&B and local services. Customer scans a QR at the table, answers three quick questions, gets a short draft assembled from their own answers, edits it if they want, posts to Google.

### What is being dropped

The pre-written review suggestion pool, and everything that serves it: the customer picking a card, the admin bulk JSON upload, the per-business unused/reserved/used counters, and the business-side pool management screen.

Google's Maps policy requires a review to reflect the poster's own experience. Third-party text fails that whether a human or an AI wrote it, and Google now acts against the tools as well as the businesses using them. You have zero customers, so this costs you nothing today. In six months with forty cafes on it, it would cost you the business.

### Pricing

**₹500 setup, first month included. ₹299/month after. UPI mandate set up on day one.**

Asking for autopay 30 days later is a second sale you will lose. Set it at signup.

- Customers 1–3: free setup. You need proof more than ₹1,500.
- The ₹499 tier already exists in your Plans model. Do not sell it until the menu-item data exists to fill it.
- Annual ₹2,999 offered at day 30, never at signup.

### Never build

- A Google button that only appears above 4 stars. That is review gating, explicitly against policy, and Google targets the tools that do it.
- An LLM writing the review text. Straight back into prohibited content.
- Anything on the admin or dashboard side until you have paying customers asking for it.

### Sequence

| Stage | Start when | Time |
|---|---|---|
| **1. Security fix + copy strip + flow rebuild** | Now | **8–10 days** |
| 2. First 10 customers, manual ops | Flow shipped | 6–10 weeks |
| 3. Razorpay autopay + dunning | 10 paying customers | 2 weeks |
| 4. WhatsApp automation | 20 customers | 2 wks + 3 wks approvals |
| 5. Menu-item analytics into existing dashboard | 20 customers, 3 months data | 1–2 weeks |

Stage 5 is short precisely because the dashboard, the plan gating and the chart components already exist. You are adding data sources, not building a dashboard.

### Your sales line

Local businesses give 5–10% off for reviews. That is ₹80 on a ₹800 bill, per review, and an explicit Google violation that gets listings flagged.

> "You're paying ₹80 a review and risking your listing. This is ₹299 a month and it's inside Google's rules."

---

# PART 2 — THE 8–10 DAYS

**Day 1** — Security fix and copy strip. Half a day.
**Days 2–7** — Rebuild `/r/[code]`. Repurpose Reviews → Menu.
**Day 8** — Seed a demo business through the existing onboarding wizard. Print 5 posters with the existing generator.
**Days 9–10** — Walk Mahipalpur. Start with the owner you already know.

## Day 1, item 1 — the credentials

`.env.local` contains a plaintext line reading `admin admin123`. Two things:

1. **Change that password now**, before any of the rest. `admin/admin123` is in every credential-stuffing list in existence, and your admin panel can create businesses, delete data and issue portal passwords.
2. Confirm `.env.local` is in `.gitignore` (it is untracked today — keep it that way) and remove the stray line from the file. A note-to-self does not belong in an env file.

While you are in there: the `Cmd+Shift+F` shortcut to `/admin/login` is harmless as long as the login itself is strong. It is not obscurity you are relying on, so leave it.

Also worth doing before you have customers: your backend has no visible client-side token expiry handling — a 401 anywhere triggers `signOut()`. That is acceptable, but confirm the backend actually expires tokens rather than issuing indefinite ones.

## Day 1, item 2 — strip the landing page

Delete from `page.tsx` and anywhere else it appears:

- Every instance of "copy a ready-made review" and variations
- The screenshot captioned "copies a ready-made suggestion"
- The fabricated review card in the hero
- "Reviews start with a scan, not a request"
- "No excuse to skip it"
- Anything implying you write, supply or provide reviews

If an owner Googles you the evening after your pitch and lands on "copy a ready-made review," you lose him. The full rewrite comes after your first conversations, when you know which sentences landed.

---

# PART 3 — DEV SPEC

## 3.1 What to reuse

Do not start from scratch. Almost everything you need is already in the codebase:

| Need | Reuse |
|---|---|
| Business record, QR code linking | `businesses` + hardware model, unchanged |
| Public route resolution | Existing `GET /r/:code` — extend the response |
| Analytics events | Existing `scan` / `review_copy` / `google_click` event log |
| Menu management UI | The admin **Reviews** screen, repurposed |
| Bulk menu upload | The existing bulk JSON upload on that screen |
| Business-side menu editing | The business **Reviews** screen, repurposed |
| Poster printing | Poster generator, unchanged |
| Onboarding | 3-step wizard — step 3 becomes Menu instead of Reviews |
| Plan gating | Existing `analytics: none/basic/full` flags |

## 3.2 New customer flow — `/r/[code]`

Replaces the current suggestion-card page entirely. Mobile only, no auth.

**Screen 1 — What did you have?**
Menu chips from the business's menu, multi-select. 6–8 visible, search below, free-text "something else". Skippable.

**Screen 2 — How was it?**
Five stars, nothing else on screen. One tap advances.

**Screen 3 — Anything stand out?**
Chips: staff, speed, taste, portion, price, cleanliness, ambience, music. Multi-select, skippable.

**Screen 4 — Your review**
Draft in a textarea, cursor in it, keyboard open.
Label above: *Edit this however you like. It is your review.*
Button: **Copy and open Google**

Same button at every star rating. No branching, ever.

**Design:** kill the `PLAYFUL_DEFAULT` hardcoded boolean. One design, chosen deliberately. Two half-used themes with no switch is dead weight in a flow where every KB matters.

## 3.3 Draft engine

Pure function. No API call, no model. Unit tested.

```js
// lib/buildDraft.js
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

const SKELETONS = {
  high: [   // 4-5 stars
    (i, a) => `Had the ${i} and it was really good.${a}`,
    (i, a) => `Came here for the ${i}, no complaints at all.${a}`,
    (i, a) => `The ${i} was worth coming back for.${a}`,
    (i, a) => `Ordered the ${i}. Good stuff.${a}`,
    (i, a) => `${cap(i)} was excellent.${a}`,
    (i, a) => `Really enjoyed the ${i} here.${a}`,
    (i, a) => `Went for the ${i} and it did not disappoint.${a}`,
    (i, a) => `Solid ${i}.${a}`,
    (i, a) => `The ${i} here is good.${a}`,
    (i, a) => `Tried the ${i}, would order it again.${a}`
  ],
  mid: [    // 3 stars
    (i, a) => `Had the ${i}. It was okay.${a}`,
    (i, a) => `Ordered the ${i}, decent but nothing special.${a}`,
    (i, a) => `The ${i} was fine.${a}`,
    (i, a) => `${cap(i)} was average.${a}`,
    (i, a) => `Tried the ${i}. Middling.${a}`,
    (i, a) => `Came for the ${i}, it was alright.${a}`,
    (i, a) => `The ${i} was okay, not more than that.${a}`,
    (i, a) => `Had the ${i} here. Mixed feelings.${a}`
  ],
  low: [    // 1-2 stars
    (i, a) => `Had the ${i} and it was not good.${a}`,
    (i, a) => `Ordered the ${i}, would not again.${a}`,
    (i, a) => `The ${i} was disappointing.${a}`,
    (i, a) => `${cap(i)} was poor.${a}`,
    (i, a) => `Not happy with the ${i}.${a}`,
    (i, a) => `Came for the ${i}. Bad experience.${a}`,
    (i, a) => `The ${i} was not worth it.${a}`,
    (i, a) => `Had the ${i}, would not recommend.${a}`
  ]
};

const ASPECT_TEXT = {
  high: {
    staff: ' Staff were friendly.',      speed: ' Service was quick.',
    taste: ' Tasted great.',             portion: ' Portions were generous.',
    price: ' Reasonably priced.',        cleanliness: ' Place was clean.',
    ambience: ' Nice place to sit.',     music: ' Good music.'
  },
  mid: {
    staff: ' Staff were okay.',          speed: ' Service took a while.',
    taste: ' Taste was average.',        portion: ' Portions were small for the price.',
    price: ' A bit pricey.',             cleanliness: ' Could be cleaner.',
    ambience: ' Seating was cramped.',   music: ' Music was loud.'
  },
  low: {
    staff: ' Staff were rude.',          speed: ' Waited far too long.',
    taste: ' Food did not taste good.',  portion: ' Portions were too small.',
    price: ' Overpriced.',               cleanliness: ' Not clean.',
    ambience: ' Uncomfortable place to sit.', music: ' Music was far too loud.'
  }
};

const band = r => (r >= 4 ? 'high' : r === 3 ? 'mid' : 'low');

export function buildDraft({ rating, items = [], aspects = [] }, seed = Math.random()) {
  if (!rating) return '';
  const b = band(rating);

  // one item only — listing three reads manufactured
  const item = items.length ? items[0].toLowerCase() : null;
  // one aspect only — two sentences maximum
  const aspect = aspects.length ? (ASPECT_TEXT[b][aspects[0]] || '') : '';

  if (!item) {
    return {
      high: `Good experience here.${aspect}`,
      mid:  `It was okay.${aspect}`,
      low:  `Not a good experience.${aspect}`
    }[b];
  }

  const pool = SKELETONS[b];
  return pool[Math.floor(seed * pool.length)](item, aspect);
}
```

**Rules this enforces:**

1. Nothing appears that the customer did not select
2. No adjective they did not choose
3. Structure rotates across customers
4. Two sentences maximum
5. Low ratings stay honest, never softened
6. Textarea always editable — this is your evidence the customer authored it

**Tests:**

```js
test('no aspect selected → no aspect sentence')
test('2 stars + slow → says the wait was long, not softened')
test('never mentions staff unless staff was selected')
test('20 sessions, same inputs → at least 6 distinct outputs')
test('output is always ≤ 2 sentences')
```

## 3.4 Data model

**New:**

```js
// menuItems
{
  _id, businessId, name, category,
  active: Boolean, sortOrder: Number,
  createdAt, updatedAt
}

// feedbackSessions — one per scan
{
  _id, businessId, qrCodeId,
  sessionToken: String,      // random 24 char
  startedAt: Date,
  completedAt: Date,
  rating: Number,            // 1-5, null if abandoned
  menuItemIds: [ObjectId],
  freeTextItem: String,
  aspects: [String],
  draftGenerated: String,
  draftEdited: Boolean,
  finalLength: Number,       // length only, never the text
  copiedAt: Date,
  googleClickedAt: Date,
  device: { os, browser, isMobile },
  referrerType: String       // qr | nfc | direct
}
```

Indexes: `{ businessId: 1, startedAt: -1 }`, `{ sessionToken: 1 }` unique.

**Privacy:** store the generated draft and whether it was edited. Do **not** store the customer's final edited text. You do not need it, and not holding it is a cleaner answer if anyone ever asks whether you author reviews.

**Deprecate:** the `reviewSuggestions` collection and its unused/reserved/used counters. Keep the data in place for now, stop writing to it, drop it once the new flow is live and stable.

**Extend the existing event log** with two new types alongside `scan` / `review_copy` / `google_click`:

```
feedback_rated      // screen 2 completed — your real funnel midpoint
feedback_drafted    // screen 4 reached
```

Your current funnel is scan → copy → click. The new one is scan → rated → drafted → copied → clicked, and the drop-off between rated and drafted is the number that tells you whether the flow works.

## 3.5 Endpoints

```
GET    /r/:code                          existing — extend with menu + aspects config
POST   /api/v1/feedback/session          create session → token
PATCH  /api/v1/feedback/:token           save answers, idempotent per screen
POST   /api/v1/feedback/:token/draft     generate draft
POST   /api/v1/feedback/:token/copied    mark copied
POST   /api/v1/feedback/:token/clicked   mark click, return Google URL

GET    /admin/businesses/:id/menu        list
POST   /admin/businesses/:id/menu        create / bulk upload
PATCH  /admin/menu/:id                   update
DELETE /admin/menu/:id                   remove
GET    /business/menu                    business-side list
POST   /business/menu                    business-side add
```

The menu endpoints mirror the shape of your existing review-suggestion endpoints, so the admin and business screens should be a rename and a field change rather than new work.

Rate-limit session creation in Redis: 10 per QR per minute, 20 per IP per minute. Without it anyone can inflate a client's numbers. Session tokens expire after 30 minutes.

## 3.6 Frontend notes

- Keep all four screens in one client component with a step index. No route changes between screens, no TanStack refetch per step.
- Server-render screen 1. This runs on airport-area 4G on budget phones.
- JS budget under 100 KB for `/r/[code]`. Nivo, chart code and anything from the dashboard bundle must not leak into this route — check the build output.
- Test on a real budget Android, not devtools.
- **Clipboard write must be inside the user gesture.** Do not `await` between the tap and the write or iOS Safari silently fails:

```js
const onCopyAndGo = (text, googleUrl) => {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  });
  fetch(`/api/v1/feedback/${token}/clicked`, { method: 'POST', keepalive: true });
  window.location.href = googleUrl;
};
```

## 3.7 Screen migration: Reviews → Menu

**Admin `/admin/reviews`** becomes **`/admin/menu`**:
- Per-business pool of suggestions → per-business menu items
- Unused / reserved / used counters → active / inactive, plus mention count later
- Bulk JSON upload → bulk menu upload, same mechanism

**Business `/business/reviews`** becomes **`/business/menu`**:
- Add/delete suggestions → add/delete/reorder menu items
- This is a better screen for the owner anyway. Managing a menu is a thing he understands; managing a "review suggestion pool" was always going to be an awkward conversation.

**Onboarding wizard** step 3 changes from "Reviews" to "Menu". Same three-step flow, same UI, different payload.

## 3.8 Google linking — no API, no cost

Keep using the `googleReviewUrl` you already store. It works as a deep link.

If you ever want a `place_id`, Google's **Place ID Finder** gives it free in a browser, no key, no billing. Skip the Places API entirely until past 100 businesses.

## 3.9 Site copy

**Hero**
> ## Find out what your customers actually think.
> One QR on the table. Three taps. They tell you what they ordered and how it was, then post it to Google in their own words.

**The problem**
> ### Most happy customers never say anything.
> Ask a hundred people to review you and one or two will actually do it. Not because they did not like the food. Because it means opening Google, searching your name, finding the right listing, and typing something out on a phone with one hand.
>
> The ones who do bother are usually the angry ones. That is why your rating looks worse than your restaurant is.

**How it works**
> **1. Put the code on the table.** We print it, you place it.
> **2. Three quick questions.** What did you have, how was it, anything worth mentioning. Taps, not typing.
> **3. They see their own words.** Their answers become a short review they can edit before it goes anywhere.
> **4. You see what people are saying.** Which dishes get mentioned, what the complaints are, which days are strong.

**Honesty block — on the landing page, not buried**
> ### How we keep this clean
> Customers write their own reviews. We never write one for them and we never post on anyone's behalf.
>
> Everyone sees the Google button, whatever they rate you. We do not hide it from unhappy customers.
>
> No discounts, no free coffee, no rewards for reviewing. Those break Google's rules and get listings penalised.
>
> If the feedback is bad, that is information you needed.

**Pricing**
> **Setup — ₹500 one time, first month included.**
> **Basic — ₹299/month.** Ratings over time, scan and post numbers, weekly WhatsApp summary.
> **Full — ₹499/month.** Menu-item breakdown, low-rating themes, shift view, monthly report.
>
> Cancel any month. Your QR keeps working for 30 days after you stop.

**Policy page** — publish it, it is what you point at if a competitor reports you
> **We do not write reviews.** The text is built from answers the customer gave seconds earlier. They can edit every word.
> **We do not post reviews.** The customer posts from their own Google account.
> **We do not filter by rating.** Same screen, same button, one star or five.
> **We do not allow incentives.** Businesses using our codes agree not to offer discounts or rewards for reviews.
> **We do not guarantee ratings.** A rating reflects the food and the service.

**Refund FAQ**
> **What if Google removes reviews?** Reviews posted through us are written by real customers about real visits, so this should not happen. If it does and it traces back to our tool, we refund everything you have paid and help with the appeal, though we cannot promise Google will reverse it.

**Tone:** short sentences, like talking across a counter. No "seamless", "empower", "game-changer". Never a number you cannot prove.

---

# PART 4 — AFTER THE REBUILD

## Stage 2 — First 10 customers, manual ops

Build nothing. Your admin panel already does the setup work; the rest is legwork.

| Step | Tool | Time |
|---|---|---|
| Onboard business | Existing wizard | 5 min |
| Menu entry | Repurposed menu screen | 15–30 min |
| Google review URL | Copy from his listing | 2 min |
| Print poster | Existing generator | ₹5 |
| Placement, in person | You | 10 min |
| Payment | UPI direct to you | 2 min |

Full 30 minutes of menu setup for everyone. Do not tier setup effort by customer value until you have sixty customers.

**Placement is everything.** Table, not counter. At the till the customer is paying, holding a bag, with someone behind them — five seconds. On the table or the bill folder, they have minutes. Same QR, several times the completion rate.

**Per customer, first 30 days:**
- Day 1 — you place the code yourself
- Day 3 — WhatsApp him the first review, typed by you
- Day 7 — Monday summary, four lines, by hand
- Day 14 — visit, check placement, move it if needed
- Day 30 — show before/after count, offer annual

**Record from customer one:** his Google review count and rating on install day (screenshot it), then weekly: scans, rated, drafted, copied, clicked, and count and rating at day 30.

Scan-to-click is the number the product lives on. Under 20% means placement or flow is wrong, and no dashboard will fix it.

## Stage 3 — Payments, at 10 paying customers

Nothing exists here yet, which is correct. Below ten customers, Razorpay payment links over WhatsApp take two minutes a month.

At ten: Razorpay Subscriptions with **UPI Autopay**, not links. Card mandates fail often on renewal in India; UPI Autopay is what owners actually keep. Enable the Subscriptions module (ask support, off by default) and UPI Autopay. Create plans in the Razorpay dashboard and map them to your existing Plans model rather than duplicating tiers.

Webhooks: `subscription.activated`, `charged`, `pending`, `halted`, `cancelled`, `payment.failed`. Verify signatures, idempotent handlers.

**Dunning:**

| Day | Action |
|---|---|
| 0 | WhatsApp: payment failed, here is the link |
| 1 | Retry |
| 3 | Retry + reminder |
| 7 | Retry + **phone call** |
| 10 | Service pauses, data kept, QR live |
| 40 | QR stops resolving |

Never cut access on the first failure. The day-7 call has the highest recovery rate and at your size you can make it.

**Pause, not cancel:** ₹99/month keeps data and QR live, reports stop.

Your business model already has a suspended/expired state and the admin Overview already surfaces it under "Needs Attention" — wire dunning into that rather than building a new status system.

## Stage 4 — WhatsApp, at 20 customers

Use an Indian BSP (AiSensy, Interakt, Wati, Gupshup), not Meta Cloud API direct. ₹999–2,500/month buys weeks of your time.

Needs a dedicated number, Meta Business verification, and **templates approved before you can send** — 1–3 days each, rejections common. Start three weeks before you need it.

Monday 9am digest, six lines max, never missed. Low-rating alert at 3+ ratings of ≤2 stars in 7 days. BullMQ repeatable jobs on Redis, idempotency key per (business, week).

By then you will have hand-written a hundred of these and will know exactly what to put in them.

## Stage 5 — Analytics, at 20 customers with 3 months data

Short stage, because the dashboard, plan gating and Nivo components already exist. You are feeding them new data, not building screens.

**Basic tier (existing):** ratings over time, the extended funnel, device split, peak hours.
**Full tier (new data):**
- Menu-item breakdown — *"Cold coffee: 4.8 across 34 mentions. Paneer roll: 3.1 across 12."*
- Low-rating themes from the aspects array
- Shift view from `startedAt` hour bands
- Comparison over time
- Monthly PDF via Puppeteer on a Next.js print route

Pre-aggregate nightly into a `dailyStats` collection. Do not compute Nivo charts from raw `feedbackSessions` at request time — fine at 10 businesses, painful at 200. Cache in Redis, 15-minute TTL.

**Also replace the static growth-suggestion tips** with real ones once this data exists. The code comment already admits they are not a real engine, and an owner will notice.

---

# FINAL WORD

You have far more built than you thought, and less left to do than the last version of this plan implied.

Change the admin password. Strip the landing copy. Rebuild one route and rename one screen. Then stop coding and go walk Mahipalpur.

The thing standing between you and customer one is not a missing feature.