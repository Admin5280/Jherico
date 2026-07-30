# Auto Dude — Solutions Architecture Blueprint (Website ⇄ GoHighLevel)

**Role:** Solutions Architect. **No code.** This is the blueprint the Next.js build and the GHL setup both follow.

> ## ⚠ DATA SOURCE NOTE — READ FIRST
> **Pricing is now authoritative.** The full Auto Dude catalog was provided from Notion and lives in **[`03-PRICING-CATALOG.md`](03-PRICING-CATALOG.md)** — that file is the source of truth for prices, packages, durations, and the vehicle-class model. This document (§1–§2) summarises it for architecture; where they differ, the catalog wins.
>
> **Resolved:** the pricing-conflict blocker is closed. The old live-site anchors are superseded.
> **Still open (do not build these until confirmed):** (1) Maintenance schedule label — "Bi-Monthly" vs "Bi-Weekly"; (2) Interior/Exterior durations (not in Notion); (3) large/HD-truck class; (4) tax; (5) deposit amounts. See catalog §11.
>
> **Key structural decision — vehicle classes were inconsistent across services** (tint uses 5 tiers, others 3, with different labels). Resolved with a **6-class canonical picker + per-service mapping table** in catalog §0. This standardization unblocks the booking logic and GHL products.

---

## 1. SERVICE HIERARCHY

Two axes drive everything: **service** and **vehicle size**. Vehicle size is a *modifier*, never its own product. Full prices in [`03-PRICING-CATALOG.md`](03-PRICING-CATALOG.md).

**Canonical vehicle picker (6):** `Coupe/Compact` · `Sedan` · `Truck` · `Mid-Size SUV` · `Large SUV` · `Oversized/Specialty`. Each service maps these to its own tier via the mapping table in catalog §0. (Tint uses all 5 non-oversized tiers; other services roll up to 3.)

| Service | Type | Packages | Price range | Online-bookable? |
|---|---|---|---|---|
| **Exterior Detail** | one-time | Wash, Clay & Seal | $130–155 | ✅ instant |
| **Interior Detail** | one-time | Clean & Protect · Deep Clean | $225–400 | ✅ instant |
| **Full Detail** | one-time | Clean & Protect · Deep Clean | $300–500 | ✅ instant |
| **Window Tint** | one-time | Standard · Ceramic (+ add-ons, removal) | $349–699 | ✅ instant (complex glass → request) |
| **Ceramic Coating** | one-time, high-value | 1-Year · 5-Year · 8-Year | $449–2,199+ | ⚠ **request/approve** (long/multi-day) |
| **Paint Correction** | one-time | 1-Step · 2-Step · 3-Step | $325–975 | ⚠ request/approve |
| **Headlight Restoration** | add-on / small job | per lens ($55 each) | flat | ✅ as add-on |
| **RV / Boat / Motorcycle** | specialty | by size/length | quote | ⚠ request/approve |
| **Maintenance Program** | **recurring** | Monthly · Bi-Monthly* · Quarterly | $150–325 | ✅ separate flow (eligibility-gated) |
| **Add-Ons** | modifiers | ~28 line items | flat or ranged | attach to any base |

`*` schedule label unconfirmed (catalog §11). Paint Enhancement now appears as **ceramic add-ons** (1-Stage $200 / 2-Stage $400), not a standalone service.

**Classification that matters for the build:**
- **Instant-book (price known):** Exterior, Interior, Full, Window Tint (simple), Headlight, Add-ons.
- **Request/approve (long/multi-day/quote):** Ceramic (all tiers), Paint Correction (all steps), RV/Boat/Motorcycle, Oversized. Collect details + preferred dates → opportunity → Carlos confirms; no hard slot booked online.
- **Recurring:** Maintenance Program (subscription; requires a qualifying prior service, generally within 30 days).
- **Never sold alone:** Add-ons.
- **Ranged prices (`$X–$Y`, `$X+`):** show "from $X" and route to review — never charge a range at checkout.

