# Auto Dude — GoHighLevel Pre-Build Requirements Checklist

**Purpose:** everything to create/configure in GHL **before** website code starts. Source of truth = `03-PRICING-CATALOG.md`.

**Confirmed:** Deposit **$50 flat** · **No tax** · Launch payment = deposit-only for request services, pay-after for instant services.
**Not yet confirmed (see Deliverable 2):** maintenance schedule label · interior/exterior durations · large-truck class · GHL test sub-account + Location ID.

> **Build all of this in a TEST sub-account first.** Do not touch production until validated.

---

# DELIVERABLE 1 — GHL BUILD CHECKLIST

## A. PRODUCTS

**Rule:** vehicle size = **price variant** inside a product (not separate products). Each *package* is its own product. **No full payment is charged online at launch** — instant services are pay-after (invoice/POS); request services collect the **$50 deposit only**. Website stores product ID + price/variant ID for every product (to record the booked line item and compute the balance), and the **deposit payment link** for request services.

**Legend:** Online = bookable online · Dep = $50 deposit at booking · Pay = what's charged online now · Needs = IDs the website needs.

### Base products (14)

| # | Product | Category | Type | Price variants (size) | Online | Dep | Pay online | Needs |
|---|---|---|---|---|---|---|---|---|
| 1 | Exterior — Wash, Clay & Seal | Detailing | one-time | Coupe/Sedan $130 · SUV/Truck $140 · Large/3-Row $155 | ✅ | no | none (pay after) | product+price IDs |
| 2 | Interior — Clean & Protect | Detailing | one-time | $225 · $275 · $300 | ✅ | no | none | product+price IDs |
| 3 | Interior — Deep Clean | Detailing | one-time | $325 · $375 · $400 | ✅ | no | none | product+price IDs |
| 4 | Full — Clean & Protect | Detailing | one-time | $300 · $350 · $400 | ✅ | no | none | product+price IDs |
| 5 | Full — Deep Clean | Detailing | one-time | $400 · $450 · $500 | ✅ | no | none | product+price IDs |
| 6 | Window Tint — Standard | Glass | one-time | Coupe/Compact $349 · Sedan $399 · Truck $449 · Mid-SUV $449 · Large/Full-SUV $549 | ✅ | no | none | product+price IDs |
| 7 | Window Tint — Ceramic | Glass | one-time | $499 · $549 · $599 · $599 · $699 | ✅ | no | none | product+price IDs |
| 8 | Ceramic — 1-Year | Protection | one-time | Coupe/Sedan $449 · Mid $549 · Large $649+ | request | **✅** | $50 deposit | product+price IDs + deposit link |
| 9 | Ceramic — 5-Year | Protection | one-time | $999 · $1,149 · $1,399+ | request | **✅** | $50 deposit | product+price IDs + deposit link |
| 10 | Ceramic — 8-Year | Protection | one-time | $1,599 · $1,899 · $2,199+ | request | **✅** | $50 deposit | product+price IDs + deposit link |
| 11 | Paint Correction — 1-Step | Protection | one-time | $325 · $350 · $375 | request | **✅** | $50 deposit | product+price IDs + deposit link |
| 12 | Paint Correction — 2-Step | Protection | one-time | $625 · $650 · $675 | request | **✅** | $50 deposit | product+price IDs + deposit link |
| 13 | Paint Correction — 3-Step | Protection | one-time | $925 · $950 · $975 | request | **✅** | $50 deposit | product+price IDs + deposit link |
| 14 | Maintenance Program | Membership | **recurring** | 9 variants (3 freq × 3 size) — **HOLD** until schedule label confirmed | ✅ | first pmt | subscription | product+price IDs |

### Deposit product (1) — universal

| # | Product | Type | Price | Notes |
|---|---|---|---|---|
| 15 | **$50 Booking Deposit** | one-time | $50.00 | **ONE universal deposit product + ONE payment link.** Do NOT make per-service deposits. Applied to every request service; balance tracked in a custom field and collected on completion. |

### Add-on line items (~28) — NOT independently bookable

Create as products flagged internally as add-ons; selectable only inside a base booking. Website needs product+price IDs to add them as line items (for the balance calc), not payment links.

