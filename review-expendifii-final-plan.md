# Review by Expendifii — Build Doc

**Sameer / Expendifii**
Frontend: Next.js 16 App Router (Turbopack), React 19, TanStack Query, Tailwind v4, Nivo, qrcode
Backend: separate service at `NEXT_PUBLIC_API_URL`
Status: fully built and deployed. Zero customers.

---

# PART 0 — SCOPE

You have a complete three-portal SaaS in production: admin panel with onboarding wizard, hardware inventory, plan tiers, poster generator, business dashboard with plan-gated Nivo analytics, and a public customer flow.

Almost all of it stays. The work is one route, one screen, one page.

| Area | Status | Action |
|---|---|---|
| Admin panel, hardware, plans | Built | Leave alone |
| Poster generator | Built | Leave alone |
| Business dashboard + analytics | Built | Leave alone, feed it new data later |
| Three-portal auth | Built | One security fix |
| Analytics event model | Built | Add two event types |
| **`/r/[code]` customer flow** | **Built the wrong way** | **Rebuild — the only real work** |
| Review suggestion pool (admin + business) | Built | Rename into Menu management |
| Landing page copy | Built, risky | Strip |
| Payments | Not built | Correct. Leave until 10 paying customers. |

---

# PART 1 — THE DECISIONS

### The product

A feedback tool for small F&B and local services. Customer scans a QR at the table, answers three quick questions, gets a short draft assembled from their own answers, edits it if they want, posts to Google.

### What is being dropped

The pre-written review suggestion pool and everything serving it: the customer picking a card, the admin bulk JSON upload, the unused/reserved/used counters, and the business-side pool screen.

Google's Maps policy requires a review to reflect the poster's own experience. Third-party text fails that whether a human or an AI wrote it, and Google now acts against the tools as well as the businesses. At zero customers this costs nothing. With forty cafes on it, it would cost you the business.

### Pricing

**₹500 setup, first month included. ₹299/month after. UPI mandate set up at signup.**

Asking for autopay later is a second sale you will lose.

- Customers 1–3: free setup. You need proof more than ₹1,500.
- The ₹499 tier exists in your Plans model. Do not sell it until menu-item data exists to fill it.
- Annual ₹2,999 offered after a month of results, never at signup.

### Never build

- A Google button that only appears above 4 stars. That is review gating, explicitly against policy, and Google targets the tools that do it.
- An LLM writing the review text. Straight back into prohibited content.
- Anything on the admin or dashboard side until a paying customer asks for it.

### Sales line

Local businesses give 5–10% off for reviews. That is ₹80 on a ₹800 bill, per review, and an explicit Google violation that gets listings flagged.

> "You're paying ₹80 a review and risking your listing. This is ₹299 a month and it's inside Google's rules."

---

# PART 2 — THE SESSION

Ordered by dependency. Work top to bottom.

### 1. Credentials

`.env.local` contains a plaintext line reading `admin admin123`.

- [ ] Change the admin password to something strong
- [ ] Delete the stray line from `.env.local`
- [ ] Confirm `.env.local` is in `.gitignore` (untracked today — keep it that way)
- [ ] Confirm the backend actually expires tokens rather than issuing indefinite ones

`admin/admin123` is on every credential-stuffing list, and that account creates businesses, deletes data and issues portal passwords. Do this before anything else.

The `Cmd+Shift+F` shortcut to `/admin/login` is fine to keep — you are not relying on obscurity once the password is strong.

### 2. Strip the landing page

Delete from `page.tsx` and anywhere else it appears:

- [ ] Every instance of "copy a ready-made review" and variations
- [ ] The screenshot captioned "copies a ready-made suggestion"
- [ ] The fabricated review card in the hero
- [ ] "Reviews start with a scan, not a request"
- [ ] "No excuse to skip it"
- [ ] Anything implying you write, supply or provide reviews

If an owner Googles you after your pitch and lands on "copy a ready-made review," you lose him.

### 3. Backend — menu

- [ ] `menuItems` collection
- [ ] Admin menu endpoints (mirror the existing review-suggestion endpoints)
- [ ] Business-side menu endpoints
- [ ] Bulk upload, reusing the existing JSON upload mechanism

### 4. Backend — feedback sessions

- [ ] `feedbackSessions` collection + indexes
- [ ] Session endpoints
- [ ] Extend `GET /r/:code` to return menu + aspect config
- [ ] Redis rate limits on session creation
- [ ] Two new event types in the existing log: `feedback_rated`, `feedback_drafted`

### 5. Draft engine