---

## 2. PRODUCT HIERARCHY (GHL)

**Core principle: model vehicle size as a PRICE VARIANT, not a separate product.** A product-per-size design would create 40+ products; variants keep it ~20 and maintainable.

### 2.1 Base-service products (one product each, price variants by size)

| GHL Product | Category | Type | Variants (price points) | Online | Manual approve | Deposit | Workflow | Calendar |
|---|---|---|---|---|---|---|---|---|
| Exterior Detail | Detailing | one-time | 4 sizes | ✅ | – | none ⟨prov⟩ | Booking Confirm | Standard (2–3h) |
| Interior Detail | Detailing | one-time | 4 sizes × {Clean&Protect, Deep Clean} | ✅ | – | none | Booking Confirm | Standard/Half-day |
| Full Detail | Detailing | one-time | 4 sizes × {Clean&Protect, Deep Clean} | ✅ | – | none | Booking Confirm | Half-day (3–6h) |
| Window Tint | Glass | one-time | Standard / Ceramic | ✅ | optional | none | Booking Confirm | Standard |
| Ceramic Coating | Protection | one-time | 4 sizes × {1yr, 5yr, 8yr} | request | ✅ | **deposit** | Coating Request | Full/Multi-day |
| Paint Enhancement | Protection | one-time | quote | request | ✅ | deposit | Quote Request | Full-day |
| Paint Correction | Protection | one-time | quote | request | ✅ | deposit | Quote Request | Multi-day |
| RV/Boat/Motorcycle | Specialty | one-time | quote by size | request | ✅ | deposit | Quote Request | Full/Multi-day |
| Maintenance Program | Membership | **recurring** | Monthly/Bi-Monthly/Quarterly × size | ✅ | – | first payment | Membership | Standard (recurring) |

### 2.2 Variant strategy

- **Vehicle size** → GHL product **price variant** (Coupe/Sedan, Midsize, Large, Oversized). One product, 4 prices.
- **Package level** (Clean & Protect vs Deep Clean; 1yr/5yr/8yr) → **second variant dimension** if GHL supports 2-axis variants in your plan; otherwise **one product per package level** with size as the price variant (still far fewer than product-per-combination).
- **The website computes the price server-side from a catalog config and passes the resolved amount to GHL** — GHL products exist mainly as the payment/invoice line-item and reporting record. This means the site is the pricing brain; GHL variants mirror it for clean invoices. (Prevents variant-maintenance drift being customer-visible.)

### 2.3 Add-ons — do NOT make these bookable products

Model add-ons as **line-item products flagged `add-on`**, selectable only inside a base booking:
Clay Bar & Decon · Interior Ceramic Treatment · Engine Bay Detail · Trim Restoration · Carpet Shampoo · Seat Shampoo · Stain Removal · Pet Hair Removal · Odor/Ozone · Headlight Restoration · Door Jamb · Glass Coating · Window Tint Removal.
Each carries a flat or by-size price and an added-duration value (feeds calendar slot sizing).

### 2.4 Product count (with real catalog)

~**14 base bookable products** (size = price variant): Exterior(1), Interior(2), Full(2), Tint(2), Ceramic(3), Paint Correction(3), Maintenance(1 recurring). Plus ~**28 add-on line items** (13 general + 4 tint + 3 tint-removal + 5 ceramic + 3 maintenance). Base stays lean; add-ons are lightweight modifiers. vs **60+** products if every size×package×service were its own product.

---

## 3. CALENDAR ARCHITECTURE

**Recommendation: organize calendars by DURATION BUCKET, not by service, technician, or vehicle.** (This is the single most consequential decision — see R1 in `00-TECHNICAL-PLAN.md`.)

