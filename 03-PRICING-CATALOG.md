# Auto Dude — Authoritative Pricing Catalog & Vehicle-Class Model

**Source:** Auto Dude Notion "Services and Pricing" (provided 2026-07-24). **This file is the single source of truth** for the website catalog config and GHL products. When these disagree with anything else, this wins.

**Two items are NOT final — do not build them in GHL until confirmed:**
1. **Maintenance schedule label** — Notion says "Bi-Monthly," internal notes suggest "Bi-Weekly"/weekly. Confirm with Carlos.
2. **Interior & Exterior durations** — not listed in Notion. Provisional values below are marked `⟨dur?⟩`; confirm for calendar slot sizing.

---

## 0. THE VEHICLE-CLASS PROBLEM (must resolve before build)

Each service defines sizes differently:

| Service | Size tiers used |
|---|---|
| Window Tint | Coupe/Compact · Sedan · Mid-Size SUV · Full-Size SUV · **Truck (flat, size-agnostic)** — 5 |
| Ceramic, Paint Correction, Interior, Full, Maintenance | Coupe/Sedan · Mid-Size SUV/Truck · Large SUV/Truck — 3 |
| Exterior | Coupe/Sedan · SUV/Truck · Large SUV/3-Row — 3 (different labels) |

A customer picks their vehicle **once**, early in the flow — so we need **one canonical picker** that can price *every* service. Window Tint forces the finer granularity (it's the only service that separates Coupe from Sedan, and prices trucks flat regardless of size).

### ✅ Recommended canonical picker — 5 classes + Oversized

The customer sees these 6 options:

1. **Coupe / Compact**
2. **Sedan**
3. **Truck** (any pickup)
4. **Mid-Size SUV** (2-row)
5. **Large SUV** (3-row / full-size)
6. **Oversized / Specialty** → manual quote (dually, lifted XL, RV, boat, motorcycle)

### The per-service mapping (the catalog holds this table)

| Customer picks | → Window Tint tier | → 3-class services* | → Exterior tier |
|---|---|---|---|
| Coupe / Compact | Coupe/Compact | Coupe/Sedan | Coupe/Sedan |
| Sedan | Sedan | Coupe/Sedan | Coupe/Sedan |
| Truck | Truck | Mid-Size SUV/Truck | SUV/Truck |
| Mid-Size SUV | Mid-Size SUV | Mid-Size SUV/Truck | SUV/Truck |
| Large SUV | Full-Size SUV | Large SUV/Truck | Large SUV/3-Row |
| Oversized/Specialty | quote | quote | quote |

*3-class services = Ceramic, Paint Correction, Interior, Full, Maintenance.

**Why this works:** every price in the catalog is reachable from one of the 6 picks. The finer tint split (Coupe vs Sedan) and the flat-truck tint quirk are both preserved; the coarser 3-class services just roll up.

### ⚠ One ambiguity for Carlos to confirm

A **full-size / heavy-duty truck** (F-250, dually): the 3-class services have a "Large SUV/Truck" tier, but the canonical "Truck" pick maps to the mid tier. **Decision needed:** do standard pickups always price as mid-tier (recommended — simplest), and only genuinely oversized trucks route to "Oversized/manual quote"? Or add a 6th "Large/HD Truck" class? Recommend the former; flag XL trucks to the Oversized path.

---

## 1. WINDOW TINT  *(5-tier pricing; instant-book candidate, or request if complex glass)*

**Standard film**
| Canonical pick | Price | Time |
|---|---|---|
| Coupe/Compact | $349 | 80–90 min |
| Sedan | $399 | 80–90 min |
| Truck | $449 | varies |
| Mid-Size SUV | $449 | ~2 h |
| Large SUV (→Full-Size) | $549 | varies |

**Ceramic film**
| Canonical pick | Price | Time |
|---|---|---|
| Coupe/Compact | $499 | 80–90 min |
| Sedan | $549 | 80–90 min |
| Truck | $599 | varies |
| Mid-Size SUV | $599 | ~2 h |
| Large SUV (→Full-Size) | $699 | varies |

**Tint add-ons** (per film): Brow/Visor Strip $75/$99 · Full Windshield $279/$349 · Sunroof Panel $99/$129 · Individual Window $59/$90
**Tint removal:** Per Window $35 · Rear Window $109 · Full Vehicle $189

---

## 2. CERAMIC COATING  *(request/approve; deposit; long or multi-day)*

| Package | Coupe/Sedan | Mid-Size SUV/Truck | Large SUV/Truck | Time |
|---|---|---|---|---|
| 1-Year Introductory | $449 | $549 | $649+ | 3–6 h |
| 5-Year Pro Hybrid | $999 | $1,149 | $1,399+ | 1–2 days |
| 8-Year Ultra Platinum | $1,599 | $1,899 | $2,199+ | 1–2 days |

**Ceramic add-ons:** Interior Ceramic $125–175 · Glass Shield $75–150 · Wheel Ceramic $100–350 · 1-Stage Enhancement $200 · 2-Stage Enhancement $400
*(`+` and ranges = starting/variable → surface as "from $X" and route to review where ranged.)*

---

## 3. PAINT CORRECTION  *(request/approve; deposit)*

| Package | Coupe/Sedan | Mid-Size SUV/Truck | Large SUV/Truck | Time |
|---|---|---|---|---|
| 1-Step | $325 | $350 | $375 | 2–2.5 h |
| 2-Step | $625 | $650 | $675 | 4–4.5 h |
| 3-Step | $925 | $950 | $975 | 6–6.5 h |

---

## 4. INTERIOR DETAILING  *(instant-book)*

| Package | Coupe/Sedan | Mid-Size SUV/Truck | Large SUV/Truck | Time |
|---|---|---|---|---|
| Clean & Protect | $225 | $275 | $300 | `⟨dur?⟩ ~2–3 h` |
| Deep Clean | $325 | $375 | $400 | `⟨dur?⟩ ~3–4 h` |

## 5. EXTERIOR DETAILING  *(instant-book)*

| Package | Coupe/Sedan | SUV/Truck | Large SUV/3-Row | Time |
|---|---|---|---|---|
| Wash, Clay & Seal | $130 | $140 | $155 | `⟨dur?⟩ ~1.5–2.5 h` |

## 6. FULL DETAIL  *(instant-book)*

| Package | Coupe/Sedan | Mid-Size SUV/Truck | Large SUV/Truck | Time |
|---|---|---|---|---|
| Clean & Protect | $300 | $350 | $400 | 2–4 h |
| Deep Clean | $400 | $450 | $500 | 4–6 h |

---

## 7. GENERAL DETAILING ADD-ONS  *(attach to any base; never sold alone)*

**Enhancement:** Clay Bar & Decon $60–100 · Interior Ceramic Treatment $125–175 · Black Trim Restoration $50–150 · Headlight Restoration (each) $55 · Engine Bay — Small $50 / Large $75
**Problem-solving:** Carpet Shampoo+Steam $75 · Seat Shampoo+Steam $75 · Stain Spot Removal $40+ · Pet Hair — Light $45 / Heavy $90 · Odor/Ozone $75 · Child Car Seat $30
*(Ranges/`+` may increase by size/condition → show "from $X"; flag to review when a range applies.)*

## 8. MAINTENANCE PROGRAM  *(recurring; eligibility-gated)*

⚠ **Do not configure in GHL until the schedule label is confirmed (Bi-Monthly vs Bi-Weekly).** Eligibility: customer must have completed a qualifying Auto Dude service, generally within the prior 30 days.

| Canonical pick | Monthly | Bi-Monthly* | Quarterly |
|---|---|---|---|
| Sedan/Coupe | $150 | $200 | $250 |
| Mid-Size SUV/Truck | $175 | $250 | $300 |
| Large SUV/Truck | $187.50 | $215 | $325 |

`*` label unconfirmed. **Maintenance add-ons:** Pet Hair $20–40 · Odor Neutralizer $25 · 3-Month Ceramic Topper $45

---

## 9. BOOKING CLASSIFICATION (drives the flow)

| Service | Instant book | Request/approve | Deposit | Recurring |
|---|---|---|---|---|
| Exterior · Interior · Full | ✅ | | none (launch) | |
| Window Tint | ✅ (simple) | complex glass → request | none | |
| Ceramic (all tiers) | | ✅ | **yes** | |
| Paint Correction (all) | | ✅ | **yes** | |
| RV/Boat/Motorcycle, Oversized | | ✅ | **yes** | |
| Maintenance | | | first payment | ✅ subscription |
| Add-ons | attach only | | with base | |

## 10. CONSOLIDATION / CLEANUP (answers "identify duplication")

- **Standardize vehicle classes → the 6-class canonical picker** (§0). This is the biggest cleanup and unblocks everything.
- **No duplicated services found** — the eight services are distinct. Interior Ceramic Treatment appears as both a general add-on ($125–175) and a ceramic add-on (same price) — **one add-on, surfaced in two contexts**, not two products.
- **Ranges (`$X–$Y`, `$X+`) are not online-checkout-safe** — for these, show "from $X" and route to review/manual confirm rather than charging a range.
- **Product count with variants:** ~14 base bookable products (size as price variant) + ~28 add-on line items. Base stays lean; add-ons are lightweight modifiers.

## 11. STILL OPEN
1. Maintenance schedule label (Bi-Monthly vs Bi-Weekly) — **blocks maintenance products**.
2. Interior & Exterior durations — needed for calendar bucketing.
3. Large/HD truck classification (§0 ambiguity).
4. Tax treatment (inclusive? TX detailing taxable? rate?).
5. Deposit amounts per request service.
