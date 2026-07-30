# Auto Dude — Custom Website + Booking App: Build Plan

**Status:** Awaiting approval. No production code until approved and Phase 0 answers land.
**Supersedes nothing** — extends `00-TECHNICAL-PLAN.md` with the code-build specifics (sitemap, components, routes, build order).

---

## 1. Consolidated project understanding

**Business.** Auto Dude Mobile Detailing — 3121 Westpointe Dr #301, New Braunfels TX 78130 · (512) 844-0655 (`tel:+15128440655`) · geo 29.7103672, −98.1696822 · hours **7:00 AM–7:00 PM, 7 days** · slogan *Success Is In The Details.* Owner Carlos Bautista; project lead Jherico Megino. Mobile service across New Braunfels, Bulverde, Spring Branch, Canyon Lake, Wimberley, Boerne, Dripping Springs, San Marcos (+ Seguin, net-new).

**Current site.** WordPress + Elementor + Rank Math, 22 live pages. Fully extracted: copy, SEO frontmatter, FAQs, headings, maps, review text. Content lives in `auto-dude-migration/content-final/` (launch-ready, corrected) with `content/` retained as verbatim source of record.

**What we are building.** A custom Next.js + TypeScript + Tailwind app on Vercel that replaces WordPress *and* Urable. GoHighLevel is a headless backend only. The customer never leaves the Auto Dude brand.

**Non-negotiables carried from the audit.**
1. Every slug preserved (20 unchanged, 4 redirects total).
2. `content-final/` copy used verbatim — no AI-regenerated marketing copy.
3. Zero `urable.com` references (≈80 links stripped).
4. One `<h1>` per page (source had up to 11); Elementor split-headlines become one H2 + eyebrow.
5. NAP identical character-for-character everywhere.
6. Hours 7–7 in schema, footer, and calendar.
7. `#555555` is a border colour only — never text (fails WCAG AA on black).
8. Mobile-first; long content gets accordions, never deletion.

**SEO.** Per-page `seo_title` / `meta_description` / `focus_keyword` already written. 22 ready-to-paste JSON-LD blocks in `schema-redirects/schema/` (homepage = LocalBusiness + WebSite + FAQPage; services = Service + Breadcrumb + FAQPage; locations = city-scoped LocalBusiness + Service + Breadcrumb + FAQPage). Deliberately **no `aggregateRating`**. `sameAs` and `image` are placeholders to fill before launch. GEO/AEO: FAQ blocks must match FAQPage JSON-LD exactly, city-scoped entities on location pages, direct-answer first paragraphs.

**Booking.** Replaces Urable with a wizard covering vehicle → service → package → add-ons → condition → address → live GHL availability → date/time → customer → payment → confirmation. Conditional-logic matrix (which condition questions and add-ons appear per service) is already specced. Vehicle sizes: Coupe/Sedan · Midsize SUV/Truck · Large SUV/Truck · Oversized. Approved prototype at `autodudedetailing.vibepreview.com/book` — **layout/UX only**, not its prices, packages, dates, or times.

**GHL backend.** Custom fields (contact/vehicle/service), 17-stage "Auto Dude Booking" pipeline, tag taxonomy, 9 workflows (website lead, booking confirm, payment, 24h/2h reminders, abandoned booking, missed-call textback, review request, maintenance offer, ceramic aftercare). Quote form `94MzokSCDZnQikYGllJT` already live on most pages. Nothing else built in GHL yet.

---

## 2. Missing information (genuinely open)

Everything already answered in the prior chat is excluded. These six block the most work:

