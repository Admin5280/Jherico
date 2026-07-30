# Auto Dude — Custom Booking Platform: Technical Plan

**Status:** Planning. **No production code until the information request (`01-INFORMATION-REQUEST.md`) is answered and a GHL test sub-account is available.**

---

## 1. Project understanding

Build a **custom-coded Auto Dude website + booking application** (Next.js/TypeScript/Tailwind on Vercel). GoHighLevel becomes a **headless backend only** — contacts, custom fields, calendars, availability, appointments, opportunities, pipelines, workflows, SMS/email, payments/invoices, notifications, review requests, maintenance follow-up.

**The customer never leaves the Auto Dude brand.** No Urable. No standard GHL booking page unless there is no reliable custom alternative.

The site owns: pages, service pages, location pages, SEO, navigation, design, responsiveness, and the entire booking UX (vehicle → service/package → add-ons → schedule/location → customer details → payment → confirmation).

### What I already have (from the completed migration work)

- All 22 pages of copy, SEO metadata, FAQs → `../auto-dude-migration/content-final/`
- Design system, component library (C01–C18), per-page build specs → `../auto-dude-migration/BUILD-SPEC/`
- JSON-LD schema per page + redirect map → `../auto-dude-migration/schema-redirects/`
- NAP, hours (7 AM–7 PM), service areas, brand tokens, existing GHL form ID
- WordPress XML, Elementor export, Rank Math export, sitemap, redirect list

### What the screenshots told me (design direction — layout only, not data)

A 5-step wizard already exists at `autodudedetailing.vibepreview.com/book`:

| Step | Screen | Key UI |
|---|---|---|
| 1 | Vehicle (implied) | Order summary shows `VEHICLE: SUV / Crossover` |
| 2 | **Package Selection** | 3 tier cards, "MOST POPULAR" ribbon, price + duration + ✓ feature list, `SELECT PACKAGE` / `SELECTED` |
| 3 | **Custom Add-Ons** | 2-col cards, `+` toggle → red border + `×` when selected, `+$price`, "NO THANKS, JUST THE BASICS →" |
| 4 | **Schedule & Location** | Address field, date chips (day-of-week + number), time chips, "MOBILE SERVICE" info card w/ prep bullets + estimated duration |
| 5 | **Finalize Booking** | Name/email/phone/notes, TERMS & CONDITIONS checkboxes, SECURE BOOKING reassurance card, `CONFIRM BOOKING` |

**Persistent right rail — "YOUR ORDER"**: red header + `ESTIMATED` badge, vehicle, base service + price, add-ons (removable, trash icon), subtotal, total, `PAY NOTHING UNTIL WE ARRIVE & COMPLETE THE JOB`, trust row (`INSURED & BONDED`, `5.0 RATING`), `BACK` / `CONTINUE`.

**Header:** logo+mascot · SERVICES ▾ · MAINTENANCE · GALLERY · REVIEWS · ABOUT · CONTACT · search · phone · `BOOK NOW`.

I will reproduce this **layout, hierarchy, step progression, card design, and order-summary behaviour**. I will **not** reuse the prices, package names, dates, or times shown.

> **Three things I noticed in the screenshots that need fixing in the rebuild:**
> 1. Phone field accepted `071001` — no validation.
> 2. Service address accepted `New` — no address validation or service-area check.
> 3. Dates/times are clearly hardcoded (SAT 25 → SAT 1, four fixed times). Real availability must come from the GHL calendar.

---

## 2. Recommended architecture

```
Browser (Next.js App Router, RSC + client wizard)
      │  never sees GHL credentials
      ▼
Next.js Route Handlers on Vercel  ── server-only ──►  GoHighLevel API v2
      │                                                (contacts, calendars,
      │                                                 appointments, opportunities,
      ├──► Vercel KV / Supabase                         workflows, payments)
      │    (booking sessions, idempotency keys,
      │     availability cache, error logs)
      └──► Address validation (Google Places)
```

**Principles**