**Why not the alternatives:**
- **By service** → 10+ calendars, and a "Full Detail + 3 add-ons" still doesn't fit a fixed service slot. Rejected.
- **By technician** → couples availability to staffing; breaks when Carlos hires/loses a tech. Model technicians as **calendar team members / assignment**, not as separate calendars. Rejected as the primary axis.
- **By vehicle type** → vehicle size affects duration, which the buckets already capture. Rejected as redundant.
- **By location** → Auto Dude is mobile (comes to the customer); "location" is the customer address + travel time, handled by buffers, not calendars. Rejected.

**The 4 duration-bucket calendars:**

| Calendar | Slot length | Routes (with real catalog durations) | Booking mode |
|---|---|---|---|
| **Quick** (~2h) | 2h + buffer | Exterior `⟨dur?⟩`, Tint Coupe/Sedan (80–90m), Paint 1-Step (2–2.5h), Headlight, small add-ons | instant |
| **Standard** (~4h) | 4h + buffer | Interior `⟨dur?⟩`, Full Clean&Protect (2–4h), Tint SUV (~2h), Paint 2-Step (4–4.5h), Ceramic 1-Yr Coupe/Sedan (3–4h), Maintenance visits | instant |
| **Half/Full-Day** (~6–8h) | 6–8h + buffer | Full Deep Clean (4–6h), Paint 3-Step (6–6.5h), Ceramic 1-Yr large (5–6h) | instant OR request |
| **Multi-Day** | 1–2 days, consecutive block | Ceramic 5-Yr & 8-Yr (1–2 days), large RV/Boat | **request/approve only** |

The **website computes total duration** (base package duration by size + sum of add-on durations) and **routes to the correct calendar** before querying availability. Business hours **7 AM–7 PM, 7 days**. Buffers: +30 min cleanup, + travel time by ZIP.

---

## 4. BOOKING ARCHITECTURE (website flow)

11 steps. Each row: what's collected → where it lands in GHL.

| # | Step | Data collected | GHL destination |
|---|---|---|---|
| 1 | Vehicle | year, make, model, type, color | Contact custom fields |
| 2 | Vehicle size | size class | Contact field + drives pricing/duration |
| 3 | Service | primary service | Opportunity name + tag |
| 4 | Package | package/tier | Opportunity + custom field |
| 5 | Add-ons | selected add-ons | Custom field + appointment notes + price |
| 6 | Condition Qs | conditional (dirt/pet hair/paint defects…) | Vehicle Condition field + appointment notes; can flag manual review |
| 7 | Review summary | server-recomputed quote | (nothing yet — display only) |
| 8 | Appointment | date/time from GHL calendar | Appointment (on submit) |
| 9 | Customer info | name, phone, email, address, consents | Contact create/update + consents |
| 10 | Deposit/payment | deposit or none | Payment/Invoice + field |
| 11 | Confirmation | — | Confirmation page + workflow fires |

**Data routing rules:**
- **Create/update contact:** name, phone, email, address, consents, all vehicle fields, lead source, UTM.
- **Attach to opportunity:** service, package, add-ons, estimated price, deposit, balance, pipeline stage.
- **Appointment notes:** condition answers, add-ons, access notes (water/power/workspace), special requests — the tech-facing summary.
- **Trigger workflow:** on submit (see §6).

---

## 5. PRODUCT → CALENDAR → WORKFLOW → PIPELINE → PAYMENT MATRIX

