# Code Review — QR Review Platform (Frontend)

**Scope:** `frontend/` — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. 88 source files, ~9,500 lines.
**Method:** Full read of every non-trivial file (grouped by admin, business, review-page, poster/PDF, shared UI, auth), plus `npm audit`, `eslint`, `tsc --noEmit`, `git ls-files`, and dependency/config inspection. Not covered: the separate backend repo, beyond what's visible from the API contracts the frontend calls.
**Voice:** written as a peer review — findings are ranked by real-world impact, not theoretical purity. Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low · ⚪ Info.

---

## Executive summary

This is a well-typed, modern, low-duplication codebase for its core business logic (menu management, dashboard, draft generation) — noticeably better factored than the average app this size. The problems here aren't "the code is bad," they're **things nobody will notice until they cost time**: zero automated tests on several pure, trivially-testable functions; a lint error sitting unnoticed because nothing enforces it; three near-identical poster page trees that will drift the next time someone fixes a bug in only one of them; and a couple of real accessibility gaps (modal focus trapping, canvas-only content) that are invisible until a real screen-reader user or auditor hits them.

**If you fix five things this week, fix these:**
1. Rotate/remove the plaintext admin credentials sitting in `.env.local` (🟠, see [Security](#1-security)).
2. Wire `npm run lint` into the build or a CI check — there's already one real lint error in the repo that's been silently shipping (🟡, see [Process](#6-process--tooling-gaps)).
3. Add focus trapping + focus return to `components/ui/Modal.tsx` — every modal in the app inherits the fix at once (🟠, see [Accessibility](#2-accessibility)).
4. Collapse the admin/business poster page trees into shared components before the next bug fix has to be applied twice (🟡, see [Reuse & Duplication](#3-reuse--duplication)).
5. Add unit tests for `buildDraft.ts`, `parseMenuJson.ts`, `reorder.ts`, and `validators.ts` — all pure, all currently untested, all logic a future refactor will silently break (🟡, see [Process](#6-process--tooling-gaps)).

---

## 1. Security

| Sev | Finding |
|---|---|
| 🟠 | **Plaintext admin credentials at rest.** `.env.local:4` contains a bare `admin admin123` line alongside the API URL — a real (or real-looking) admin username/password sitting unencrypted on disk. It's correctly `.gitignore`'d (`.gitignore:2` — verified not tracked via `git ls-files`), so it hasn't leaked to the repo, but anyone with filesystem access (a shared machine, a backup, a misconfigured dotfile sync) reads it in plaintext. Rotate the password and keep credentials out of files that live next to the codebase at all, gitignored or not. |
| 🟡 | **JWTs stored in `localStorage`, not an httpOnly cookie.** `src/app/admin/_lib/context.tsx:53,67,78` and `src/app/business/_lib/context.tsx` (mirror pattern) both persist the session token via `localStorage.setItem`. This is the standard SPA tradeoff and there's no confirmed active XSS vector in this codebase today (see the positives below) — but it means *any* future XSS anywhere in the admin or business portal is an instant full account takeover, not just a defaced page. Worth a conscious decision, not an accident. |
| 🟡 | **`generatePassword()` uses `Math.random()`, not a CSPRNG.** `src/app/admin/_lib/generatePassword.ts:4` — used to generate business-portal login passwords handed to real business owners. `Math.random()` is not specified to be cryptographically secure and is a known predictability risk in some engines. Swap for `crypto.getRandomValues()` — it's a five-minute fix with zero behavior change. |
| 🔵 | **Weak field validators.** `src/app/admin/_lib/validators.ts:5` accepts any 4–14 character password with no complexity requirement. `validators.ts:6-7` validate URLs with `v.startsWith("http")` — this accepts non-URLs like `"httpfoo"` and rejects valid `mailto:`/protocol-relative inputs; the one place a malformed URL would actually matter (`window.location.href = url` on the public review page, `src/app/r/[code]/page.tsx:185-189`) already re-validates with a real `new URL()` before navigating, so the weak validator's blast radius is small — but it's still the kind of gap that surprises someone later. |
| 🔵 | **No client-side login throttling.** Both login forms disable their submit button while a request is in flight, but there's nothing preventing rapid repeated attempts otherwise. This is legitimately the backend's job (rate limiting belongs server-side, not client-side), but worth confirming the backend actually does it — a client can't verify that from this codebase alone. |
| 🔵 | **No HTTP security headers configured.** `next.config.ts` sets nothing beyond `images.remotePatterns` — no CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, or `X-Content-Type-Options`. Next.js makes this a ~15-line `headers()` addition; costs little, closes off clickjacking and gives XSS mitigation defense-in-depth even though none is currently known. |

**What's actually done well here** (a review should say this too):
- No `dangerouslySetInnerHTML` misuse anywhere — the two uses in the codebase (`src/app/layout.tsx:71`, `src/app/page.tsx:62`) are both 100% hardcoded strings with zero user-data interpolation. No `eval`, `innerHTML`, or `document.write` anywhere in `src/`.
- The public review-page session token (`src/app/r/[code]/page.tsx:91`, sourced from a React Query cache entry) is **never persisted to storage** — it lives in memory only for the tab's lifetime, which is the right call for an anonymous, low-trust flow.
- Both `AdminProvider` and `BusinessProvider` call `queryClient.clear()` on login *and* logout — a real, deliberate guard against showing one account's cached data to the next person who signs in on the same device.
- The auth token is always sent via the `Authorization` header (`src/lib/api.ts`), never appended to a URL or query string.
- `npm audit` reports **0 vulnerabilities** in production dependencies as of this review.

---

## 2. Accessibility

| Sev | Finding |
|---|---|
| 🟠 | **No focus trap or focus management in the shared `Modal` component.** `src/components/ui/Modal.tsx` sets `role="dialog"`/`aria-modal="true"`/`aria-labelledby` correctly, but there's no effect moving focus into the dialog on open, no trap keeping Tab inside it, and no focus-return to the trigger element on close. Every modal in the app (all 4 admin edit modals, `ConfirmDialog`, the onboarding wizard, bulk upload) inherits this gap at once — and inherits the fix at once too, since it's one shared component. This is the single highest-leverage accessibility fix in the codebase. |
| 🟡 | **Canvas-rendered content has no text alternative.** `src/components/PosterPreviewCanvas.tsx:37` is a bare `<canvas>` with no `aria-label`/`role="img"`/fallback content — in the poster editor pages this canvas is the *only* representation of the live preview while a user edits fields, so a screen-reader user gets no confirmation their edits took effect. `QrCard.tsx` and `HeroQrCode.tsx` have the same pattern for the scannable QR canvas, partially mitigated in `QrCard.tsx` by the review URL also being shown as visible/selectable text nearby. |
| 🟡 | **Search input has no accessible name.** `src/components/ListTab.tsx:85-91` renders the list-search `<Input>` with only a `placeholder`, no `<label>` or `aria-label` — placeholder text isn't a reliable substitute for a real accessible name (it disappears on input and isn't consistently exposed by every screen reader). |
| ⚪ | It's plausible the per-field login error text (`ErrorText`) doesn't carry its own `aria-live`/`role="alert"` the way the form-level error banner does — flagged as worth a manual check, not confirmed as broken. |

**What's done well:**
- `role`/`aria-modal`/`aria-labelledby` are wired correctly and *consistently* on every dialog instance — the gap above is purely about focus management, not markup semantics.
- `useEscapeKey` is used everywhere a dialog exists, and correctly closes only the topmost dialog when nested (e.g. `QrViewModal` + its inner `ConfirmDialog`) — a real, deliberate fix for a common nested-modal bug, not an accident.
- `ToastContainer` (`src/components/Toast.tsx`) uses `role="status" aria-live="polite"`, so toast messages are announced.
- Form labels are properly associated via `htmlFor`/`id` throughout every modal, enforced by construction in the shared `Field`/`Label` primitives (`src/components/ui/Input.tsx`).
- No color-only status indicators found anywhere — `Badge` always pairs color with text, warning banners always pair an icon with text.
- `Pagination` uses native `<button disabled>` elements throughout, so keyboard operability comes for free rather than being reimplemented.

---

## 3. Reuse & Duplication

| Sev | Finding |
|---|---|
| 🟡 | **Admin and business poster flows are ~80–87% duplicated, file-for-file.** Diffed directly: `business/poster/size/page.tsx` vs `admin/businesses/poster/size/page.tsx` (~83% identical), `.../design/page.tsx` pairs (~80% identical — the `DesignCard` sub-component is **byte-for-byte identical** in both files), `.../edit/page.tsx` pairs (~87% identical, including the entire form JSX and the live-preview aspect-ratio wrapper). The only real difference across all three pairs is which auth context supplies `toast` (`useBusiness` vs `useAdmin`) and whether the admin flow's extra `category` param is threaded through. This should be 2–3 shared components (`PosterSizeStep`, `PosterDesignStep`, `PosterEditor`) parameterized by the auth hook and an optional category, with the route files reduced to thin wrappers. As it stands, a bug fix or a11y improvement made in one tree has to be remembered and reapplied in the other — and per the `generateReportPdf.ts` finding below, that's already starting to happen. |
| 🟡 | **Four admin edit modals share ~70% of their skeleton** (`HardwareEditModal`, `PlanEditModal`, `BusinessEditModal`, plus `QrViewModal` which is structurally different — link/unlink actions, not a form, correctly not grouped with the other three). The repeated part — `useQueryClient` → mutation with an `onSuccess` that invalidates+toasts+closes → `useEscapeKey(onClose, entity && !pending)` → null-guard → `Modal`/`ModalHeader`/`ModalBody`/`ModalFooter` — is close to verbatim and worth a thin `useEditModalMutation`-style hook. The *field rendering* genuinely differs enough (Hardware: 4 flat fields; Business: 7 fields + password flow + server-error mapping; Plan: nested `features` object) that a fully generic form-renderer would be the wrong call — extract the plumbing, not the fields. |
| 🔵 | `generateReportPdf.ts:216` reimplements filename slugification inline instead of importing the existing, more correct helper already in `qrPoster.ts:526-528` — the inline version skips the leading/trailing-dash trim and empty-string fallback the original has, so an edge-case business name can produce a malformed filename. Exactly the kind of drift the poster-flow duplication above will keep producing if left alone. |
| 🔵 | `hasLinkedHardware`/populated-reference-flattening logic (`typeof ref === "object" ? ref.name : "—"`) is copy-pasted 3× each across `overview/page.tsx`, `businesses/page.tsx`, `hardware/page.tsx`, `analytics/page.tsx`, `QrViewModal.tsx` — small individually, but it's exactly the kind of helper that causes a real bug the day the backend's populate shape changes and only 2 of 5 call sites get updated. Belongs in `lib/utils.ts`. |
| ⚪ | 11 of the 11 chart components under `src/components/charts/` repeat the identical 2–3 line `useTheme()` + `getCategoricalColors(theme)` + `getNivoTheme(theme)` setup. Low cost today, but a `useChartTheme()` hook would remove the boilerplate and be one less place to update if the theming approach ever changes. |
| ⚪ | `PAGE_SIZES = [10, 25, 50, 100]` duplicated verbatim in `ListTab.tsx` and `admin/analytics/page.tsx`. |

**What's done well:** this session's own additions — `MenuItemManager.tsx`, `MenuJsonInput.tsx`, `lib/parseMenuJson.ts`, `lib/reorder.ts` — are properly extracted and shared between the admin and business menu pages instead of being duplicated the way the poster flow was. It's a good template for the fix above, not a hypothetical: the pattern already exists and works in this repo, it just hasn't been applied retroactively to the older poster code.

---

## 4. Over-Engineering / Premature Abstraction

| Sev | Finding |
|---|---|
| 🟡 | **The poster "category" system (cafe/salon/doctor) exists to support exactly one real differentiator.** `qrPoster.ts:63-78` — `salon` and `doctor` both resolve to the identical generic design list; only `cafe` adds one bonus illustrated design. For that single distinction, the admin flow carries a whole extra route, a category-selection wizard step, and a URL param threaded through four subsequent pages — while the business flow (`business/poster/size/page.tsx:9-13`) explicitly skips the step with a comment conceding it "added a step without adding a choice." Worth flattening (e.g. show the cafe design as a bonus tile when relevant, no separate wizard step) rather than maintaining a whole abstraction for one option. |
| 🟡 | **`PlanEditModal`'s features-editing UI has no downstream consumer today**, by its own comment (`PlanEditModal.tsx:43-45`: "nothing yet reads these flags to gate what a business owner actually sees"). Acknowledged debt, but it's real UI, real state, and real surface area shipped for a feature that doesn't do anything yet. |
| 🔵 | `src/components/ui/Card.tsx` has zero imports anywhere in the codebase (verified by grep) — dead code shipping in the bundle for nothing. |
| 🔵 | `usePaginatedList.ts` returns a `reload: () => {}` no-op — vestigial surface on a shared hook, worth removing rather than leaving as a trap for the next person who calls it expecting it to do something. |
| ⚪ | `wavy-background.tsx:60` assigns `window.onresize = function(){...}` directly instead of `addEventListener` — clobbers any other global resize handler. Harmless today (one consumer, the marketing landing page), but fragile the moment a second component needs `window.resize` — worth fixing opportunistically, not urgently. |

---

## 5. Bad Practices / Type Safety / Correctness

| Sev | Finding |
|---|---|
| 🟠 | **`Row = Record<string, any>` (`src/lib/types.ts:1`) is the type used for nearly every entity in the admin app** — business, hardware, plan, analytics event, all of it. This defeats TypeScript across the entire admin surface: every field access is unchecked, and a backend field rename or shape drift won't be caught at compile time, only at runtime in front of a real admin. This is confirmed as a real, live issue, not a style nitpick — it's **the one and only error the project's own linter currently reports** (`npx eslint src` → 1 error, exactly this line). Introducing even a handful of real interfaces (`Business`, `HardwareItem`, `Plan`) with `Row` as an explicit escape hatch for the truly dynamic cases would be the highest-leverage type-safety improvement available. |
| 🟡 | **No debounce on the admin list search.** `ListTab.tsx` fires `onSearchChange` on every keystroke, which flows straight into a new server request per character via `usePaginatedList`. React Query's `keepPreviousData` hides the visual flicker but not the redundant network traffic — worth the same 150ms-debounce treatment already applied to the public review page's item search this session. |
| 🟡 | **No React error boundaries anywhere** (`app/layout.tsx`, `admin/layout.tsx`, `business/layout.tsx` all checked) — a render-time exception, as opposed to a handled fetch error, white-screens the entire app with no recovery UI. |
| 🟡 | **Magic-string keys duplicated instead of shared constants — silent-drift risk.** Hardware status keys are hand-listed inline in `overview/page.tsx:65-68` instead of reusing the already-exported `HARDWARE_STATUS_OPTIONS` (imported elsewhere, e.g. `HardwareEditModal.tsx`) — a new status added to the shared list won't automatically show up in the Overview stock breakdown. Event-type keys (`"scan"`, `"google_click"`, `"review_copy"`) are similarly hand-duplicated between `overview/page.tsx` and `analytics/page.tsx`. |
| 🟡 | **Inconsistent mutation error-handling conventions.** Some modals rely on the global default toast-on-error; `QrViewModal` and `BusinessEditModal` opt out (`meta: { toastOnError: false }`) and build bespoke inline error UI instead. Reasonable per-case (Business needs field-level email-conflict messaging), but there's no documented house rule for *when* to do which — a future contributor has to reverse-engineer the convention from examples. |
| 🟡 | **Poster editor redoes a full QR re-encode and canvas redraw on every keystroke**, even for fields unrelated to the QR content. `PosterPreviewCanvas.tsx:35` lists every individual text field as an effect dependency, so `drawQrPoster` — which unconditionally calls `QRCode.toCanvas` (an 800×800px encode) and, for the cafe design, reloads a bundled illustration — reruns on each character typed anywhere in the form. Combined with `fitFontSize` (`qrPoster.ts:123-131`), which does a pixel-by-pixel linear search calling `ctx.measureText` up to ~100+ times per invocation and is called 4–6× per render, this is real synchronous main-thread work per keystroke. Will visibly jank on lower-end devices; not currently a hard freeze. Fix: only redraw when the *edited* field's rendered value actually changed, and memoize the QR bitmap/illustration load separately from text redraws. |
| 🔵 | `downloadCanvasPng` (`qrPoster.ts:564-576`) revokes its object URL synchronously right after triggering the click — a common, usually-safe pattern, but a `setTimeout(() => URL.revokeObjectURL(url), 0)` would remove even the theoretical race on slower devices/larger PNGs. |

**What's done well:**
- No `any` types found anywhere in the poster/PDF/report code paths — clean throughout, including well-scoped, explained `@ts-expect-error` comments for a genuine third-party typing gap (`generateReportPdf.ts`, jspdf-autotable).
- No injection risk in the PDF generation path — all text goes through `doc.text()`, which draws glyphs, not markup; there's no way for a business name or review text to inject PDF structure.
- No unbounded or attacker-controlled image dimensions are ever drawn into the poster canvas — the only images loaded there are a locally-generated QR bitmap and one bundled static asset, never a user-supplied URL.
- The deliberate remount-via-`key` pattern (`key={editBusiness._id}`) used across the admin edit modals to force fresh form state per entity is a good, explicitly-commented pattern that avoids a whole class of stale-state bugs.

---

## 6. Process / Tooling Gaps

These aren't code defects, but they're the kind of thing that determines whether the *next* six months of changes stay clean or slowly rot — worth calling out explicitly in a "will impact us later" review.

- **Zero automated tests anywhere in the repo.** Several modules are pure functions with no DOM/network dependency and would take almost no effort to cover: `lib/buildDraft.ts` (the review-text generation logic — deterministic given a seed, directly responsible for what real customers post to Google), `lib/parseMenuJson.ts`, `lib/reorder.ts`, `admin/_lib/validators.ts`. This isn't hypothetical risk — earlier this session, a real off-by-one edge case in a client-side date-tick calculation only surfaced through manual visual testing; a two-line unit test would have caught it structurally instead of by inspection.
- **`next build` does not run ESLint**, and there's no CI workflow (`.github/workflows` doesn't exist) or pre-commit hook wiring `npm run lint` into anything. This is exactly how the `Record<string, any>` lint error above has been shipping unnoticed — the tooling to catch it already exists in the repo, it's just never invoked.
- **No `tsc --noEmit` or lint gate in any automated pipeline** — type errors and lint errors are only caught if a developer happens to run them manually before committing.

---

## Prioritized action list

Ordered roughly by (impact × how cheap the fix is), not strictly by severity — a 🟡 that takes ten minutes belongs above a 🟠 that takes a day.

1. **Rotate the admin password and stop keeping credentials in `.env.local`.** (Security, minutes)
2. **Wire `npm run lint` (and `tsc --noEmit`) into CI or at minimum a pre-commit hook.** Immediately surfaces the existing `any` error and prevents the next one. (Process, under an hour)
3. **Add focus trap + focus return to `components/ui/Modal.tsx`.** One fix, every dialog in the app benefits. (Accessibility, a few hours)
4. **Swap `Math.random()` for `crypto.getRandomValues()` in `generatePassword.ts`.** (Security, minutes)
5. **Add unit tests for `buildDraft.ts`, `parseMenuJson.ts`, `reorder.ts`, `validators.ts`.** (Process/Correctness, half a day, prevents future silent regressions in customer-facing text generation)
6. **Collapse the admin/business poster page trees into shared components.** (Reuse, half a day to a day — biggest duplication in the codebase, and the drift has already started per the `generateReportPdf.ts` slugify finding)
7. **Introduce real interfaces for `Business`/`HardwareItem`/`Plan` instead of `Row = Record<string, any>` everywhere.** (Type safety, incremental — can be done one page at a time)
8. **Add `aria-label`s to canvas previews and the list search input.** (Accessibility, minutes each)
9. **Add basic security headers in `next.config.ts` (CSP, X-Frame-Options, Referrer-Policy).** (Security, under an hour)
10. Everything under [Over-Engineering](#4-over-engineering--premature-abstraction) and the remaining ⚪/🔵 items — good backlog material, none of it urgent.

---

*This review covers the frontend only. The backend (Express/Mongo, separate repo) was not in scope beyond the API contracts observed from the client — a matching backend-focused review is a reasonable follow-up, particularly around the rate-limiting and input-validation assumptions this review had to take on faith from the client side.*