1. **Server is the source of truth for money and time.** The client renders an *estimate*; the server recomputes price and duration from the catalog config on every quote and again at submit. A tampered client payload can never change what gets booked or charged.
2. **All GHL calls are server-side.** Token lives in Vercel environment variables, never `NEXT_PUBLIC_*`.
3. **Catalog as typed config, not hardcoded JSX.** Services/packages/add-ons/pricing live in one versioned module (later swappable for a CMS or GHL products) so pricing changes don't require touching components.
4. **Marketing pages are static (SSG/ISR)** for speed and SEO; only the booking wizard is dynamic.
5. **Modular payment step** — a `PaymentProvider` interface with a `NoUpfrontPayment` implementation first, so Mode 2/3 can drop in later without touching the wizard.

### Rendering strategy

| Route type | Strategy | Why |
|---|---|---|
| Home, service, location, about, legal | **SSG + ISR** | Fastest LCP, best SEO, content changes rarely |
| `/book` wizard | Client component + server actions | Interactive state |
| `/api/*` | Route handlers (Node runtime) | GHL secrets, no edge-runtime constraints |
| `/booking/[reference]` | SSR, `noindex` | Per-customer confirmation |

### Content management

Start with **content-as-code** (typed TS/MDX modules generated from `content-final/`): zero cost, version-controlled, instant. **Open question:** if Carlos needs to edit copy himself, we add a headless CMS (Sanity/Payload) in a later phase — I've asked about this in the information request.

---

## 3. Risks & limitations (read this section carefully)

These are real constraints, not hypotheticals. Several affect scope.

### 🔴 R1 — GHL calendars use a *fixed* slot duration; our durations are dynamic

This is **the biggest technical risk in the project.** A GHL calendar is configured with a set slot length. But our appointment length varies by package **and** selected add-ons (an Express Wash ≈ 1–2 h; a Premium Full Detail + add-ons ≈ 6 h; an 8-year ceramic ≈ 1–2 days). GHL's free-slots endpoint will not natively return "slots where 6 consecutive hours are free."

**Options (need your decision):**
- **(a) Duration-bucketed calendars** — separate GHL calendars for ~2h / ~4h / ~6h / full-day jobs; pick the calendar from the computed duration. *Cleanest; more calendars to maintain.*
- **(b) One calendar, small base slot + server-side consecutive-slot merging** — we fetch free slots and compute which start times have enough contiguous space, then block the tail. *Most flexible; most custom logic; risk of races.*
- **(c) Request-only for long services** — instant booking for short services, "request appointment → manual confirm" for ceramic/correction/multi-day. *Safest launch; less automated.*

**My recommendation: (a) + (c)** — bucketed calendars for standard detailing, manual-approval request flow for coatings/correction/multi-day.

### 🔴 R2 — Multi-day services don't fit an appointment slot
8-year ceramic and multi-stage paint correction span 1–2 days. These should be a **quote/approval request**, not instant booking.

### 🟠 R3 — GHL API rate limits
GHL API v2 enforces per-location burst and daily limits. A public availability calendar can generate a lot of requests. **Mitigation:** cache availability server-side (30–60s TTL), debounce client requests, never call GHL directly from the browser, exponential backoff on 429.

### 🟠 R4 — Payments are the least mature part of the GHL API
Fully branded in-app card capture generally means **Stripe direct** — but then GHL invoice/payment records need syncing. GHL-hosted payment links are reliable but partly GHL-branded.
**Mitigation & recommendation:** launch with **Mode 1 (no upfront payment)** — which is exactly what your screenshots already promise (*"PAY NOTHING UNTIL WE ARRIVE & COMPLETE THE JOB"*). Deposits become Phase 2 once the provider is confirmed. This de-risks launch substantially.

### 🟠 R5 — Custom fields are addressed by ID, not name
Every GHL custom field has an opaque ID. We must fetch and map them before any write. A renamed/recreated field silently breaks writes. **Mitigation:** a startup-time mapping module + a validation script that fails loudly if an expected field is missing.

### 🟠 R6 — Double-booking / race conditions
Two customers can select the same slot simultaneously. GHL is the arbiter, but a naive flow shows success then fails. **Mitigation:** re-validate availability immediately before creating the appointment; on conflict, return a specific "slot just taken" state and refresh the picker — never a raw error.