| # | Need | Blocks |
|---|---|---|
| 1 🔴 | **One authoritative price/package catalog.** Live site (Wash/Clay&Seal $130 · Interior $225 · Full $300 · Ceramic $449/$999 · Tint $349) and prototype (Express Wash $107 · Signature $239 · Premium Full $359) are different *taxonomies*, not just numbers. Need: package × vehicle size × price × duration × includes × best-for × popular × quote-only. Same for add-ons. | Pricing engine, package cards, durations, calendar sizing |
| 2 🔴 | **GHL test sub-account** + location ID + a Private Integration Token set in Vercel env (never pasted in chat). Calendar / pipeline / workflow IDs. Custom fields: create them yourself or grant access and I map programmatically. | All GHL integration |
| 3 🔴 | **Calendar strategy ruling** — GHL slots are fixed-length, our jobs run 1h to multi-day. (a) duration-bucketed calendars, (b) one calendar + server-side consecutive-slot merging, (c) instant-book short services / request-approval for long. **Recommend (a)+(c).** Plus: tech count, buffers, min notice, max window, blackout dates. | Availability, date/time step |
| 4 🔴 | **Payment mode at launch.** Your brief says "deposit or payment"; the approved prototype says *"PAY NOTHING UNTIL WE ARRIVE"*. These conflict. Recommend launching Mode 1 (no upfront payment) with the deposit adapter scaffolded. If deposits at launch: which provider, and deposit rules per service. | Payment step, legal copy |
| 5 🔴 | **Brand assets** — logo SVG (light/dark), mascot artwork + usage rights, photography library, before/after pairs. | Real UI instead of placeholders |
| 6 🔴 | **ZIP list per service city** + max radius + travel fees + manual-approval areas. Also: Google Places (billable, whose key) vs free ZIP-list validation. | Service-area validation |

Also needed, non-blocking but soon:
- **Three net-new pages have no content:** `/contact/`, `/gallery/`, `/reviews/`. Your brief lists them and the prototype header shows them, but they don't exist on WordPress. Need gallery images, and a decision on reviews (recommend live Google/GHL feed over hardcoding the 11 extracted reviews).
- **Seguin page** — net-new, needs unique local copy written.
- **SMS consent wording** (TCPA — must be counsel-reviewed), cancellation/rescheduling policy wording, vehicle-condition disclaimer.
- **Generic FAQ decision** — 8 service pages share a mobile-detailing FAQ; all 7 location pages share one FAQ. Recommend writing service/city-specific Q&A (schema updates with it).
- **Infra:** GitHub org, Vercel team, DNS access (domain at Squarespace), staging subdomain, GA4 / GTM / Meta Pixel / Ads conversion IDs, Search Console access (needed for a pre-migration baseline), Sentry.
- **Is there a repo behind `vibepreview.com`?** If yes I want to see it before deciding continue-vs-clean.

---

## 3. Recommended technical architecture

```
Browser — Next.js App Router (RSC marketing + client wizard)
    │  never sees GHL credentials
    ▼
Next.js Route Handlers on Vercel (Node runtime, server-only)
    ├──► GoHighLevel API v2  (contacts, calendars, appointments,
    │                         opportunities, workflows, payments)
    ├──► Vercel KV / Upstash (booking sessions, idempotency keys,
    │                         availability cache, rate limits)
    └──► Address validation  (Google Places or ZIP list)
```

**Front end.** App Router. Marketing pages are React Server Components, statically generated with ISR — content-as-code compiled from `content-final/` markdown into typed modules at build time. Tailwind with the design-system tokens mapped to theme values (`--ad-red #E11A22`, `--ad-black #0A0A0A`, `--ad-gray-900/800/600/300`), Bebas Neue / Oswald / Montserrat via `next/font` (self-hosted, no layout shift). Only `/book` is a client-side island.

**Server side.** Every GHL call in a route handler. Zod validation at every boundary. Typed error envelope (`SLOT_TAKEN`, `OUT_OF_AREA`, `GHL_UNAVAILABLE`, …) so the UI can render a specific state instead of a raw error. Structured logging + Sentry. Rate limiting per IP on availability and submit.

