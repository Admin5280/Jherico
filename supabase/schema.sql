-- =====================================================================
-- Auto Dude Command Center — Supabase schema
-- Run in Supabase → SQL Editor → New query → Run (idempotent-ish).
--
-- Enforcement model: the Next.js API routes use the SERVICE-ROLE key
-- (which BYPASSES RLS) and gate every request with requireRole(); tech
-- queries are scoped to assignments in the *Db.ts helpers. RLS is still
-- enabled below (deny-all + auth.uid() policies) as defense-in-depth and
-- to make a future direct-client mode safe.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- profiles  (1:1 with auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  first_name    text default '',
  last_name     text default '',
  email         text default '',
  phone         text default '',
  role          text not null default 'Technician' check (role in ('Admin','Manager','Technician')),
  avatar_url    text default '',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_auth_idx on public.profiles(auth_user_id);
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- technicians
-- =====================================================================
create table if not exists public.technicians (
  id                      uuid primary key default gen_random_uuid(),
  profile_id              uuid references public.profiles(id) on delete set null,
  employee_code           text unique not null,
  skills                  text[] not null default '{}',
  service_areas           text[] not null default '{}',
  default_start_location  text default '',
  employment_status       text not null default 'Active' check (employment_status in ('Active','Inactive','On Leave')),
  hourly_rate             numeric not null default 0,
  commission_rate         numeric not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists technicians_profile_idx on public.technicians(profile_id);
drop trigger if exists trg_technicians_updated on public.technicians;
create trigger trg_technicians_updated before update on public.technicians
  for each row execute function public.set_updated_at();

-- =====================================================================
-- technician_availability
-- =====================================================================
create table if not exists public.technician_availability (
  id              uuid primary key default gen_random_uuid(),
  technician_id   uuid not null references public.technicians(id) on delete cascade,
  day_of_week     int not null check (day_of_week between 0 and 6),
  available_start text not null default '08:00',
  available_end   text not null default '18:00',
  is_available    boolean not null default true,
  effective_date  date,
  end_date        date,
  created_at      timestamptz not null default now()
);
create index if not exists tech_avail_tech_idx on public.technician_availability(technician_id);

-- =====================================================================
-- customers  (GHL is source of truth; ghl_contact_id links)
-- =====================================================================
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  ghl_contact_id  text unique,
  first_name      text default '',
  last_name       text default '',
  email           text default '',
  phone           text default '',
  secondary_phone text default '',
  address_line_1  text default '',
  address_line_2  text default '',
  city            text default '',
  state           text default 'TX',
  postal_code     text default '',
  latitude        numeric,
  longitude       numeric,
  customer_notes  text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists customers_ghl_idx on public.customers(ghl_contact_id);
create index if not exists customers_phone_idx on public.customers(phone);
create index if not exists customers_name_idx on public.customers(last_name, first_name);
drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- =====================================================================
-- vehicles
-- =====================================================================
create table if not exists public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id) on delete cascade,
  year           int,
  make           text default '',
  model          text default '',
  trim           text default '',
  color          text default '',
  size_category  text default '',
  license_plate  text default '',
  vin            text default '',
  vehicle_notes  text default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists vehicles_customer_idx on public.vehicles(customer_id);
drop trigger if exists trg_vehicles_updated on public.vehicles;
create trigger trg_vehicles_updated before update on public.vehicles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- services  (GHL is source of truth for prices; ghl_product_id links)
-- =====================================================================
create table if not exists public.services (
  id                        uuid primary key default gen_random_uuid(),
  ghl_product_id            text unique,
  name                      text not null,
  slug                      text unique not null,
  description               text default '',
  category                  text default '',
  default_duration_minutes  int not null default 120,
  base_price                numeric not null default 0,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();

-- =====================================================================
-- service_checklist_templates + items
-- =====================================================================
create table if not exists public.service_checklist_templates (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services(id) on delete cascade,
  name         text not null,
  description  text default '',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists checklist_tmpl_service_idx on public.service_checklist_templates(service_id);

create table if not exists public.service_checklist_template_items (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references public.service_checklist_templates(id) on delete cascade,
  title          text not null,
  description    text default '',
  sort_order     int not null default 0,
  is_required    boolean not null default true,
  requires_photo boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists checklist_tmpl_item_idx on public.service_checklist_template_items(template_id, sort_order);

-- =====================================================================
-- jobs
-- =====================================================================
create table if not exists public.jobs (
  id                          uuid primary key default gen_random_uuid(),
  job_number                  text unique not null,
  ghl_appointment_id          text unique,
  ghl_contact_id              text,
  ghl_opportunity_id          text,
  customer_id                 uuid references public.customers(id) on delete set null,
  vehicle_id                  uuid references public.vehicles(id) on delete set null,
  service_address             text default '',
  city                        text default '',
  state                       text default 'TX',
  postal_code                 text default '',
  latitude                    numeric,
  longitude                   numeric,
  scheduled_start             timestamptz,
  scheduled_end               timestamptz,
  arrival_window_start        timestamptz,
  arrival_window_end          timestamptz,
  estimated_duration_minutes  int not null default 120,
  status                      text not null default 'Draft' check (status in (
                                'Draft','Pending Confirmation','Confirmed','Scheduled','Technician Assigned',
                                'En Route','Checked In','In Progress','Waiting','Completed',
                                'Cancelled','Rescheduled','No Show')),
  payment_status              text not null default 'Unpaid' check (payment_status in (
                                'Unpaid','Deposit Paid','Partially Paid','Paid','Refunded')),
  invoice_total               numeric not null default 0,
  deposit_amount              numeric not null default 0,
  remaining_balance           numeric not null default 0,
  customer_notes              text default '',
  internal_notes              text default '',
  access_instructions         text default '',
  assigned_vehicle            text default '',
  sync_status                 text not null default 'local' check (sync_status in ('local','synced','pending','error')),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  completed_at                timestamptz,
  archived_at                 timestamptz
);
create index if not exists jobs_status_idx        on public.jobs(status);
create index if not exists jobs_scheduled_idx      on public.jobs(scheduled_start);
create index if not exists jobs_customer_idx       on public.jobs(customer_id);
create index if not exists jobs_ghl_appt_idx       on public.jobs(ghl_appointment_id);
create index if not exists jobs_city_idx           on public.jobs(city);
drop trigger if exists trg_jobs_updated on public.jobs;
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();

-- =====================================================================
-- job_assignments
-- =====================================================================
create table if not exists public.job_assignments (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  technician_id   uuid not null references public.technicians(id) on delete cascade,
  assignment_role text not null default 'primary' check (assignment_role in ('primary','assist')),
  assigned_start  timestamptz,
  assigned_end    timestamptz,
  is_primary      boolean not null default true,
  assigned_at     timestamptz not null default now(),
  assigned_by     uuid references public.profiles(id) on delete set null,
  unique (job_id, technician_id)
);
create index if not exists job_assign_job_idx  on public.job_assignments(job_id);
create index if not exists job_assign_tech_idx on public.job_assignments(technician_id);

-- =====================================================================
-- job_service_items
-- =====================================================================
create table if not exists public.job_service_items (
  id                          uuid primary key default gen_random_uuid(),
  job_id                      uuid not null references public.jobs(id) on delete cascade,
  service_id                  uuid references public.services(id) on delete set null,
  assigned_technician_id      uuid references public.technicians(id) on delete set null,
  service_name_snapshot       text not null,
  description_snapshot        text default '',
  price_snapshot              numeric not null default 0,
  estimated_duration_minutes  int not null default 60,
  status                      text not null default 'Not Started' check (status in ('Not Started','In Progress','Completed','Skipped')),
  sort_order                  int not null default 0,
  started_at                  timestamptz,
  completed_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists job_svc_item_job_idx on public.job_service_items(job_id);
drop trigger if exists trg_job_svc_item_updated on public.job_service_items;
create trigger trg_job_svc_item_updated before update on public.job_service_items
  for each row execute function public.set_updated_at();

-- =====================================================================
-- job_checklist_items
-- =====================================================================
create table if not exists public.job_checklist_items (
  id                    uuid primary key default gen_random_uuid(),
  job_service_item_id   uuid not null references public.job_service_items(id) on delete cascade,
  template_item_id      uuid references public.service_checklist_template_items(id) on delete set null,
  title_snapshot        text not null,
  description_snapshot   text default '',
  is_required           boolean not null default true,
  requires_photo        boolean not null default false,
  status                text not null default 'Not Started' check (status in ('Not Started','In Progress','Completed','Skipped')),
  technician_note       text default '',
  completed_by          uuid references public.profiles(id) on delete set null,
  completed_at          timestamptz,
  sort_order            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists job_chk_item_svc_idx on public.job_checklist_items(job_service_item_id, sort_order);
drop trigger if exists trg_job_chk_item_updated on public.job_checklist_items;
create trigger trg_job_chk_item_updated before update on public.job_checklist_items
  for each row execute function public.set_updated_at();

-- =====================================================================
-- job_status_history
-- =====================================================================
create table if not exists public.job_status_history (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  previous_status text,
  new_status      text not null,
  changed_by      uuid references public.profiles(id) on delete set null,
  change_source   text not null default 'system' check (change_source in ('admin','manager','technician','webhook','system')),
  note            text default '',
  created_at      timestamptz not null default now()
);
create index if not exists job_status_hist_job_idx on public.job_status_history(job_id, created_at desc);

-- =====================================================================
-- job_time_entries
-- =====================================================================
create table if not exists public.job_time_entries (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references public.jobs(id) on delete cascade,
  technician_id    uuid references public.technicians(id) on delete set null,
  entry_type       text not null check (entry_type in ('en_route','check_in','start','pause','resume','complete')),
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_minutes numeric,
  latitude         numeric,
  longitude        numeric,
  note             text default '',
  created_at       timestamptz not null default now()
);
create index if not exists job_time_job_idx on public.job_time_entries(job_id);

-- =====================================================================
-- job_photos  (files live in Storage; storage_path references bucket/key)
-- =====================================================================
create table if not exists public.job_photos (
  id                   uuid primary key default gen_random_uuid(),
  job_id               uuid not null references public.jobs(id) on delete cascade,
  job_service_item_id  uuid references public.job_service_items(id) on delete set null,
  uploaded_by          uuid references public.profiles(id) on delete set null,
  photo_type           text not null check (photo_type in ('before','after','damage','profile')),
  storage_path         text not null,
  caption              text default '',
  taken_at             timestamptz,
  created_at           timestamptz not null default now()
);
create index if not exists job_photos_job_idx on public.job_photos(job_id, photo_type);

-- =====================================================================
-- job_inspections
-- =====================================================================
create table if not exists public.job_inspections (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs(id) on delete cascade,
  inspection_type   text not null check (inspection_type in ('pre_service','post_service')),
  completed_by      uuid references public.profiles(id) on delete set null,
  condition_summary text default '',
  damage_notes      text default '',
  customer_concerns text default '',
  recommendations   text default '',
  latitude          numeric,
  longitude         numeric,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (job_id, inspection_type)
);
create index if not exists job_inspections_job_idx on public.job_inspections(job_id);
drop trigger if exists trg_job_inspection_updated on public.job_inspections;
create trigger trg_job_inspection_updated before update on public.job_inspections
  for each row execute function public.set_updated_at();

-- =====================================================================
-- maintenance_clients
-- =====================================================================
create table if not exists public.maintenance_clients (
  id                     uuid primary key default gen_random_uuid(),
  customer_id            uuid not null references public.customers(id) on delete cascade,
  vehicle_id             uuid references public.vehicles(id) on delete set null,
  program_name           text default '',
  frequency              text not null default 'Monthly' check (frequency in ('Monthly','Bi-Monthly','Quarterly')),
  status                 text not null default 'Active' check (status in ('Active','Paused','Past Due','Cancelled','Needs Scheduling')),
  start_date             date,
  next_service_date      date,
  last_service_date      date,
  preferred_day          text default '',
  preferred_time         text default '',
  assigned_technician_id uuid references public.technicians(id) on delete set null,
  monthly_value          numeric not null default 0,
  ghl_subscription_id    text unique,
  notes                  text default '',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists maint_customer_idx on public.maintenance_clients(customer_id);
create index if not exists maint_status_idx on public.maintenance_clients(status);
create index if not exists maint_next_idx on public.maintenance_clients(next_service_date);
drop trigger if exists trg_maint_updated on public.maintenance_clients;
create trigger trg_maint_updated before update on public.maintenance_clients
  for each row execute function public.set_updated_at();

-- =====================================================================
-- leads
-- =====================================================================
create table if not exists public.leads (
  id                 uuid primary key default gen_random_uuid(),
  ghl_contact_id     text,
  ghl_opportunity_id text,
  first_name         text default '',
  last_name          text default '',
  phone              text default '',
  email              text default '',
  source             text default '',
  campaign           text default '',
  service_interest   text default '',
  pipeline_stage     text default '',
  lead_status        text not null default 'New' check (lead_status in ('New','Contacted','Qualified','Booked','Lost')),
  estimated_value    numeric not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads(lead_status);
create index if not exists leads_source_idx on public.leads(source);
create index if not exists leads_ghl_idx on public.leads(ghl_contact_id);
drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

-- =====================================================================
-- marketing_metrics
-- =====================================================================
create table if not exists public.marketing_metrics (
  id            uuid primary key default gen_random_uuid(),
  metric_date   date not null,
  platform      text not null,
  campaign_name text default '',
  ad_spend      numeric not null default 0,
  impressions   int not null default 0,
  clicks        int not null default 0,
  leads         int not null default 0,
  booked_jobs   int not null default 0,
  revenue       numeric not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists mktg_date_idx on public.marketing_metrics(metric_date);
create index if not exists mktg_platform_idx on public.marketing_metrics(platform);
drop trigger if exists trg_mktg_updated on public.marketing_metrics;
create trigger trg_mktg_updated before update on public.marketing_metrics
  for each row execute function public.set_updated_at();

-- =====================================================================
-- webhook_events  (raw inbound GHL events; dedupe on external_event_id)
-- =====================================================================
create table if not exists public.webhook_events (
  id                uuid primary key default gen_random_uuid(),
  source            text not null default 'ghl',
  event_type        text not null,
  external_event_id text,
  payload           jsonb,
  processing_status text not null default 'received' check (processing_status in
                      ('received','processed','duplicate','invalid','unauthorized','error')),
  error_message     text default '',
  received_at       timestamptz not null default now(),
  processed_at      timestamptz,
  unique (source, external_event_id)
);
create index if not exists webhook_events_received_idx on public.webhook_events(received_at desc);
create index if not exists webhook_events_type_idx on public.webhook_events(event_type);

-- =====================================================================
-- activity_logs
-- =====================================================================
create table if not exists public.activity_logs (
  id               uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  entity_type      text not null,
  entity_id        uuid,
  action           text not null,
  old_data         jsonb,
  new_data         jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists activity_entity_idx on public.activity_logs(entity_type, entity_id);
create index if not exists activity_created_idx on public.activity_logs(created_at desc);

-- =====================================================================
-- RLS helper functions (auth.uid() based; SECURITY DEFINER)
-- =====================================================================
create or replace function public.auth_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where auth_user_id = auth.uid();
$$;

create or replace function public.auth_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('Admin','Manager') from public.profiles where auth_user_id = auth.uid()), false);
$$;

create or replace function public.auth_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'Admin' from public.profiles where auth_user_id = auth.uid()), false);
$$;

create or replace function public.auth_technician_id()
returns uuid language sql stable security definer set search_path = public as $$
  select t.id
  from public.technicians t
  join public.profiles p on p.id = t.profile_id
  where p.auth_user_id = auth.uid();
$$;

-- helper: is a job assigned to the calling technician?
create or replace function public.job_is_mine(p_job_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.job_assignments ja
    where ja.job_id = p_job_id and ja.technician_id = public.auth_technician_id()
  );
$$;

-- =====================================================================
-- Enable RLS on every table. The service role (used by API routes)
-- BYPASSES these; the policies below only matter for a future
-- direct-from-browser (anon-key) mode. Deny-all by default: any table
-- with RLS on and no matching policy denies authenticated/anon reads.
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','technicians','technician_availability','customers','vehicles',
    'services','service_checklist_templates','service_checklist_template_items',
    'jobs','job_assignments','job_service_items','job_checklist_items',
    'job_status_history','job_time_entries','job_photos','job_inspections',
    'maintenance_clients','leads','marketing_metrics','webhook_events','activity_logs'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- --- staff (Admin/Manager) full access to operational tables ---
do $$
declare t text;
begin
  foreach t in array array[
    'technicians','technician_availability','customers','vehicles',
    'services','service_checklist_templates','service_checklist_template_items',
    'jobs','job_assignments','job_service_items','job_checklist_items',
    'job_status_history','job_time_entries','job_photos','job_inspections',
    'maintenance_clients','leads','marketing_metrics','activity_logs'
  ] loop
    execute format('drop policy if exists %I on public.%I;', t || '_staff_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.auth_is_staff()) with check (public.auth_is_staff());',
      t || '_staff_all', t);
  end loop;
end $$;

-- --- profiles: everyone can read their own; staff read all; admin write ---
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated
  using (auth_user_id = auth.uid() or public.auth_is_staff());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.auth_is_admin()) with check (public.auth_is_admin());

-- --- technicians: a tech can read their own row ---
drop policy if exists technicians_self_select on public.technicians;
create policy technicians_self_select on public.technicians for select to authenticated
  using (public.auth_is_staff() or profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- --- jobs: technicians can read jobs assigned to them ---
drop policy if exists jobs_tech_select on public.jobs;
create policy jobs_tech_select on public.jobs for select to authenticated
  using (public.auth_is_staff() or public.job_is_mine(id));
-- technicians may update only their assigned jobs (status/notes; column-level
-- protection of price/payment/GHL fields is enforced in the API layer)
drop policy if exists jobs_tech_update on public.jobs;
create policy jobs_tech_update on public.jobs for update to authenticated
  using (public.job_is_mine(id)) with check (public.job_is_mine(id));

-- --- job_assignments: tech reads their own assignments ---
drop policy if exists job_assign_tech_select on public.job_assignments;
create policy job_assign_tech_select on public.job_assignments for select to authenticated
  using (public.auth_is_staff() or technician_id = public.auth_technician_id());

-- --- job_service_items / checklist / photos / inspections / time: scoped to my jobs ---
drop policy if exists job_svc_tech on public.job_service_items;
create policy job_svc_tech on public.job_service_items for all to authenticated
  using (public.auth_is_staff() or public.job_is_mine(job_id))
  with check (public.auth_is_staff() or public.job_is_mine(job_id));

drop policy if exists job_chk_tech on public.job_checklist_items;
create policy job_chk_tech on public.job_checklist_items for all to authenticated
  using (public.auth_is_staff() or exists (
    select 1 from public.job_service_items s where s.id = job_service_item_id and public.job_is_mine(s.job_id)))
  with check (public.auth_is_staff() or exists (
    select 1 from public.job_service_items s where s.id = job_service_item_id and public.job_is_mine(s.job_id)));

drop policy if exists job_photos_tech on public.job_photos;
create policy job_photos_tech on public.job_photos for all to authenticated
  using (public.auth_is_staff() or public.job_is_mine(job_id))
  with check (public.auth_is_staff() or public.job_is_mine(job_id));

drop policy if exists job_inspect_tech on public.job_inspections;
create policy job_inspect_tech on public.job_inspections for all to authenticated
  using (public.auth_is_staff() or public.job_is_mine(job_id))
  with check (public.auth_is_staff() or public.job_is_mine(job_id));

drop policy if exists job_time_tech on public.job_time_entries;
create policy job_time_tech on public.job_time_entries for all to authenticated
  using (public.auth_is_staff() or public.job_is_mine(job_id))
  with check (public.auth_is_staff() or public.job_is_mine(job_id));

drop policy if exists job_status_hist_tech on public.job_status_history;
create policy job_status_hist_tech on public.job_status_history for select to authenticated
  using (public.auth_is_staff() or public.job_is_mine(job_id));

-- --- technician_availability: a tech reads/edits their own ---
drop policy if exists tech_avail_self on public.technician_availability;
create policy tech_avail_self on public.technician_availability for all to authenticated
  using (public.auth_is_staff() or technician_id = public.auth_technician_id())
  with check (public.auth_is_staff() or technician_id = public.auth_technician_id());

-- webhook_events + services templates remain staff-only via the staff_all loop
-- (services readable by staff; techs get service snapshots on their job items).

-- =====================================================================
-- Storage buckets (private) + policies
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('job-before-photos','job-before-photos', false),
  ('job-after-photos','job-after-photos', false),
  ('job-damage-photos','job-damage-photos', false),
  ('profile-photos','profile-photos', false)
on conflict (id) do nothing;

-- Authenticated users may read/write job photo buckets; the API layer (service
-- role) is the primary path and enforces per-job scoping. These policies keep
-- a future direct-upload client working for any signed-in staff/tech.
do $$
declare b text;
begin
  foreach b in array array['job-before-photos','job-after-photos','job-damage-photos','profile-photos'] loop
    execute format('drop policy if exists %I on storage.objects;', 'obj_read_' || replace(b,'-','_'));
    execute format(
      'create policy %I on storage.objects for select to authenticated using (bucket_id = %L);',
      'obj_read_' || replace(b,'-','_'), b);
    execute format('drop policy if exists %I on storage.objects;', 'obj_write_' || replace(b,'-','_'));
    execute format(
      'create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L);',
      'obj_write_' || replace(b,'-','_'), b);
  end loop;
end $$;

-- =====================================================================
-- Done. Load seed.sql next for demo data.
-- =====================================================================