### 🟡 R7 — Duplicate submissions
Double-click / refresh / back-button. **Mitigation:** idempotency key per booking session, stored server-side; repeat submits return the original result instead of creating a second appointment.

### 🟡 R8 — Timezone correctness
Everything is `America/Chicago` (with DST). GHL returns epoch milliseconds. Off-by-one-day bugs are the classic failure. **Mitigation:** store UTC, render in a single explicit business timezone, never use the browser's local timezone for business logic.

### 🟡 R9 — Address validation costs money
Google Places Autocomplete + validation is billable. Alternative: ZIP-list validation (free, coarser). Need your preference.

### 🟡 R10 — Partial-failure orchestration
Booking touches contact → appointment → opportunity → tags → workflow. If step 3 fails after step 2 succeeded, we must not strand data. **Mitigation:** ordered writes with the appointment as the commit point, compensating logging, and a replay queue for non-critical follow-ups.

### ⚪ R11 — Pricing conflict (needs your ruling — see info request §3)
The **live site** and the **screenshot prototype** disagree on both package names and prices:

| Source | Packages |
|---|---|
| Live site (extracted) | Wash/Clay & Seal **$130** · Interior Clean & Protect **$225** · Full Clean & Protect **$300** · Ceramic 1yr **$449–649** / 5yr **$999** · Tint **$349** |
| Screenshot prototype | Express Wash **$107** · Signature Detail **$239** · Premium Full Detail **$359** |

These are different taxonomies, not just different numbers. **I need one authoritative catalog before building the pricing engine.**

---

## 4. Information required

See **`01-INFORMATION-REQUEST.md`** — organised into your 10 sections, with everything I already have pre-filled so you only answer the genuine gaps.

---

## 5. Implementation sequence

| Phase | Work | Depends on | Est. |
|---|---|---|---|
| **0. Discovery** | Answers to info request; GHL **test** sub-account; field/calendar/pipeline IDs mapped | You | 3–5 d |
| **1. Foundation** | Repo, Next.js+TS+Tailwind, design tokens, component library, header/footer/nav, CI, staging deploy | 0 | 1–1.5 wk |
| **2. Marketing site** | 22 pages from `content-final/`, SEO metadata, JSON-LD, sitemap, redirects, analytics | 1 | 1.5–2 wk |
| **3. Booking UI (prototype, mock data)** | Full 5-step wizard, order summary, all states — **clearly labelled prototype, no GHL** | 1 | 1–1.5 wk |
| **4. Catalog + pricing engine** | Typed catalog, server-side quote/duration engine, service-area validation, unit tests | 0 (§3 answers) | 1 wk |
| **5. GHL integration** | API client, field mapping, availability proxy + cache, contact/appointment/opportunity/workflow orchestration, idempotency, error taxonomy | 0, 4 | 2–3 wk |
| **6. Payments** | Provider adapter; Mode 1 live, Mode 2/3 scaffolded | 5 + provider decision | 0.5–1 wk |
| **7. Hardening & QA** | E2E, a11y, load, security review, error-state QA | 5 | 1–1.5 wk |
| **8. Launch** | Baseline capture, DNS cutover, redirects, monitoring | 7 | 2–3 d |

**Realistic total: 8–12 weeks** at a sustainable pace; **6–8 weeks** if fully focused and unblocked. The critical path runs through **Phase 0** — every day without GHL access and the authoritative pricing table pushes everything right.

---

## 6. Proposed data model

