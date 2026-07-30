# Information Request — Auto Dude Custom Booking Platform

Answer inline or in any format you like. **Legend:** ✅ = I already have this (confirm or correct) · ❓ = I need this · 🔴 = blocking.

---

## 🔐 First: how to handle credentials — do NOT paste secrets in this chat

Chat transcripts are stored. Secrets pasted here should be considered compromised.

**Instead:**
1. Create a **Private Integration Token** in GHL (Settings → Private Integrations) scoped to only what we need.
2. Put it in **Vercel → Project → Settings → Environment Variables** (Preview + Production separately), or in a local `.env.local` that is git-ignored.
3. Tell me only **that it's set** and what scopes you granted. I'll code against `process.env.GHL_PRIVATE_TOKEN`.
4. **Non-secret IDs** (location ID, calendar IDs, pipeline/stage IDs, field IDs, tag names) are safe to share here — I need those.
5. I'll ship a `.env.example` documenting every variable with no real values.

If a secret is ever pasted in chat, rotate it immediately.

---

## 1. GoHighLevel access & integration 🔴

| Item | Status |
|---|---|
| GHL **Location (sub-account) ID** | ❓ |
| **Test/sandbox sub-account** available? | 🔴 ❓ — *I will not touch production until this exists* |
| API access method: **Private Integration Token** (recommended) vs OAuth app | ❓ — PIT is simpler for a single-tenant site; OAuth only if you plan to resell this to other detailers |
| API version — **v2 / LeadConnector** assumed | ❓ confirm |
| Scopes granted to the token | ❓ (need: contacts r/w, calendars r/w, events r/w, opportunities r/w, workflows r, payments r/w, locations r) |
| **Calendar IDs** | ❓ |
| **Pipeline ID** + **stage IDs** | ❓ (I've specced a 17-stage pipeline — reuse or replace?) |
| **Workflow IDs** to trigger | ❓ |
| **Custom field IDs** | ❓ — or grant access and I'll fetch + map them programmatically (preferred, less error-prone) |
| **Tag names** | ✅ proposed in `../auto-dude-migration/booking-crm/02-crm-fields-pipeline.md` — confirm or replace |
| Payment provider connected in GHL | ❓ (see §7) |
| Existing GHL quote form `94MzokSCDZnQikYGllJT` — keep, or fully replace with custom? | ❓ |

**Also:** is there an **existing repo** behind `autodudedetailing.vibepreview.com`? If so, do we continue from it or start clean? (I'd want to see it before deciding.)

---

## 2. Calendar configuration 🔴

🔴 **Blocking decision — please read R1 in `00-TECHNICAL-PLAN.md` first.** GHL calendars have a *fixed* slot duration, but our jobs run 1–2h to multi-day. Pick an approach:
- **(a)** Duration-bucketed calendars (~2h / ~4h / ~6h / full-day) ← *my recommendation*
- **(b)** One calendar + server-side consecutive-slot merging
- **(c)** Instant booking for short services, request/approval for long ones ← *also recommended, combined with (a)*

| Item | Status |
|---|---|
| Which services map to which calendar | ❓ |
| Staff/technicians in GHL (names, count) | ❓ |
| Per-technician availability / skills (e.g. only some do ceramic) | ❓ |
| **Service durations** per package per vehicle size | ❓ (I have rough ranges — need real numbers) |
| **Add-on durations** | ❓ |
| Buffer time between jobs | ❓ (I assumed 30 min) |
| Travel-time rules (flat, or by city/ZIP?) | ❓ |
| Max jobs per day (per tech, and total) | ❓ |
| Minimum booking notice (e.g. no bookings <24h out) | ❓ |
| Maximum booking window (how far ahead?) | ❓ |
| Cancellation rules | ❓ |
| Rescheduling rules | ❓ |
| Multi-day service handling | ❓ (recommend request/approval) |
| Which services require manual approval | ❓ |
| Business hours **7:00 AM – 7:00 PM, 7 days** | ✅ confirm still correct |
| Timezone **America/Chicago** | ✅ confirm |
| Any blackout dates/holidays | ❓ |

---

## 3. Services & pricing 🔴 — THE BIGGEST BLOCKER

**There are two conflicting catalogs and I need one ruling.**

| Live site (I extracted) | Screenshot prototype |
|---|---|
| Wash, Clay & Seal — from **$130** | Express Wash — **$107** |
| Interior Clean & Protect — from **$225** | Signature Detail — **$239** |
| Full Clean & Protect — from **$300** | Premium Full Detail — **$359** |
| Ceramic 1yr **$449–$649**, 5yr **$999**, 8yr top tier | Ceramic Coating Upgrade **+$599** |
| Window Tint — from **$349** | — |
| — | Pet Hair **+$39**, Shampoo Seats **+$79**, Engine Bay **+$59**, Headlight **+$59**, Ozone **+$99** |

These differ in **naming taxonomy**, not just numbers. ❓ **Which is authoritative going forward?**

Then I need **one complete table** with a row per package:

```
Service category | Package name | Price: Coupe/Sedan | Midsize SUV/Truck | Large SUV/Truck | Oversized
| Duration per size | Included items | Exclusions/limitations | "Best for" line | Popular? (ribbon)
| Deposit amount | Full-payment eligible? | Quote-only? | Requires approval?
```

And a row per **add-on**:
```
Add-on name | Description | Price (per vehicle size if it varies) | Added duration
| Applies to which services | Incompatible with
```

Also ❓:
- **Tax** — are prices tax-inclusive? Is detailing taxable in TX for your setup? Rate?
- Which services are **quote-only** (no online price)?
- **Maintenance Program** — plan tiers, prices, billing frequency (this is a subscription, different flow)
- Are displayed prices **final** or **estimates subject to on-site inspection**? (Changes the legal language and the "ESTIMATED" badge behaviour)

---

## 4. Service areas

| Item | Status |
|---|---|
| Cities: New Braunfels, Bulverde, Spring Branch, Canyon Lake, Wimberley, Boerne, Dripping Springs, San Marcos, Seguin | ✅ confirm complete |
| **ZIP code list** per city (authoritative) | ❓ 🔴 — needed for real validation |
| Maximum travel radius from 3121 Westpointe Dr | ❓ |
| **Travel fees** — any, and how calculated? | ❓ |
| Areas requiring **manual approval** (e.g. Austin, San Antonio edges) | ❓ |
| Areas explicitly **not served** | ❓ |
| Address validation preference: **Google Places** (accurate, billable) vs **ZIP list** (free, coarser) | ❓ — and if Google, whose API key/billing? |

---

## 5. Customer fields

For each field: **Required / Optional / Conditional / Internal-only**?

**Contact:** first name, last name, email, phone, preferred contact method, lead source
**Vehicle:** year, make, model, type, size, color, condition
**Address:** street, city, state, ZIP, access instructions, gate code, water access, power access, workspace confirmation, notes
**Booking:** service, package, add-ons, estimated price, deposit, balance, duration, date, time
**Consent:** SMS, email, terms, privacy

❓ Specifically:
- Is **email** required, or is phone-only acceptable?
- Do you want **vehicle condition** questions in the booking flow (I specced a 16-question conditional matrix), or keep booking lean and gather condition later?
- Should customers upload **photos** of the vehicle? (Strongly helps quoting; adds storage + upload handling)
- Exact **GHL custom-field mapping** — or shall I create the fields and hand you the ID map?

---

## 6. Booking rules

- ❓ Can customers **book instantly**, or is everything a request pending confirmation?
- ❓ Which services **require approval** before confirming?
- ❓ Are prices **final** or **estimated**?
- ❓ Can customers **choose a technician**?
- ❓ Can one booking cover **multiple vehicles**? (Significant scope — affects data model)
- ❓ Can customers **combine services** (e.g. full detail + tint same visit)?
- ❓ Should **add-ons extend appointment duration**? (I assume yes)
- ❓ What conditions should trigger **manual review**? (out-of-area, oversized, heavy condition, multi-day, high value?)
- ❓ **When no slots are available** — show waitlist, "request a callback", or next-available-date suggestion?

---

## 7. Payments

- ❓ **Provider:** GHL Payments / Stripe-via-GHL / Stripe direct / NMI / other?
- ❓ **Launch mode:** I recommend **Mode 1 (no upfront payment)** — matches your screenshot copy *"PAY NOTHING UNTIL WE ARRIVE & COMPLETE THE JOB"* and removes the riskiest dependency from launch. Confirm?
- ❓ Deposit rules per service (if/when Mode 2 activates)
- ❓ Which services are eligible for **full online payment**
- ❓ Payment timing (at booking / before arrival / on completion)
- ❓ Cancellation fee · Rescheduling fee · Refund policy
- ❓ Tax settings · Tips · Coupons/promo codes
- ❓ **Membership billing** (maintenance program) — recurring via GHL?
- ❓ Remaining-balance process (invoice? mobile POS on site?)

---

## 8. Legal & consent

| Item | Status |
|---|---|
| Terms of Service copy | ✅ have (`content-final/terms-of-service.md`) — confirm current |
| Privacy Policy copy | ✅ have (`content-final/privacy-policy.md`) — confirm current |
| Cancellation policy | ❓ exact wording |
| Rescheduling policy | ❓ exact wording |
| **SMS consent language** | ❓ 🔴 — must be TCPA-compliant and carrier-approved; needs explicit opt-in wording, message frequency, "msg & data rates apply", STOP/HELP instructions |
| Email consent language | ❓ |
| Payment authorization language | ❓ (when Mode 2/3 activates) |
| Service-access disclaimer (space, water, power, HOA) | ❓ |
| Vehicle-condition disclaimer (pre-existing damage, results not guaranteed) | ❓ |

> ⚠ I'm not a lawyer — I'll implement the wording you provide. Have counsel review the SMS consent and payment authorization language specifically; TCPA violations carry statutory damages per message.

---

## 9. Website & brand assets

| Item | Status |
|---|---|
| WordPress XML export | ✅ have |
| Elementor export | ✅ have |
| Rank Math export | ✅ have |
| Sitemap | ✅ have |
| Redirect list | ✅ have (4 redirects — `schema-redirects/01-redirects.md`) |
| All page content (22 pages) | ✅ have (`content-final/`) |
| Review content (11 Google reviews) | ✅ have — but ❓ should we pull **live** from Google/GHL reviews widget instead of hardcoding? (recommend live) |
| Awards/certifications: Best of San Antonio 2025 (Panda Hub), Chamber of Commerce, Rupes + Stinger certified | ✅ have — confirm accurate |
| Brand colors + fonts | ✅ have (Bebas Neue / Oswald / Montserrat — all Google Fonts, licensing fine) |
| **Logo files** (SVG preferred, light + dark) | ❓ 🔴 |
| **Mascot artwork** (the character in the header) — source file + usage rights | ❓ 🔴 |
| **Photography library** (hero, service, gallery) | ❓ 🔴 |
| **Before/after image pairs** | ❓ |
| Icon set preference | ❓ (I'd default to Lucide) |
| Do you own rights to all photography? | ❓ |

---

## 10. Hosting & deployment

| Item | Status |
|---|---|
| Existing repo (the `vibepreview` prototype)? | ❓ |
| GitHub org / who owns the repo | ❓ |
| Vercel account/team + who pays | ❓ |
| Production domain — `autodudedetailing.com` | ✅ confirm |
| **DNS access** (domain is at Squarespace per the brief) | ❓ 🔴 — needed for cutover |
| Staging domain preference | ❓ (e.g. `staging.autodudedetailing.com`) |
| Who sets environment variables | ❓ |
| GA4 measurement ID | ❓ |
| Google Tag Manager container ID | ❓ |
| Meta Pixel ID | ❓ |
| Google Ads conversion IDs | ❓ |
| Search Console access | ❓ 🔴 — needed to capture a pre-migration baseline |
| Call tracking in use? | ❓ |
| Error monitoring (Sentry?) — recommended | ❓ |

---

## Minimum unblock set

If you only answer a few things, make it these — they unblock the most work:

1. 🔴 **Authoritative pricing/package table** (§3)
2. 🔴 **GHL test sub-account + location ID + token set in Vercel** (§1)
3. 🔴 **Calendar strategy decision** — (a)/(b)/(c) from §2
4. 🔴 **Confirm launch payment mode** = Mode 1, no upfront payment (§7)
5. 🔴 **Logo, mascot, and photography assets** (§9)
6. 🔴 **ZIP code list** for service-area validation (§4)

With 1–4 I can start the pricing engine and GHL integration. With 5 I can build the real UI instead of placeholders. Independently of all of it, I can build the **mock-data booking prototype** right now — just say go.