| Service → Package | Product | Calendar | Booking mode | Workflow | Pipeline stage on submit | Payment |
|---|---|---|---|---|---|---|
| Exterior → Wash/Clay/Seal | Exterior Detail | Quick | instant | Booking Confirm | Appointment Booked | none (pay after) |
| Interior → Clean&Protect | Interior Detail | Standard | instant | Booking Confirm | Appointment Booked | none |
| Interior → Deep Clean | Interior Detail | Standard/Half | instant | Booking Confirm | Appointment Booked | none |
| Full → Clean&Protect | Full Detail | Half-Day | instant | Booking Confirm | Appointment Booked | none |
| Full → Deep Clean | Full Detail | Half/Full-Day | instant | Booking Confirm | Appointment Booked | none |
| Window Tint → Std/Ceramic | Window Tint | Standard | instant | Booking Confirm | Appointment Booked | none |
| Ceramic → 1-Year | Ceramic Coating | Full-Day | request | Coating Request | Quote Requested | **deposit** |
| Ceramic → 5/8-Year | Ceramic Coating | Multi-Day | request | Coating Request | Quote Requested | **deposit** |
| Paint Enhancement | Paint Enhancement | Full-Day | request | Quote Request | Quote Requested | deposit |
| Paint Correction | Paint Correction | Multi-Day | request | Quote Request | Quote Requested | deposit |
| RV/Boat/Motorcycle | Specialty | Full/Multi | request | Quote Request | Quote Requested | deposit |
| Maintenance | Maintenance Program | Standard (recurring) | instant | Membership | Maintenance Member | first payment |
| Add-ons | (line items) | inherits base | — | (none of their own) | — | with base |

---

## 6. PRODUCT → WORKFLOW MAPPING

| Workflow | Trigger | Applies to | Key actions |
|---|---|---|---|
| **Booking Confirm** | appointment booked (instant services) | Exterior, Interior, Full, Tint, Headlight | confirm SMS+email, notify Carlos + tech, prep instructions, stage → Appointment Booked |
| **Coating Request** | ceramic request submitted | Ceramic | notify Carlos to confirm date, deposit link, stage → Quote Requested, aftercare later |
| **Quote Request** | quote-only submit | Paint Enh/Corr, RV/Boat/Moto | notify Carlos, follow-up task, stage → Quote Requested |
| **Membership** | maintenance purchased | Maintenance | recurring billing, recurring appointment reminders, member tag |
| **Payment Confirm** | deposit/payment received | any with payment | receipt, update balance, stage advance |
| **Reminders** | upcoming appointment | all booked | 24h + 2h SMS |
| **Abandoned Booking** | started, not completed | all | resume-link nudge, stop on completion |
| **Missed-Call Text-Back** | missed inbound call | — | instant SMS |
| **Review Request** | completed + paid | all | Google review ask |
| **Ceramic Aftercare** | ceramic complete | Ceramic | cure-time + maintenance follow-up, warranty dates |

*(Full trigger/action detail already specced in `../auto-dude-migration/booking-crm/03-automations.md`.)*

---

## 7. CUSTOM FIELD RECOMMENDATIONS

Reuse the set in `../auto-dude-migration/booking-crm/02-crm-fields-pipeline.md` — grouped Contact / Vehicle / Service / Tracking. Architect's additions for this integration:

- `booking_session_id` (text) — idempotency + reconcile the website session with the GHL record.
- `service_area_status` (dropdown: in-area / manual-review / out-of-area).
- `computed_duration_min` (number) — the server's duration calc, so the calendar/tech see the same number.
- `catalog_version` (text) — which pricing version this booking was quoted against (audit trail when prices change).

Everything the customer types maps to a field; nothing is free-floating.

---

## 8. PAYMENT STRATEGY

**Launch = Mode 1 (no upfront payment) for instant services** — matches the site's "PAY NOTHING UNTIL WE ARRIVE" promise and removes the riskiest dependency (see R4 in `00-TECHNICAL-PLAN.md`).

| Phase | Instant services | Request services (Ceramic/Correction/RV) | Maintenance |
|---|---|---|---|
| **Launch** | no upfront pay → GHL invoice / on-site POS after | deposit link **sent by Carlos** after confirming (manual, reliable) | first payment via GHL subscription |
| **Phase 2** | optional deposit at booking | deposit collected in-flow | as launch |

Provider decision still open (GHL Payments / Stripe-via-GHL / Stripe direct). Build the payment step behind a `PaymentProvider` interface so the mode switches without touching the wizard.

## 9. DEPOSIT STRATEGY