```ts
// ---------- Catalog (server-authoritative, versioned config) ----------
type VehicleSize = 'coupe_sedan' | 'midsize_suv_truck' | 'large_suv_truck' | 'oversized_specialty'

type ServiceCategory =
  | 'full_detail' | 'interior_detail' | 'exterior_detail'
  | 'ceramic_coating' | 'paint_enhancement' | 'paint_correction'
  | 'window_tint' | 'headlight_restoration'
  | 'rv_detailing' | 'boat_detailing' | 'motorcycle_detailing'
  | 'maintenance_program'

interface Package {
  id: string
  category: ServiceCategory
  name: string
  shortDescription: string
  bestFor: string
  includes: string[]
  limitations: string[]
  pricing: Record<VehicleSize, number | null>   // null = not offered / quote only
  durationMinutes: Record<VehicleSize, number>
  quoteOnly: boolean            // true => request, not instant book
  requiresApproval: boolean
  depositPolicy: 'none' | 'fixed' | 'percent'
  depositValue?: number
  eligibleVehicleSizes: VehicleSize[]
  popular?: boolean             // drives "MOST POPULAR" ribbon
}

interface AddOn {
  id: string
  name: string
  description: string
  pricing: Record<VehicleSize, number>
  durationMinutes: number
  appliesTo: ServiceCategory[]  // conditional visibility
  incompatibleWith?: string[]
}

// ---------- Booking session (server-persisted) ----------
interface BookingSession {
  id: string                    // uuid, also the idempotency scope
  createdAt: string; updatedAt: string; expiresAt: string
  status: 'in_progress' | 'submitting' | 'confirmed' | 'failed' | 'abandoned'
  vehicle: { size: VehicleSize; year?: string; make?: string; model?: string; color?: string; type?: string }
  selection: { packageId?: string; addOnIds: string[] }
  quote?: Quote                 // server-computed only
  schedule?: { calendarId: string; startUtc: string; endUtc: string; timezone: 'America/Chicago' }
  location?: ServiceAddress
  customer?: CustomerDetails
  consents: { sms: boolean; email: boolean; terms: boolean; privacy: boolean }
  tracking: TrackingData
  ghl?: { contactId?: string; appointmentId?: string; opportunityId?: string; reference?: string }
}

interface Quote {                          // NEVER trusted from client
  lineItems: { id: string; label: string; amount: number; kind: 'package' | 'addon' | 'fee' }[]
  subtotal: number; tax: number; total: number
  depositDue: number; balanceDue: number
  estimatedDurationMinutes: number
  currency: 'USD'
  computedAt: string
  catalogVersion: string
}

interface ServiceAddress {
  street: string; city: string; state: string; zip: string
  accessInstructions?: string; gateCode?: string
  waterAccess: boolean; powerAccess: boolean; workspaceConfirmed: boolean
  notes?: string
  validation: { inServiceArea: boolean; requiresManualApproval: boolean; travelFee?: number }
}

interface CustomerDetails {
  firstName: string; lastName: string; email: string; phone: string
  preferredContact: 'call' | 'text' | 'email'
  specialRequests?: string
}

interface TrackingData {
  bookingSource: string; landingPage?: string; referrer?: string
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string
  firstTouch?: string; lastTouch?: string
}
```

---

## 7. Proposed API route structure