**GHL integration.** Private Integration Token in Vercel env vars (never `NEXT_PUBLIC_*`). A thin typed client with retry + exponential backoff on 429. Custom fields are addressed by opaque ID, so a startup mapping module fetches field IDs by name and a CI script **fails loudly** if any expected field is missing. Availability cached 30–60s server-side.

**Data storage.** No general-purpose database at launch. Vercel KV holds booking sessions (TTL ~24h), idempotency keys, and the availability cache. GHL is the system of record for customers and appointments. Catalog and content are versioned config in the repo. If Carlos needs to edit copy himself later, add a headless CMS in a follow-on phase.

**Booking sessions.** Server-created session ID on wizard start, persisted on every step (`PATCH`). That gives abandoned-booking recovery, resume-after-refresh, and an idempotency scope. The client holds only a session ID and a rendering estimate.

**Money and time are server-authoritative.** The client displays an estimate; the server recomputes price and duration from the catalog on `/api/quote` *and again* at submit, rejecting any payload whose total disagrees. A tampered request claiming `total: $1` must be rejected — that is a required test, not a nice-to-have.

**Payments.** A `PaymentProvider` interface with `NoUpfrontPayment` as the launch implementation, so a deposit or full-payment provider drops in later without touching the wizard. The app never captures card details in our own fields — checkout is hosted by the provider.

**Deployment.** GitHub → Vercel. Preview deploy per PR; `staging.autodudedetailing.com` as the persistent staging environment against the GHL **test** sub-account; production only after full QA. Separate env vars per environment. DNS cutover last, after a staging crawl proves all 20 preserved URLs return 200 and the 4 redirects return 301.

---

## 4. Sitemap

**Preserved (20 — must resolve identically):**

| Type | Page | Route |
|---|---|---|
| Home | Home | `/` |
| Service | Mobile Detailing | `/mobile-detailing/` |
| Service | Full Detail | `/full-care-detail-new-braunfels-tx/` |
| Service | Interior Detailing | `/interior-detailing-new-braunfels/` |
| Service | Exterior Detailing | `/exterior-detailing-new-braunfels/` |
| Service | Ceramic Coating | `/ceramic-coating/` |
| Service | Paint Enhancement & Correction | `/paint-correction/` |
| Service | Window Tinting | `/window-tinting-new-braunfels/` |
| Service | Headlight Restoration & Add-Ons | `/headlight-restoration-detailing-add-ons-new-braunfels-tx/` |
| Service | RV, Boat & Motorcycle | `/rv-boat-motorcycle-detailing-new-braunfels-tx/` |
| Service | Maintenance Program | `/maintenance-program/` |
| Location | Bulverde | `/mobile-detailing-bulverde-tx/` |
| Location | Spring Branch | `/mobile-detailing-spring-branch-tx/` |
| Location | Canyon Lake | `/mobile-detailing-canyon-lake-tx/` |
| Location | Wimberley | `/mobile-detailing-wimberley-tx/` |
| Location | Boerne | `/mobile-detailing-boerne-tx/` |
| Location | Dripping Springs | `/mobile-detailing-dripping-springs-tx/` |
| Location | San Marcos | `/mobile-detailing-san-marcos-tx/` |
| Standalone | About | `/about/` |
| Utility | Privacy · Terms · Thank You | `/privacy-policy/` `/terms-of-service/` `/thank-you/` |

**Net-new:**

| Page | Route | Note |
|---|---|---|
| Seguin | `/mobile-detailing-seguin-tx/` | Unique local copy required |
| Contact | `/contact/` | No legacy page — content needed |
| Gallery | `/gallery/` | Images needed |
| Reviews | `/reviews/` | Recommend live feed |
| Booking wizard | `/book/` | Also `/book?service=ceramic-coating` deep links from service pages |
| Confirmation | `/booking/[reference]/` | SSR, `noindex`, tokenised |