- **General (13):** Clay Bar & Decon `$60–100` · Interior Ceramic Treatment `$125–175` · Black Trim Restoration `$50–150` · Headlight Restoration (each) $55 · Engine Bay Small $50 · Engine Bay Large $75 · Carpet Shampoo+Steam $75 · Seat Shampoo+Steam $75 · Stain Spot Removal `$40+` · Pet Hair Light $45 · Pet Hair Heavy $90 · Odor/Ozone $75 · Child Car Seat $30
- **Tint add-ons (4, each 2 film prices):** Brow/Visor $75/$99 · Full Windshield $279/$349 · Sunroof $99/$129 · Individual Window $59/$90 → model each as one product with a **film variant** (Standard/Ceramic)
- **Tint removal (3):** Per Window $35 · Rear Window $109 · Full Vehicle $189
- **Ceramic add-ons (5):** Interior Ceramic `$125–175` · Glass Shield `$75–150` · Wheel Ceramic `$100–350` · 1-Stage Enhancement $200 · 2-Stage Enhancement $400
- **Maintenance add-ons (3):** Pet Hair `$20–40` · Odor Neutralizer $25 · 3-Month Ceramic Topper $45

> **Ranged prices (`$X–$Y`, `$X+`):** create the product at the **low value** and mark it "from" — the website shows "from $X" and routes those selections to review; final amount set manually. Never charge a range at online checkout.

**Total: ~15 base/deposit products + ~28 add-on line items.** (vs 60+ if size were a product axis.)

## B. CALENDARS

**Recommendation: 4 calendars by DURATION BUCKET, not one per service.** A "Full Detail + 3 add-ons" never fits a fixed per-service slot; duration buckets do. Technicians are **calendar team members**, not separate calendars. All calendars: **mobile** (service at customer address), hours **7 AM–7 PM, 7 days**, buffer **+30 min cleanup + travel time**.

| Calendar | Slot | Services routed | Buffer | Team | Mobile | Website needs |
|---|---|---|---|---|---|---|
| **AD — Quick (~2h)** | 2h | Exterior, Tint Coupe/Sedan, Paint 1-Step, Headlight, small add-on jobs | 30m + travel | Carlos + techs | ✅ | calendar ID |
| **AD — Standard (~4h)** | 4h | Interior (both), Full Clean&Protect, Tint SUV, Paint 2-Step, Ceramic 1-Yr Coupe/Sedan, Maintenance visits | 30m + travel | Carlos + techs | ✅ | calendar ID |
| **AD — Half/Full-Day (6–8h)** | 6–8h | Full Deep Clean, Paint 3-Step, Ceramic 1-Yr large | 30m + travel | Carlos + techs | ✅ | calendar ID |
| **AD — Multi-Day (request)** | 1–2 days block | Ceramic 5-Yr & 8-Yr, large RV/Boat | manual | Carlos | ✅ | calendar ID |

The **website computes total duration** (base by size + add-on durations) and routes to the correct calendar before querying availability. **Separate by duration, not service** — 4 calendars stay manageable; 10 service calendars would still not solve the add-on duration problem.

## C. FORMS & SURVEYS

Two GHL forms cover everything; the rest are sections within them.

**Form 1 — Quote Request** (final-CTA form on every marketing page): first name, last name, email, phone, vehicle year, make, model, canonical vehicle size, requested service, service address, city, ZIP, preferred contact method, notes, SMS consent, email consent.

**Form 2 — Booking Details** (Step 5 of the wizard): first name, last name, email, phone, preferred contact method, service street/city/state/ZIP, access instructions, gate code, water access (checkbox), power access (checkbox), workspace confirmed (checkbox), special requests, **deposit acknowledgment (checkbox, request services only)**, SMS consent, email consent, terms accepted, privacy accepted.
**Hidden fields on Form 2:** vehicle size, selected service, selected package, selected add-ons, estimated price, deposit amount, remaining balance, computed duration, booking_session_id, page URL, UTM source/medium/campaign/content.

**Vehicle condition** = conditional question set inside the wizard (Step 6), written to the Vehicle Condition field + appointment notes — not a separate GHL form.
**Add-ons** = wizard step, not a form.
**Deposit acknowledgment & Terms/Consent** = checkboxes within Form 2.

## D. CUSTOM FIELDS