- [ ] `lib/buildDraft.js` (code in Part 3.3)
- [ ] Unit tests (listed in Part 3.3)

Write the tests. This function is your legal position, and it needs to be provable rather than assumed.

### 6. Rename Reviews → Menu

- [ ] Admin `/admin/reviews` → `/admin/menu`
- [ ] Business `/business/reviews` → `/business/menu`
- [ ] Onboarding wizard step 3: Reviews → Menu

Same UI shape, different payload. Mostly a rename.

### 7. Rebuild `/r/[code]`

- [ ] Four screens in one client component with a step index
- [ ] Remove the `PLAYFUL_DEFAULT` boolean — pick one design
- [ ] Clipboard handler inside the user gesture (code in Part 3.6)
- [ ] Check the build output: no Nivo, no dashboard code in this route's bundle

### 8. Verify

- [ ] Full flow on a real budget Android on mobile data, not devtools
- [ ] Google button appears identically at 1 star and 5 stars
- [ ] Draft never mentions anything the customer did not select
- [ ] `/r/[code]` bundle under 100 KB of JS
- [ ] Seed a demo business through the existing wizard, with a real menu
- [ ] Print a poster with the existing generator and scan it off paper

### 9. Stop coding

- [ ] Go show it to the restaurant owner you already know

---

# PART 3 — DEV SPEC

## 3.1 What to reuse

Do not start from scratch. Most of what you need exists:

| Need | Reuse |
|---|---|
| Business record, QR linking | Existing models, unchanged |
| Public route resolution | Existing `GET /r/:code`, extended |
| Analytics events | Existing `scan` / `review_copy` / `google_click` log |
| Menu management UI | Admin Reviews screen, renamed |
| Bulk menu upload | Existing bulk JSON upload |
| Business-side menu editing | Business Reviews screen, renamed |
| Poster printing | Poster generator, unchanged |
| Onboarding | 3-step wizard, step 3 repointed |
| Plan gating | Existing `analytics: none/basic/full` flags |

## 3.2 New customer flow — `/r/[code]`

Replaces the suggestion-card page entirely. Mobile only, no auth.

**Screen 1 — What did you have?**
Menu chips, multi-select. 6–8 visible, search below, free-text "something else". Skippable.

**Screen 2 — How was it?**
Five stars, nothing else on screen. One tap advances.

**Screen 3 — Anything stand out?**
Chips: staff, speed, taste, portion, price, cleanliness, ambience, music. Multi-select, skippable.

**Screen 4 — Your review**
Draft in a textarea, cursor in it, keyboard open.
Label above: *Edit this however you like. It is your review.*
Button: **Copy and open Google**

Same button at every star rating. No branching, ever.

Kill `PLAYFUL_DEFAULT`. Two half-used themes with no switch is dead weight on the one route where every KB matters.

## 3.3 Draft engine

Pure function. No API call, no model.

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

**Deprecate:** `reviewSuggestions` and its counters. Stop writing to it, keep the data in place, drop it once the new flow is stable.

**Extend the event log** alongside `scan` / `review_copy` / `google_click`:

```
feedback_rated      // screen 2 completed
feedback_drafted    // screen 4 reached
```

Your funnel becomes scan → rated → drafted → copied → clicked. The drop between rated and drafted tells you whether the flow works, and right now you would be blind to it.

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

The menu endpoints mirror your existing review-suggestion endpoints, so the screens should be a rename and a field change rather than new work.

Rate-limit session creation in Redis: 10 per QR per minute, 20 per IP per minute. Without it anyone can inflate a client's numbers. Session tokens expire after 30 minutes.

## 3.6 Frontend notes

- All four screens in one client component with a step index. No route changes between screens, no TanStack refetch per step.
- Server-render screen 1. This runs on airport-area 4G on budget phones.
- JS budget under 100 KB for `/r/[code]`. Nivo and dashboard code must not leak into this route — check the build output.
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

## 3.7 Reviews → Menu

**Admin `/admin/reviews`** → **`/admin/menu`**
- Per-business suggestion pool → per-business menu items
- Unused / reserved / used counters → active / inactive, plus mention count later
- Bulk JSON upload → bulk menu upload, same mechanism

**Business `/business/reviews`** → **`/business/menu`**
- Add/delete suggestions → add/delete/reorder menu items
- Better screen anyway. Managing a menu is something an owner understands; managing a "review suggestion pool" was always going to be an awkward conversation.

**Onboarding wizard** step 3: Reviews → Menu. Same flow, different payload.

## 3.8 Google linking — no API, no cost