**Redirects (4):** `/mobile-detailing-new-braunfels-tx/`→`/` · `/bulverde/`→`/mobile-detailing-bulverde-tx/` · `/exterior-detailing/`→`/exterior-detailing-new-braunfels/` · `/full-detail/`→`/full-care-detail-new-braunfels-tx/`. All 301. Plus: pick one trailing-slash convention and 301 the other; keep the existing www/non-www convention; let `/wp-*`, `/feed`, `/category/*`, `/author/*` 404.

**Machine routes:** `/sitemap.xml`, `/robots.txt`, `/opensearch` (optional).

---

## 5. Component structure

Mapped from the existing `BUILD-SPEC/02-COMPONENTS.md` (C01–C18) to React.

**`components/ui/`** — `Button` (primary/secondary/tertiary/phone, 48px min height, full-width stacked on mobile), `Card`, `Input`, `Select`, `Checkbox`, `Radio`, `Textarea`, `Accordion`, `Chip`, `Badge`, `Ribbon`, `Skeleton`, `Modal`, `Toast`.

**`components/layout/`**
| Component | Spec |
|---|---|
| `Header` | C01 — logo, Services ▾, Service Areas ▾, About, Call Now, Get My Free Quote. Sticky, 80/64px. |
| `MobileNav` | C01 — hamburger, full-screen overlay, accordion submenus, pinned CTA |
| `Footer` | C02 — 4 columns, exact NAP block, collapsible on mobile |
| `StickyMobileCta` | C16 — 64px bottom bar; hides when the final CTA band is in view |
| `Breadcrumbs` | C18 — must match `BreadcrumbList` JSON-LD |

**`components/marketing/`**
| Component | Spec |
|---|---|
| `Hero` | H1 + eyebrow + subhead + dual CTA |
| `TrustBar` | C03 — 250+ Reviews · 1,000+ Vehicles · Licensed & Insured · Satisfaction Guaranteed |
| `ReviewCard` / `Reviews` | C04 — 3 + Load more, 5-line clamp, slider on mobile, **no aggregateRating** |
| `CoverageMap` | C05 — city chips + per-city map embed |
| `Faq` | C06 — collapsed by default, one open at a time, `<button>` + `aria-expanded`, mirrors FAQPage JSON-LD |
| `QuoteCtaBand` | C07 — the only full-red section |
| `MembershipBlock` | C08 — 4 benefit cards |
| `BeforeAfter` + `StatCounters` | C09 — drag slider / tap toggle; 1,000+ / 250+ / 100% |
| `FeaturedCeramic` | C10 |
| `WhyChooseUs` | C11 — 4 cards |
| `CredentialsBand` | C12 — Best of San Antonio 2025, Chamber, Rupes + Stinger |
| `ServicesGrid` | C13 — 6 cards + 10 add-on chips, `{CITY}` token |
| `PackageComparison` | C14 — 3-up desktop, **accordion stack on mobile** |
| `ProcessSteps` | C15 — timeline → vertical stepper |
| `Gallery` | new |

**`components/booking/`** — `BookingShell`, `ProgressIndicator`, `OrderSummary` (persistent right rail desktop / collapsible sticky drawer mobile, with `ESTIMATED` badge and removable add-ons), `VehicleTypeCard`, `VehicleDetailsForm` (year/make/model/color), `ServiceCard`, `PackageCard` (MOST POPULAR ribbon + text label), `AddOnCard` (+/× toggle), `ConditionQuestions` (driven by the conditional matrix), `AddressForm` (validated, service-area checked), `DateSelector`, `TimeSelector`, `CustomerForm`, `ConsentBlock`, `PaymentStep`, `ConfirmationPanel`, `LoadingState`, `EmptyState` ("no slots — see next available / request a callback"), `ErrorState`, `SlotTakenNotice`.

**`components/seo/`** — `JsonLd`, `Metadata` builders.