- **Instant, lower-value (Exterior/Interior/Full/Tint):** no deposit at launch. Low no-show risk for mobile jobs booked days out; friction reduction wins.
- **High-value / long (Ceramic, Paint Correction, RV):** **deposit required** — these block hours-to-days of capacity; a deposit protects against no-shows. Collect **after** Carlos confirms the slot (request flow), not at form submission, so a tentative request never charges a card.
- **Deposit amount:** fixed per service tier (from the real catalog once available), stored on the product; remaining balance tracked in `remaining_balance` and collected on completion.

---

## 10. WEBSITE INTEGRATION PLAN (per step)

All GHL calls are **server-side** (route handlers). Endpoints reference GHL API v2. Server is authoritative for price + duration + availability.

| Step | Data | GHL object updated | Server route → GHL call | Workflow | Payment | Customer sees |
|---|---|---|---|---|---|---|
| 1–2 Vehicle+size | vehicle, size | (session only) | `PATCH /api/booking/session` | – | – | live-updating summary |
| 3–5 Service/pkg/add-ons | selections | (session) | `POST /api/quote` (server recompute) | – | – | price + duration estimate |
| 6 Condition | answers | (session) | `PATCH /api/booking/session` | – | – | tailored questions |
| 7 Review | — | – | (display) | – | – | full summary |
| 8 Appointment | slot | – (validated) | `GET /api/availability` → GHL free-slots (cached) | – | – | real open times |
| 9 Customer | contact + consents | **Contact** create/update | `POST /api/booking/submit` → GHL contacts + custom fields | – | – | — |
| 8→ commit | appointment | **Appointment** | submit → GHL calendar event | Booking Confirm / Request | – | — |
| — | opportunity | **Opportunity** + stage | submit → GHL opportunities | (stage set) | – | — |
| 10 Payment | deposit/none | **Invoice/Payment** | submit → GHL payments (or deferred link) | Payment Confirm | deposit or none | receipt (if paid) |
| 11 Confirm | — | (session → confirmed) | `GET /api/booking/[ref]` | — | — | confirmation page + SMS/email |

**Idempotency:** `booking_session_id` as the key on `/api/booking/submit`; re-submits return the original result. **Availability re-checked immediately before appointment creation**; on conflict return `SLOT_TAKEN`, refresh picker.

---

## 11. CRM DATA FLOW DIAGRAM

```
                        WEBSITE (Next.js, client)
   Vehicle→Size→Service→Package→Add-ons→Condition→Review→Slot→Customer→Pay
                          │  (only session PATCHes + quote)
                          ▼
              SERVER ROUTE HANDLERS (Vercel, hold GHL token)
        authoritative price · authoritative duration · availability cache
                          │  POST /api/booking/submit  (idempotent)
                          ▼
        ┌─────────────── GoHighLevel (API v2) ───────────────┐
        │ 1 Contact  ── create/update + custom fields         │
        │ 2 Appointment ── correct duration-bucket calendar   │ ◄─ COMMIT POINT
        │ 3 Opportunity ── pipeline stage by booking mode     │
        │ 4 Tags ── service-*, lead-website, booking-*        │
        │ 5 Payment/Invoice ── deposit or deferred            │
        │ 6 Workflow ── Booking Confirm | Coating/Quote Req   │
        └─────────────────────────────────────────────────────┘
                          │  workflow actions
          ┌───────────────┼───────────────┬──────────────┐
          ▼               ▼               ▼              ▼
     Customer SMS    Customer email   Carlos alert   Tech assignment
     (confirm/       (prep, receipt)  (internal)     (calendar)
      reminders)
                          │  later lifecycle
                  Review Request → Maintenance Offer → Ceramic Aftercare
```

If any step **after #2 (appointment)** fails, the booking still stands; the failure is queued/logged and flagged internally — the customer is never shown a broken state.

---

## 12. RECOMMENDED GHL SETUP CHECKLIST