Keep using the `googleReviewUrl` you already store. It works as a deep link.

If you ever want a `place_id`, Google's **Place ID Finder** gives it free in a browser, no key, no billing. Skip the Places API until past 100 businesses.

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

# PART 4 — AFTER THIS SESSION

Each stage unlocks on a customer count, not a date. Do not start one early.

## Next — first 10 customers, manual ops

Build nothing. The admin panel already does the setup; the rest is legwork.

| Step | Tool |
|---|---|
| Onboard business | Existing wizard |
| Menu entry | Renamed menu screen |
| Google review URL | Copy from his listing |
| Print poster | Existing generator |
| Placement, in person | You |
| Payment | UPI direct to you |

Full menu setup for everyone. Do not tier setup effort by customer value until you have sixty customers.

**Placement is everything.** Table, not counter. At the till the customer is paying, holding a bag, with someone behind them — five seconds. On the table or the bill folder, they have minutes. Same QR, several times the completion rate. Place it yourself; do not hand over a poster and leave.

**Per customer, first month:**
- You place the code yourself
- WhatsApp him the first review that comes through, typed by you
- Weekly summary, four lines, by hand
- Visit, check placement, move it if needed
- Show the before/after count, then offer annual

**Record from customer one:** his Google review count and rating on install day (screenshot it), then weekly: scans, rated, drafted, copied, clicked.

Scan-to-click is the number the product lives on. Under 20% means placement or flow is wrong, and no dashboard will fix it.

**Give the first three away.** Free setup. What you ask for instead: permission to name them on the site, an honest conversation, and a referral if it works. Once you can say three cafes in Mahipalpur use this and here is what happened to their review count, the ₹500 sells itself.

## At 10 paying customers — payments

Below ten, Razorpay payment links over WhatsApp take two minutes a month. At ten, switch to Subscriptions with **UPI Autopay**, not links. Card mandates fail often on renewal in India; UPI Autopay is what owners actually keep.

Enable the Subscriptions module (ask support, off by default) and UPI Autopay. Create plans in the Razorpay dashboard and map them to your existing Plans model rather than duplicating tiers.

Webhooks: `subscription.activated`, `charged`, `pending`, `halted`, `cancelled`, `payment.failed`. Verify signatures, idempotent handlers.

**Dunning:**

| Day after failure | Action |
|---|---|
| 0 | WhatsApp: payment failed, here is the link |
| 1 | Retry |
| 3 | Retry + reminder |
| 7 | Retry + **phone call** |
| 10 | Service pauses, data kept, QR live |
| 40 | QR stops resolving |

Never cut access on the first failure. The day-7 call has the highest recovery rate and at your size you can make it.

**Pause, not cancel:** ₹99/month keeps data and QR live, reports stop.

Your model already has suspended/expired states and the admin Overview surfaces them under "Needs Attention" — wire dunning into that rather than building a new status system.

## At 20 customers — WhatsApp

Use an Indian BSP (AiSensy, Interakt, Wati, Gupshup), not Meta Cloud API direct. ₹999–2,500/month buys back your time.

Needs a dedicated number, Meta Business verification, and **templates approved before you can send** — rejections are common. Start the approvals well before you need them.

Monday digest, six lines max, never missed. Low-rating alert at 3+ ratings of ≤2 stars in 7 days. BullMQ repeatable jobs on Redis, idempotency key per (business, week).

By then you will have hand-written a hundred of these and will know exactly what to put in them.

## At 20 customers with 3 months of data — analytics

Short, because the dashboard, plan gating and Nivo components already exist. You are feeding them new data, not building screens.

**Basic (existing):** ratings over time, the extended funnel, device split, peak hours.
**Full (new data):**
- Menu-item breakdown — *"Cold coffee: 4.8 across 34 mentions. Paneer roll: 3.1 across 12."*
- Low-rating themes from the aspects array
- Shift view from `startedAt` hour bands
- Comparison over time
- Monthly PDF via Puppeteer on a Next.js print route

Pre-aggregate nightly into `dailyStats`. Do not compute Nivo charts from raw `feedbackSessions` at request time — fine at 10 businesses, painful at 200. Cache in Redis, 15-minute TTL.

**Replace the static growth-suggestion tips** with real ones once this data exists. The code comment already admits they are not a real engine, and an owner will notice.

---

# FINAL WORD

Change the admin password. Strip the landing copy. Rebuild one route and rename one screen.

Then stop coding and go show it to someone.







backend path : /Users/sameerfaridi/Desktop/qr_code/backend/package.json