Accessibility applies across all of them: visible red focus ring never removed, ≥48px tap targets, persistent `<label>`s, `aria-live` error announcements, no meaning conveyed by colour alone, `prefers-reduced-motion` honoured, keyboard-completable booking.

---

## 6. Booking data model

Reconciling your 12-step brief with the specced 9-step flow: **vehicle first** (per your brief), then service, package, add-ons, condition, address, schedule, customer, payment, confirm. Condition questions sit after add-ons because they depend on the chosen service.

```ts
type VehicleSize = 'coupe_sedan' | 'midsize_suv_truck' | 'large_suv_truck' | 'oversized_specialty'
type VehicleType = 'coupe'|'sedan'|'truck'|'suv'|'minivan'|'van'|'rv'|'boat'|'motorcycle'|'other'

type ServiceCategory =
  | 'full_detail' | 'interior_detail' | 'exterior_detail'
  | 'ceramic_coating' | 'paint_enhancement' | 'paint_correction'
  | 'window_tint' | 'headlight_restoration'
  | 'rv_detailing' | 'boat_detailing' | 'motorcycle_detailing'
  | 'maintenance_program'

// ---------- Catalog: versioned server config, single source of price truth ----------
interface Package {
  id: string
  category: ServiceCategory
  name: string
  shortDescription: string
  bestFor: string
  includes: string[]
  limitations: string[]
  pricing: Record<VehicleSize, number | null>        // null = not offered / quote only
  durationMinutes: Record<VehicleSize, number>
  eligibleVehicleSizes: VehicleSize[]
  quoteOnly: boolean                                  // request, not instant book
  requiresApproval: boolean
  multiDay: boolean
  depositPolicy: 'none' | 'fixed' | 'percent'
  depositValue?: number
  popular?: boolean
}

interface AddOn {
  id: string
  name: string
  description: string
  pricing: Record<VehicleSize, number>
  durationMinutes: number
  appliesTo: ServiceCategory[]                        // conditional visibility
  incompatibleWith?: string[]
}

interface ConditionQuestion {
  id: string
  label: string
  kind: 'boolean' | 'scale' | 'select'
  options?: string[]
  appliesTo: ServiceCategory[]                        // the conditional matrix
  priceImpact?: 'none' | 'surcharge' | 'manual_review'
  durationImpactMinutes?: number
}

// ---------- Booking session: server-persisted, the idempotency scope ----------
interface BookingSession {
  id: string
  createdAt: string; updatedAt: string; expiresAt: string
  status: 'in_progress' | 'submitting' | 'confirmed' | 'pending_approval' | 'failed' | 'abandoned'
  vehicle: Vehicle
  selection: { serviceCategory?: ServiceCategory; packageId?: string; addOnIds: string[] }
  condition: Record<string, string | boolean>
  quote?: Quote                                       // server-computed only
  location?: ServiceAddress
  schedule?: Schedule
  customer?: CustomerDetails
  payment?: PaymentState
  consents: { sms: boolean; email: boolean; terms: boolean; privacy: boolean }
  tracking: TrackingData
  ghl?: { contactId?: string; appointmentId?: string; opportunityId?: string; reference?: string }
}

interface Vehicle {
  size: VehicleSize; type: VehicleType
  year?: number; make?: string; model?: string; color?: string
  licensePlate?: string; vin?: string
  count: number                                        // default 1
  oversizedOrLifted?: boolean
}

interface Quote {                                      // NEVER trusted from the client
  lineItems: { id: string; label: string; amount: number; kind: 'package'|'addon'|'surcharge'|'travel'|'fee' }[]
  subtotal: number; tax: number; total: number
  depositDue: number; balanceDue: number
  estimatedDurationMinutes: number
  currency: 'USD'
  computedAt: string
  catalogVersion: string
}

interface ServiceAddress {
  street: string; city: string; state: 'TX' | string; zip: string
  accessInstructions?: string; gateCode?: string
  waterAccess: boolean; powerAccess: boolean; workspaceConfirmed: boolean
  notes?: string
  validation: { inServiceArea: boolean; requiresManualApproval: boolean; travelFee?: number; travelMinutes?: number }
}

interface Schedule {
  calendarId: string
  startUtc: string; endUtc: string
  timezone: 'America/Chicago'
  bufferMinutes: number
  spansMultipleDays: boolean
  technicianId?: string
}

interface CustomerDetails {
  firstName: string; lastName: string
  email: string; phone: string                         // E.164, real validation
  preferredContact: 'call' | 'text' | 'email'
  specialRequests?: string
}

interface PaymentState {
  mode: 'none' | 'deposit' | 'full'
  provider: 'none' | 'ghl' | 'stripe'
  status: 'not_required' | 'pending' | 'paid' | 'failed'
  amount: number
  externalId?: string
}

interface TrackingData {
  bookingSource: string; landingPage?: string; referrer?: string
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string
  firstTouch?: string; lastTouch?: string
}
```

