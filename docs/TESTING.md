# Auto Dude Command Center — Testing Guide

## Definition-of-Done walkthrough

Run `npm run dev`, then verify the full flow:

### Auth & roles
1. Sign in as **Admin** → lands on `/` (command center). Sidebar shows all pages.
2. Sign in as **Technician** → lands on `/t/today` (mobile app), bottom nav only.
3. A technician who tries to open `/jobs` or `/reports` is redirected to `/t/today`.
4. Technician's `GET /api/jobs` returns only jobs assigned to them.

### Admin job management
5. `/jobs` → **New Job** → pick customer, services, schedule → **Create**. Job appears in the list.
6. Open the job → **Edit** changes save; **Technician Assignment** → assign a tech.
7. Assigning a tech whose window overlaps another job shows the **conflict** dialog with "Assign anyway".
8. The job now shows on that technician's schedule (`/t/schedule`).

### Scheduling
9. `/schedule` → **Day** view: drag a job card from one technician lane to another → reassigns (with conflict guard).
10. **Week** view: drag a job to another day → reschedules; a toast confirms; the activity timeline logs it.

### Technician workflow (as the assigned tech, on `/t/jobs/[id]`)
11. Sticky action bar shows **EN ROUTE** → tap (stores status + timestamp + GPS if allowed).
12. **CHECK IN** → status + check-in time + optional GPS.
13. Fill the **Pre-Service Inspection** → save.
14. Add a **Before Photo** (camera). It uploads (compressed) and appears.
15. **START JOB** → status In Progress; service items marked In Progress.
16. Work the **Service Checklist** — cycle required items to Completed.
17. Add an **After Photo** and after-service notes.
18. **COMPLETE JOB** is blocked until required checklist items + before & after photos exist
    (reasons are listed). Once satisfied, tap it → status Completed, completion time + duration stored.

### Admin verification
19. Back in `/jobs/[id]`, the status is **Completed** and the **Activity Timeline** shows every transition.

### Reports
20. `/maintenance` shows the 5 clients + KPI cards; **Create job** from a visit produces a scheduled job.
21. `/leads`, `/marketing`, `/reports` render KPIs, filters, tables, and charts from seeded data.

---

## Webhook endpoint tests (Phase 6 prep)

With `GHL_WEBHOOK_SECRET=testsecret` in `.env.local`, hit the endpoints locally.

**Unauthorized (no/incorrect secret) → 401:**
```bash
curl -i -X POST http://localhost:3000/api/webhooks/ghl/contact \
  -H "Content-Type: application/json" -d '{"contactId":"c_test_1"}'
```

**Authorized contact upsert → 200 `{ ok, message }`:**
```bash
curl -i -X POST http://localhost:3000/api/webhooks/ghl/contact \
  -H "Content-Type: application/json" \
  -H "x-autodude-webhook-secret: testsecret" \
  -d '{"id":"evt_1","contactId":"c_test_1","firstName":"Test","lastName":"Lead","phone":"(830) 555-9999","city":"New Braunfels"}'
```
→ upserts a `customers` row with `ghl_contact_id = c_test_1`.

**Duplicate delivery (same `id`) → 200 `{ duplicate: true }`:** re-run the exact command above.

**Appointment creates/updates a job:**
```bash
curl -i -X POST http://localhost:3000/api/webhooks/ghl/appointment \
  -H "Content-Type: application/json" \
  -H "x-autodude-webhook-secret: testsecret" \
  -d '{"id":"evt_2","appointmentId":"a_test_1","contactId":"c_test_1","title":"Full Detail","startTime":"2026-08-01T15:00:00Z","address":"1 Test St, New Braunfels TX"}'
```

**Subscription → maintenance client:**
```bash
curl -i -X POST http://localhost:3000/api/webhooks/ghl/subscription \
  -H "Content-Type: application/json" \
  -H "x-autodude-webhook-secret: testsecret" \
  -d '{"id":"evt_3","subscriptionId":"s_test_1","contactId":"c_test_1","planName":"Monthly Maintenance","amount":150,"interval":"month","status":"active"}'
```

Every call is recorded in `webhook_events` with its `processing_status`
(`received` → `processed` / `duplicate` / `invalid` / `unauthorized` / `error`).

> Reminder: raw GHL field names are **placeholders** (`lib/ghl/types.ts`, marked `// CONFIRM`).
> Confirm against real GHL samples before connecting live.

---

## Type & build checks
```bash
npm run typecheck   # tsc --noEmit, no errors
npm run build       # production build succeeds
```