**Custom fields** — create the Contact/Vehicle/Service/Tracking set + the 4 architect additions (§7).
**Pipeline** — one "Auto Dude Booking" pipeline; stages per `booking-crm/02`.
**Tags** — service-*, lead-website, booking-started/abandoned, deposit-paid, confirmed, member, coating-customer.
**Calendars** — 4 duration buckets (Quick/Standard/Half-Full/Multi-Day); hours 7–7; buffers; team members as technicians.
**Products** — ~9 base (size = price variant) + ~14 add-on line items; recurring product for Maintenance.
**Payments** — connect provider; configure deposits on high-value products; default instant services to no-upfront.
**Workflows** — the 10 in §6.
**Private Integration Token** — scopes: contacts, calendars, events, opportunities, workflows, payments, locations (r/w as needed). Store in Vercel env.
**Test sub-account** — build + validate everything here before touching production.

## 13. RISKS & RECOMMENDATIONS

| # | Risk | Mitigation |
|---|---|---|
| R1 | **No Auto Dude Notion access** → provisional pricing | Share the page with the integration; replace §1–§2. Architecture unaffected. |
| R2 | Fixed GHL slot vs dynamic duration | Duration-bucket calendars + request flow for long jobs (§3). |
| R3 | Multi-day services don't fit a slot | Request/approve, never instant-book. |
| R4 | Payments = weakest GHL API area | Launch Mode 1; provider behind an interface. |
| R5 | Custom fields addressed by ID | Fetch + map programmatically; fail loudly if missing. |
| R6 | Variant drift (GHL price ≠ site price) | **Site is pricing brain**; server passes resolved amount; GHL products mirror for invoices. |
| R7 | Double-book race | Re-check availability at commit; `SLOT_TAKEN`. |
| R8 | Duplicate submit | Idempotency via `booking_session_id`. |
| R9 | Timezone/DST | Store UTC, render America/Chicago. |
| R10 | Two businesses conflated | Never apply 5280 pricing to Auto Dude (mobile-only, separate catalog). |

## 14. IMPLEMENTATION ROADMAP

| Phase | Work | Gate |
|---|---|---|
| **0. Unblock data** | ✅ Catalog received (`03-PRICING-CATALOG.md`). **Remaining:** confirm maintenance schedule label, interior/exterior durations, large-truck class, tax, deposit amounts (catalog §11) | mostly done |
| **1. GHL foundation (test sub-account)** | Custom fields, pipeline, tags, 4 calendars, ~23 products, PIT | Setup checklist §12 |
| **2. Pricing + catalog engine** | Typed catalog config (mirrors GHL products), server quote + duration + calendar routing, unit tests | Phase 0 |
| **3. Booking UI (mock)** | 11-step wizard, order summary, states — labelled prototype | – |
| **4. GHL integration** | Contact/appointment/opportunity/workflow orchestration, availability proxy+cache, idempotency, error taxonomy | 1,2 |
| **5. Payments** | Mode 1 live; deposit scaffolding for request services | provider decision |
| **6. QA + launch** | E2E, a11y, load, security (tampered-payload test), UAT in test sub-account → cutover | Phase 4 |

**Critical path = Phase 0.** Everything downstream is designed; it waits on the authoritative catalog and a GHL test sub-account.

---

### What I need to finalize this blueprint into build-ready spec
1. ✅ **Pricing catalog** — received (`03-PRICING-CATALOG.md`).
2. **Maintenance schedule label** — Bi-Monthly vs Bi-Weekly (blocks maintenance products).
3. **Interior & Exterior durations** — for calendar bucketing.
4. **Large/HD-truck class** decision (catalog §0 ambiguity).
5. **Deposit amounts** per request service.
6. **Tax treatment** (inclusive? TX detailing taxable? rate?).
7. **GHL test sub-account** + location ID.

With #2–#6 the pricing/product layer locks; with #7 the integration layer can be built and tested. The vehicle-class standardization (catalog §0) is the one design decision Carlos should sign off on before products are created.