**GHL field mappings** (names from `booking-crm/02-crm-fields-pipeline.md`; IDs resolved at runtime by the field-map module, which fails loudly on a missing field):

| App field | GHL target |
|---|---|
| `customer.firstName/lastName/email/phone` | native contact fields |
| `customer.preferredContact` | Preferred Contact Method |
| `tracking.bookingSource` / UTMs | Lead Source, Referral Source |
| `location.street/city/zip` | Service Address, City, ZIP Code |
| `consents.sms` / `consents.email` | SMS Consent, Email Consent |
| `vehicle.year/make/model/type/size/color` | Vehicle Year/Make/Model/Type/Size/Color |
| `vehicle.licensePlate` / `vin` | License Plate, VIN |
| `condition` (compiled) | Vehicle Condition |
| `selection.serviceCategory` | Requested Service |
| `selection.packageId` → name | Selected Package |
| `selection.addOnIds` → names | Selected Add-Ons |
| `quote.total` | Estimated Price |
| `quote.depositDue` / `balanceDue` | Deposit Amount, Remaining Balance |
| `quote.estimatedDurationMinutes` | Service Duration |
| `schedule.startUtc` | Appointment Date |
| `schedule.technicianId` | Technician |
| `status` | Service Status + pipeline stage |
| ceramic packages | Coating Status, Coating Installation Date, Coating Warranty End Date |

Tags applied per `02-crm-fields-pipeline.md`: `lead-website`, `service-{…}`, `booking-started`, `booking-abandoned`, `deposit-paid`, `confirmed`, `out-of-area`, `coating-customer`. Pipeline stage set to *Booking Started* on session create, *Appointment Booked* on commit, *Deposit Paid* on payment success.

---

## 7. API route plan