| Field | GHL type |
|---|---|
| Vehicle Year | Number |
| Vehicle Make | Single line |
| Vehicle Model | Single line |
| Vehicle Type | Dropdown (Coupe, Sedan, Truck, SUV, Minivan, Van, RV, Boat, Motorcycle, Other) |
| Vehicle Size (canonical) | Dropdown (Coupe/Compact, Sedan, Truck, Mid-Size SUV, Large SUV, Oversized) |
| Selected Service | Dropdown (service list) |
| Selected Package | Single line |
| Selected Add-Ons | Multi-select (or Text area) |
| Vehicle Condition | Text area |
| Service Address | Single line / Address |
| City | Single line |
| ZIP Code | Single line |
| Deposit Amount | Monetary |
| Remaining Balance | Monetary |
| Estimated Price | Monetary |
| Appointment Date | Date |
| Appointment Time | Single line (or Date/time) |
| Computed Duration (min) | Number |
| Maintenance Eligibility | Dropdown (Eligible, Not eligible, Member) |
| Tint Film Type | Dropdown (Standard, Ceramic) |
| Tint Removal Required | Dropdown (None, Per-window, Rear, Full) |
| Paint Correction Level | Dropdown (1-Step, 2-Step, 3-Step) |
| Ceramic Coating Term | Dropdown (1-Year, 5-Year, 8-Year) |
| Preferred Contact Method | Dropdown (Call, Text, Email) |
| Lead Source | Dropdown (Website, Google, Referral, Repeat, Ads) |
| Booking Session ID | Single line |
| Service Area Status | Dropdown (In-area, Manual-review, Out-of-area) |
| Catalog Version | Single line |
| SMS Consent | Checkbox |
| Email Consent | Checkbox |

## E. PIPELINE & OPPORTUNITIES

**One pipeline: "Auto Dude Booking."** Stages:

| Stage | When |
|---|---|
| New Lead | quote form / booking started |
| Quote Requested | **quote-required services submitted** (Ceramic, Paint Correction, RV/Oversized) |
| Booking Started | wizard begun, not finished |
| Booking Abandoned | **abandoned bookings** (started, no completion after timeout) |
| Appointment Booked | **used after booking** (instant services) |
| Deposit Paid | **used after $50 deposit received** |
| Confirmed | Carlos confirmed (request services) / reminders active |
| In Service | job started |
| Service Completed | **used after appointment completion** |
| Payment Complete | balance collected |
| Review Requested | review workflow fired |
| Maintenance Member | subscription active |
| Lost / Not Qualified | closed-no / out of area |

## F. WORKFLOWS

| Workflow | Recommended trigger |
|---|---|
| New Booking Confirmation | Appointment created (instant services) |
| Deposit Received | Payment received = $50 deposit product |
| Appointment Reminder | 24h and 2h before appointment |
| Internal Booking Notification | Appointment created OR quote request submitted → notify Carlos/tech |
| Abandoned Booking | Booking Session updated to `booking-started`, no `confirmed` after 1h |
| Manual Quote Request | Form 2 submitted with a request-service tag |
| Appointment Reschedule | Appointment date/time changed |
| Appointment Cancellation | Appointment status = cancelled |
| Service Completed | Opportunity → Service Completed (manual or on job-done) |
| Review Request | Service Completed + Payment Complete → wait, then send |
| Maintenance Follow-up | Qualifying service completed → offer plan; and recurring member reminders |
| Ceramic Coating Aftercare | Ceramic opportunity marked complete |
| Window Tint Aftercare | Tint appointment marked complete (e.g. "don't roll windows down 3–5 days") |

All SMS respect consent + business hours (queue outside 7 AM–7 PM).

## G. PAYMENTS

**Configuration:**
- **$50 deposit → ONE universal "$50 Booking Deposit" product + ONE payment link/checkout.** Not per-service. Used by all request services. → website needs the **deposit product ID + price ID** (charge via API) **or** the **hosted payment link URL** (redirect). Recommend the hosted link for launch reliability.
- **No tax:** set product tax to 0 / disable tax; confirm no location-level default tax is applied. Verify a test checkout shows `$50.00`, no tax line.
- **Remaining balance:** tracked in the `Remaining Balance` field; collected on completion via GHL invoice or on-site POS — **not** auto-charged online at launch.
- **Payment links:** **1** (deposit) + Maintenance subscription checkout. Instant services need **no** payment link at launch.
- **Receipts:** GHL auto-receipt on successful payment — enable.
- **Failed payments:** deposit failure → opportunity stays "Booking Started / pending deposit," no appointment confirmed; subscription failure → GHL dunning/retry.
- **Refunds / cancellations:** manual in GHL per the cancellation policy; deposit refundability is a policy/terms decision (flag for Carlos).

