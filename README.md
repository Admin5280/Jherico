# Auto Dude Command Center

Internal operations platform for **Auto Dude Mobile Detailing** — New Braunfels, TX.
Inspired by field-service job scheduling & technician workflows, built on the same stack
and conventions as the 5280 Command Center.

**Next.js 14 · TypeScript · Tailwind · Supabase (Auth + Postgres + Storage) · Recharts**

## What it does

- **Admins / Managers** — command-center dashboard, job CRUD, drag-and-drop scheduling with
  conflict detection, technician assignment & availability, customers, maintenance clients,
  lead / marketing / operations reports.
- **Technicians** — a mobile-first app: today's jobs, schedule, guided job workflow
  (En Route → Check In → Pre-Service Inspection → Before Photos → Start → Checklist →
  After Photos → Complete) with a status-driven sticky action bar and completion validation.

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in Supabase keys (optional for demo mode)
npm run dev                    # http://localhost:3000
```

Runs in **open demo mode** as Admin until Supabase env vars are set. See
[`docs/INTEGRATION.md`](docs/INTEGRATION.md) for full setup (schema, seed, auth, webhooks)
and [`docs/TESTING.md`](docs/TESTING.md) for the definition-of-done walkthrough.

## Structure

```
supabase/schema.sql      21 tables · RLS · storage buckets · triggers
supabase/seed.sql        realistic demo data
src/app/(admin)          / jobs schedule leads marketing maintenance customers technicians reports settings
src/app/t/*              technician mobile app (today, schedule, jobs, profile, job workflow)
src/app/api/*            server data + actions (service-role, role-gated)
src/app/api/webhooks/ghl 6 GHL webhook endpoints (prepared, not live)
src/lib/*                data-access modules, auth, permissions, GHL adapter layer
src/components/*         shell, nav, UI primitives, charts, job/photo/schedule components
```

## Data ownership

**GoHighLevel** stays the source of truth for contacts, products, prices, payments, invoices,
opportunities, and bookings. **Supabase** owns technician accounts, availability, job
assignments, execution, checklists, inspections, photos, time tracking, and internal
reporting. Shared records store the GHL external id and are always **upserted** — never
duplicated. GHL webhooks are prepared behind an adapter layer and not connected until real
sample payloads are confirmed.