All under `app/api/**`, Node runtime, server-only, Zod-validated, rate-limited, typed error envelope.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/catalog` | Public catalog filtered by vehicle size + service (no internal cost data) |
| `POST` | `/api/booking/session` | Create or resume a session; returns session ID |
| `PATCH` | `/api/booking/session/[id]` | Persist step progress → abandoned-booking recovery |
| `POST` | `/api/quote` | **Server-authoritative** price + duration for a selection |
| `POST` | `/api/service-area/validate` | Address → in-area / manual-approval / travel fee |
| `GET` | `/api/ghl/availability` | Proxy GHL free slots for `{calendarId, range, durationMinutes}`; 30–60s cache, backoff on 429 |
| `POST` | `/api/ghl/contact` | Create/update contact + custom fields (internal, called by submit) |
| `POST` | `/api/ghl/appointment` | Create appointment (internal, the commit point) |
| `POST` | `/api/ghl/payment` | Create deposit/payment intent or hosted link (Phase 2) |
| `POST` | `/api/booking/confirm` | **The orchestration** — idempotent, sequence below |
| `GET` | `/api/booking/[reference]` | Tokenised confirmation data, `noindex` |
| `POST` | `/api/webhooks/ghl` | Inbound appointment/payment changes, signature-verified |
| `POST` | `/api/lead` | Quote-form and callback-request capture (non-booking) |
| `GET` | `/api/health` | Dependency checks for monitoring |

**`POST /api/booking/confirm` sequence** (idempotency key = session ID):

1. Validate payload and session state
2. **Recompute the quote server-side** — reject on disagreement
3. Re-validate the service area
4. **Re-check slot availability in GHL** → on conflict return `SLOT_TAKEN` and refresh the picker
5. Create/update GHL contact + custom fields
6. **Create the appointment ← commit point**
7. Create/update opportunity, set pipeline stage
8. Apply tags
9. Trigger workflow
10. Record payment/deposit status
11. Persist GHL IDs + booking reference on the session
12. Return the confirmation payload

Failures **after step 6** never fail the customer's booking — they queue for retry and raise an internal flag. **Confirmation renders only after GHL returns an appointment ID.**

---

## 8. Build plan (exact order)

| # | Phase | Work | Gate |
|---|---|---|---|
| 0 | Discovery | §2 answers · GHL test sub-account · field/calendar/pipeline IDs mapped · assets delivered | Blocks 4, 5, 6 |
| 1 | Foundation | Repo, Next.js + TS + Tailwind, design tokens from `01-DESIGN-SYSTEM.md`, fonts, `ui/` primitives, Header/MobileNav/Footer/StickyCta/Breadcrumbs, CI, staging deploy | Design approval |
| 2 | Content pipeline | `content-final/*.md` → typed modules; metadata + JSON-LD builders; sitemap; robots; the 4 redirects | — |
| 3 | Marketing site | Homepage → approve → 10 service pages → Boerne → approve → 6 location pages → Seguin (new copy) → About/Contact/Gallery/Reviews/Privacy/Terms/Thank You | Content verified on staging |
| 4 | Catalog + pricing engine | Typed catalog, quote + duration engine (pure, unit-tested every package × size × add-on), service-area/ZIP validation | Needs §2.1, §2.6 |
| 5 | Booking UI — mock data | Full wizard, order summary, progress indicator, every loading/empty/error state. **Clearly labelled prototype, connected to nothing.** Can run in parallel with 2–3. | **Your UX sign-off** |
| 6 | GHL integration | API client, field mapping + fail-loud validation, availability proxy + cache, orchestration, idempotency, error taxonomy, webhooks — against the **test** sub-account only | Needs §2.2, §2.3 |
| 7 | Payments | `PaymentProvider` adapter; Mode 1 live, deposit mode scaffolded | Needs §2.4 |
| 8 | Automations | Wire the 9 workflows to real triggers; verify SMS/email/notifications fire | — |
| 9 | Hardening & QA | §9 in full — E2E, a11y, load, security, Lighthouse budgets | All green |
| 10 | Launch | Search Console baseline capture → DNS cutover → redirect verification → sitemap submission → 2–4 week monitoring | — |

Phases 1–3 and 5 need **zero** GHL access. If you want, I start there immediately while Phase 0 answers are gathered.

---

## 9. Testing plan

| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Pricing engine — every package × vehicle size × add-on combo; duration math; condition-question surcharges; ZIP/service-area validation; timezone + DST conversions; every Zod schema |
| Integration | Vitest + MSW + GHL test sub-account | Each GHL endpoint; field-map resolution and fail-loud on a missing field; availability cache TTL and 429 backoff; orchestration happy path **and every failure branch**; idempotency (double submit → exactly one appointment) |
| E2E | Playwright | Full booking on desktop + mobile viewports; every error state; back/refresh mid-wizard; slot-taken race; abandoned-then-resumed session; deep link `/book?service=…` |
| **Form validation** | Playwright + unit | Explicitly fixes the prototype's bugs: phone `071001` must be rejected (E.164 validation); address `New` must be rejected (real validation + service-area check); email format; required-field messaging via `aria-live` |
| **Calendar** | Integration + E2E | Slots reflect real GHL availability, not hardcoded chips; only slots fitting total duration are shown; buffer + travel applied; multi-day blocks consecutive days; DST boundary dates; empty-state when no slots |
| **Appointment** | Test sub-account | Appointment lands with correct start/end/timezone/calendar; contact, custom fields, opportunity, stage, tags all correct; confirmation shown only after GHL returns an ID |
| **Payment** | Provider sandbox | Mode 1: no charge, correct copy. Deposit mode: amount correct, balance correct, failed-payment does not orphan the booking, webhook reconciles status |
| **Duplicate prevention** | Integration + E2E | Double-click, refresh, back-button, replayed request → one appointment; concurrent same-slot submissions → one wins, other gets `SLOT_TAKEN` |
| **Security** | Manual + `npm audit` | No secret in the client bundle; **tampered payload claiming `total: $1` must be rejected**; rate limits; webhook signature verification |
| **SEO QA** | Screaming Frog + manual | All 20 preserved URLs return 200; one H1 per page; titles/metas/canonicals match `content-final/` frontmatter; JSON-LD validates in Rich Results Test; **FAQ copy matches FAQPage markup exactly**; no `urable.com` anywhere; no `aggregateRating`; sitemap complete; `noindex` on `/booking/[reference]` |
| **Redirect QA** | Crawl on staging + post-cutover | The 4 redirects return 301 to the right targets; trailing-slash convention consistent; no chains or loops; `/wp-*` paths 404 |
| **Analytics QA** | GA4 DebugView + Tag Assistant | Page views; `booking_started`, `step_completed`, `booking_submitted`, `booking_confirmed`, `call_click`, `quote_submitted`; UTM capture persists into the GHL contact; Ads/Meta conversions fire once, not per render |
| **Accessibility** | axe-core + manual | Keyboard-only booking completion; focus management between steps; screen-reader labels; AA contrast (watch `#555555`); reduced-motion |
| **Mobile** | Playwright + real devices | 375/390/430px widths; sticky CTA never covers the footer; package comparison is an accordion, never a squeezed grid or horizontal price table; order summary as a collapsible drawer; ≥48px tap targets; no horizontal scroll on any page |
| Performance | Lighthouse CI | LCP < 2.5s, CLS < 0.1 mobile, enforced as a CI budget |
| Load | k6 | Availability endpoint under concurrency without tripping GHL rate limits |
| UAT | Carlos | Real bookings in the test sub-account — verify contact, appointment, opportunity, workflow, SMS, email, and internal notification all land |

---

## 10. Timeline

| Phase | Duration |
|---|---|
| 0 Discovery | 3–5 days (yours) |
| 1 Foundation | 1–1.5 weeks |
| 2 Content pipeline | 3–5 days |
| 3 Marketing site (26 pages) | 2–2.5 weeks |
| 4 Catalog + pricing engine | 1 week |
| 5 Booking UI (mock) | 1–1.5 weeks *(parallel with 2–3)* |
| 6 GHL integration | 2–3 weeks |
| 7 Payments | 0.5–1 week |
| 8 Automations | 3–5 days |
| 9 Hardening & QA | 1–1.5 weeks |
| 10 Launch | 2–3 days |

**Realistic total: 9–13 weeks** sustainable · **7–9 weeks** fully focused and unblocked. The critical path runs through Phase 0 — every day without the pricing table and GHL test access pushes everything right.

**Sign-off milestones:** design system + components (end Wk 2) · marketing site on staging (end Wk 4–5) · **booking prototype approved** (end Wk 5–6) · booking working end-to-end in the GHL test sub-account (Wk 8–10) · QA passed (Wk 11–12) · launch (Wk 12–13).
