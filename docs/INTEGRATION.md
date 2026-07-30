# Auto Dude Command Center — Setup & Integration Guide

Internal operations platform for **Auto Dude Mobile Detailing** (New Braunfels, TX).
Next.js 14 · TypeScript · Tailwind · Supabase. GoHighLevel stays the source of truth
for contacts, prices, payments, and bookings; Supabase owns technician accounts, job
execution, scheduling, checklists, inspections, photos, and internal reporting.

---

## 1. Prerequisites

- Node.js 20+ (works on 24)
- A dedicated Supabase project for Auto Dude (separate from 5280)

## 2. Install & configure

```bash
cd auto-dude-app
npm install
cp .env.example .env.local
```

Fill `.env.local` from **Supabase → Project Settings → API**:

| Variable | Where | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | browser (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | browser (safe) |
| `SUPABASE_URL` | Project URL | server only |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key | **server only — never expose** |
| `GHL_WEBHOOK_SECRET` | any strong random string | server only |

> The app runs in **open demo mode** (acts as Admin) when the Supabase env vars are
> absent, so you can explore before wiring auth. Once the vars are present, real
> Supabase Auth + role gating apply.

## 3. Create the database

In **Supabase → SQL Editor**, run in order:

1. `supabase/schema.sql` — 21 tables, indexes, constraints, triggers, RLS, storage buckets
2. `supabase/seed.sql` — demo data (3 techs, 10 customers/vehicles, 8 services, 15 jobs, 5 maintenance clients, 20 leads, 30 days of marketing)

The 4 storage buckets (`job-before-photos`, `job-after-photos`, `job-damage-photos`,
`profile-photos`) are created by `schema.sql`.

## 4. Create demo logins

The seed inserts `profiles` rows but leaves `auth_user_id` NULL. To sign in as each role:

1. **Supabase → Authentication → Users → Add user** (email + password). Suggested:
   - `admin@autodude.local` (Admin)
   - `manager@autodude.local` (Manager)
   - `carlos@autodude.local` (Technician)
2. Copy each new auth user's UUID and link it to the matching profile:

```sql
update public.profiles set auth_user_id = '<auth-uuid>' where email = 'admin@autodude.local';
update public.profiles set auth_user_id = '<auth-uuid>' where email = 'manager@autodude.local';
update public.profiles set auth_user_id = '<auth-uuid>' where email = 'carlos@autodude.local';
```

Now Admin/Manager land on the command center; the technician lands on the mobile app (`/t/today`)
and only sees jobs assigned to them.

## 5. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run typecheck
```

---

## 6. Architecture notes

- **Data access is server-only.** The browser uses Supabase only for the auth login.
  All reads/writes go through `/api/*` routes using the service-role client, gated by
  `requireRole()`. Technician queries are additionally scoped to their own assignments
  in the `*Db.ts` helpers (`listJobs({ technicianId })`, `canAccessJob()`).
- **RLS** is enabled deny-all on every table (defense-in-depth); `auth.uid()`-based
  technician-isolation policies ship in `schema.sql` and become the primary gate if you
  ever expose direct-from-browser queries.
- **Roles:** Admin (full), Manager/Dispatcher (ops, no settings/users), Technician
  (assigned jobs + own schedule/profile only).

---

## 7. GoHighLevel webhooks (prepared, not live)

Six endpoints are ready under `/api/webhooks/ghl/*`:

| Endpoint | Upserts |
|---|---|
| `POST /api/webhooks/ghl/contact` | `customers` (by `ghl_contact_id`) |
| `POST /api/webhooks/ghl/opportunity` | `leads` (by `ghl_opportunity_id`) |
| `POST /api/webhooks/ghl/appointment` | `jobs` (by `ghl_appointment_id`) |
| `POST /api/webhooks/ghl/payment` | job payment status |
| `POST /api/webhooks/ghl/order` | stored (mapping TBD) |
| `POST /api/webhooks/ghl/subscription` | `maintenance_clients` (by `ghl_subscription_id`) |

Every endpoint: verifies the `x-autodude-webhook-secret` header → stores the raw event in
`webhook_events` → dedupes on `(source, external_event_id)` → validates → maps via an
**adapter** (`lib/ghl/adapters.ts`) to a normalized internal object → upserts. The rest of
the app depends only on the normalized types, never on raw GHL fields.

> ⚠ **The raw payload field names in `lib/ghl/types.ts` are placeholders** (every guessed
> field is marked `// CONFIRM`). Before going live, capture real webhook samples from a GHL
> test sub-account and update **only** `types.ts` + `adapters.ts`. Do not connect live GHL
> until the samples are confirmed.

Never store the service-role key in the browser, never duplicate GHL contacts/appointments
(always upsert on the external id), and design every processor to be safely retried.