All under `/app/api/**`, Node runtime, server-only. Every route: Zod-validated input, typed error envelope, rate-limited, structured logging.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/catalog` | Public catalog (packages/add-ons) filtered by vehicle size |
| `POST` | `/api/booking/session` | Create or resume a booking session |
| `PATCH` | `/api/booking/session/[id]` | Persist wizard progress (enables abandoned-booking recovery) |
| `POST` | `/api/quote` | **Server-authoritative** price + duration for a selection |
| `POST` | `/api/service-area/validate` | Validate address → in-area / manual-approval / travel fee |
| `GET` | `/api/availability` | Proxy GHL free slots for `{calendarId, dateRange, durationMinutes}`; cached |
| `POST` | `/api/booking/submit` | **The orchestration** (idempotent) — see below |
| `GET` | `/api/booking/[reference]` | Confirmation data (tokenised, `noindex`) |
| `POST` | `/api/webhooks/ghl` | Inbound: appointment changed/cancelled, payment status (signature-verified) |
| `GET` | `/api/health` | Dependency checks for monitoring |

**`POST /api/booking/submit` sequence** (idempotency key = session id):

1. Validate payload (Zod) and session state
2. **Recompute quote server-side** — reject if the client total disagrees
3. Re-validate service area
4. **Re-check slot availability in GHL** → on conflict return `SLOT_TAKEN`
5. Create/update GHL contact + custom fields
6. **Create appointment** ← *commit point*
7. Create/update opportunity → set pipeline stage
8. Apply tags
9. Trigger workflow
10. Record payment/deposit status
11. Persist `ghl` ids + booking reference on the session
12. Return confirmation payload

If a step **after 6** fails, the booking still stands; the failure is queued for retry and flagged internally rather than shown to the customer.

---

## 8. Proposed folder structure

```
auto-dude-web/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                        # home
│   │   ├── [service]/page.tsx              # service pages (static params)
│   │   ├── mobile-detailing-[city]-tx/page.tsx
│   │   ├── about/ privacy-policy/ terms-of-service/ thank-you/
│   │   ├── sitemap.ts  robots.ts
│   ├── book/
│   │   ├── page.tsx                        # wizard shell
│   │   └── steps/                          # Vehicle, Package, AddOns, Schedule, Details
│   ├── booking/[reference]/page.tsx        # confirmation (noindex)
│   └── api/…                               # routes from §7
├── components/
│   ├── ui/                                 # Button, Card, Input, Accordion, Chip…
│   ├── layout/                             # Header, Nav, MobileNav, Footer, StickyCta
│   ├── marketing/                          # Hero, TrustBar, Reviews, Coverage, Faq, Membership…
│   └── booking/                            # ProgressIndicator, OrderSummary, PackageCard,
│                                           # AddOnCard, DateSelector, TimeSelector,
│                                           # AddressForm, CustomerForm, PaymentStep,
│                                           # ErrorState, LoadingState, EmptyState
├── lib/
│   ├── catalog/          # packages, add-ons, pricing rules, service areas
│   ├── pricing/          # quote + duration engine (pure, unit-tested)
│   ├── ghl/              # client, auth, contacts, calendars, appointments,
│   │                     # opportunities, workflows, payments, field-map
│   ├── booking/          # session store, idempotency, orchestration
│   ├── validation/       # Zod schemas
│   ├── seo/              # metadata + JSON-LD builders
│   └── analytics/        # event tracking
├── content/              # generated from ../auto-dude-migration/content-final/
├── types/
├── tests/{unit,integration,e2e}
└── .env.example          # documented, no real values
```

---

## 9. Testing plan

| Layer | Tool | Coverage |
|---|---|---|
| **Unit** | Vitest | Pricing engine (every package × vehicle size × add-on combo), duration calc, service-area/ZIP validation, timezone/DST conversions, Zod schemas |
| **Integration** | Vitest + MSW / GHL **test sub-account** | GHL client per endpoint, field mapping, availability caching, orchestration happy path + each failure branch, idempotency (double submit → one appointment) |
| **E2E** | Playwright | Full booking on desktop + mobile viewport; every error state; back/refresh mid-wizard; slot-taken race; abandoned-and-resumed session |
| **Accessibility** | axe-core + manual | Keyboard-only booking completion, screen-reader labels, focus management between steps, AA contrast |
| **Performance** | Lighthouse CI | LCP < 2.5s, CLS < 0.1 mobile; budget enforced in CI |
| **Load** | k6 | Availability endpoint under concurrency; confirm GHL rate limits aren't tripped |
| **Security** | Manual + `npm audit` | No secrets in client bundle, server-side price authority (attempt a tampered payload), rate limiting, webhook signature verification |
| **UAT** | Carlos | Real bookings in the test sub-account; verify contact, appointment, opportunity, workflow, and notifications all land correctly |

**Non-negotiable test:** a tampered client payload claiming `total: $1` must be rejected and the correct server-computed price used.

---

## 10. Timeline

See §5. Summary: **8–12 weeks** sustainable, **6–8 weeks** focused, gated on Phase 0.

**Milestones for sign-off:**
1. Design-system + component library approved (end Wk 1–2)
2. Marketing site on staging, content verified (end Wk 3–4)
3. **Booking prototype (mock data) approved** (end Wk 5) ← your UX sign-off point
4. Booking working end-to-end in **GHL test** sub-account (end Wk 7–9)
5. Full QA passed (Wk 10–11)
6. Launch (Wk 11–12)

---

## Immediate next step

Answer `01-INFORMATION-REQUEST.md`. I can build **Phase 3 (the mock-data booking prototype)** in parallel with zero GHL dependency — it will be clearly labelled as a prototype and connect to nothing. Say the word and I'll start that while you gather credentials and the pricing table.