**Answers to your explicit questions:**
- One universal $50 deposit product? **YES.**
- Separate deposit products per service? **NO.**
- One payment link? **YES** (deposit) — plus the maintenance subscription checkout.
- Multiple payment links? **NO** for deposits.
- Product IDs / Price IDs / Checkout links? **All three exist**; website uses **deposit product+price ID** (or its hosted **checkout link**) for deposits, and **product+price IDs** for every base/add-on product to record line items and compute the balance.

## H. WEBSITE INTEGRATION IDs & LINKS — WHEN EACH IS NEEDED

| Item | Required before |
|---|---|
| **GHL Location ID** | **coding** |
| **Private Integration Token** (scopes: contacts, calendars, events, opportunities, workflows, payments, locations) | **coding** |
| Custom-field IDs (all of §D) | **booking integration** (or let me fetch them via API once token exists) |
| Calendar IDs (4) | **booking integration** |
| Pipeline ID + all stage IDs | **booking integration** |
| Product IDs + Price/variant IDs (all base + add-ons) | **booking integration** |
| $50 Deposit product ID + price ID **or** hosted payment link | **booking integration** |
| Form IDs (Quote Request, Booking Details) | **booking integration** |
| Survey IDs (if any surveys used) | booking integration (n/a if none) |
| Workflow IDs (the 13) | **testing** (wire triggers) |
| Calendar embed links | testing (only if embedding GHL calendar UI; the custom flow uses the API instead) |
| Booking confirmation URL (`/booking-confirmed/`) | testing |
| Cancellation URL · Reschedule URL | testing |
| Maintenance subscription checkout link | testing (maintenance flow) |
| Domain / subdomain + DNS access | **launch** |
| GA4 / GTM / Meta Pixel / Ads IDs | **launch** |

**Note:** with the Location ID + token, I can **fetch most IDs programmatically** (custom fields, calendars, pipeline, products) — you don't have to copy them all by hand. The must-provide-by-hand items are the **Location ID, token, deposit payment link, and domain/DNS**.

---

# DELIVERABLE 2 — MISSING DECISIONS (true blockers only)

1. **Maintenance schedule label** — Bi-Monthly vs Bi-Weekly. *Blocks: Maintenance product #14, Maintenance workflow.*
2. **Interior Clean & Protect duration.** *Blocks: calendar routing for that service.*
3. **Interior Deep Clean duration.** *Blocks: calendar routing.*
4. **Exterior Wash, Clay & Seal duration.** *Blocks: calendar routing (Quick vs Standard).*
5. **Large/HD truck classification & price** — does a full-size/HD truck price as Mid tier, or route to Oversized/quote? *Blocks: vehicle-size mapping in the catalog config.*
6. **GHL test sub-account access + Location ID + Private Integration Token.** *Blocks: all integration work.*

**Additional true blockers I identify:**
7. **Payment provider connected in the sub-account** (Stripe/GHL Payments) — without it, no deposit link can be created. *Blocks: deposit + maintenance.*
8. **Deposit refund policy wording** — needed for the deposit acknowledgment checkbox and cancellation workflow. *Blocks: Form 2 legal text + cancellation flow.*
9. **Technician roster** (who, how many) — needed to set calendar availability/assignment even if just "Carlos" for now. *Blocks: realistic calendar availability.*

Everything else (analytics IDs, domain, final copy tweaks) can be configured later and does **not** block the build.

---

# DELIVERABLE 3 — RECOMMENDED SETUP ORDER

1. **Confirm the 9 blockers** in Deliverable 2 (especially 1, 5, 6, 7).
2. **Connect the payment provider** in the test sub-account; verify no-tax.
3. **Create custom fields** (§D) — do this first so forms/products can reference them.
4. **Create the pipeline + stages** (§E).
5. **Create products** (§A): 14 base + $50 deposit + add-ons. Set price variants by size. Confirm no tax on each.
6. **Create the $50 deposit payment link.**
7. **Create the 4 duration calendars** (§B); set hours 7–7, buffers, team, availability.
8. **Create the 2 forms** (§C) with hidden fields; map every field to its custom field.
9. **Create the 13 workflows** (§F) with triggers; leave message copy from `booking-crm/03-automations.md`.
10. **Collect / fetch all IDs** (§H) — fill the handoff sheet (Deliverable 4).
11. **Connect the website** (server routes → GHL) and wire the deposit link.
12. **Test end-to-end** in the sub-account (instant book, request+deposit, maintenance, each workflow, tampered-payload rejection).
13. **Launch:** point domain, install tracking, smoke-test, monitor.

---

# DELIVERABLE 4 — FINAL HANDOFF SHEET (fill in and send back)

```text
====================  AUTO DUDE — GHL HANDOFF  ====================
GHL LOCATION ID:
PRIVATE INTEGRATION TOKEN:            (set in Vercel env, just confirm scopes granted)
PAYMENT PROVIDER CONNECTED (Y/N):
DEPOSIT PAYMENT LINK URL:

----  CALENDAR IDS (4 duration buckets)  ----
AD — Quick (~2h):
AD — Standard (~4h):
AD — Half/Full-Day (6–8h):
AD — Multi-Day (request):

----  PRODUCT IDS + PRICE/VARIANT IDS  ----
$50 Booking Deposit:                  product: ______  price: ______
Exterior — Wash, Clay & Seal:         product: ______  prices (S/M/L): __ / __ / __
Interior — Clean & Protect:           product: ______  prices (S/M/L): __ / __ / __
Interior — Deep Clean:                product: ______  prices (S/M/L): __ / __ / __
Full — Clean & Protect:               product: ______  prices (S/M/L): __ / __ / __
Full — Deep Clean:                    product: ______  prices (S/M/L): __ / __ / __
Window Tint — Standard:               product: ______  prices (5 tiers): __/__/__/__/__
Window Tint — Ceramic:                product: ______  prices (5 tiers): __/__/__/__/__
Ceramic — 1-Year:                     product: ______  prices (S/M/L): __ / __ / __
Ceramic — 5-Year:                     product: ______  prices (S/M/L): __ / __ / __
Ceramic — 8-Year:                     product: ______  prices (S/M/L): __ / __ / __
Paint Correction — 1-Step:            product: ______  prices (S/M/L): __ / __ / __
Paint Correction — 2-Step:            product: ______  prices (S/M/L): __ / __ / __
Paint Correction — 3-Step:            product: ______  prices (S/M/L): __ / __ / __
Maintenance Program (HOLD label):     product: ______  prices: ____
Add-on line items:                    (list product+price IDs, or say "fetch via API")

----  FORM IDS  ----
Quote Request:
Booking Details:

----  PIPELINE  ----
Pipeline ID:
Stage IDs:  New Lead: __  Quote Requested: __  Booking Started: __  Booking Abandoned: __
            Appointment Booked: __  Deposit Paid: __  Confirmed: __  In Service: __
            Service Completed: __  Payment Complete: __  Review Requested: __
            Maintenance Member: __  Lost: __

----  WORKFLOW IDS  ----
New Booking Confirmation:         Deposit Received:
Appointment Reminder:             Internal Booking Notification:
Abandoned Booking:                Manual Quote Request:
Appointment Reschedule:           Appointment Cancellation:
Service Completed:                Review Request:
Maintenance Follow-up:            Ceramic Coating Aftercare:
Window Tint Aftercare:

----  CUSTOM FIELD IDS  ----
(Provide, or grant token and I will fetch all of them via the API.)

----  URLS / DOMAIN (launch)  ----
Booking confirmation URL:
Cancellation URL:
Reschedule URL:
Maintenance subscription checkout link:
Production domain / subdomain:
DNS access (who/where):
GA4 / GTM / Meta Pixel / Ads IDs:
===================================================================
```

---

**I will not begin website code until this checklist is built and the handoff sheet (at minimum: Location ID, token, payment provider, deposit link, calendar/pipeline/product IDs) is returned.** With the Location ID + token I can fetch most IDs myself, so your hand-entry is minimal.
