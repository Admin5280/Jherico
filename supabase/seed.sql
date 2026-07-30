-- =====================================================================
-- Auto Dude Command Center — demo seed data
-- Run AFTER schema.sql. Safe to run once. Fixed UUIDs use ON CONFLICT DO
-- NOTHING; time-relative rows use now() so "today" always has jobs.
--
-- NOTE: profiles.auth_user_id is left NULL here. After you create the login
-- users in Supabase Auth, link them with:
--   update public.profiles set auth_user_id = '<auth uuid>' where email = '...';
-- (See docs/INTEGRATION.md → "Create demo logins".)
-- =====================================================================

-- ----------------------------- profiles -----------------------------
insert into public.profiles (id, first_name, last_name, email, phone, role, is_active) values
  ('a0000000-0000-0000-0000-000000000001','Avery','Owner','admin@autodude.local','(830) 555-0100','Admin', true),
  ('a0000000-0000-0000-0000-000000000002','Jordan','Dispatch','manager@autodude.local','(830) 555-0101','Manager', true),
  ('a0000000-0000-0000-0000-000000000003','Carlos','Reyes','carlos@autodude.local','(830) 555-0102','Technician', true),
  ('a0000000-0000-0000-0000-000000000004','Marcus','Bell','marcus@autodude.local','(830) 555-0103','Technician', true),
  ('a0000000-0000-0000-0000-000000000005','Diego','Santos','diego@autodude.local','(830) 555-0104','Technician', true)
on conflict (id) do nothing;

-- --------------------------- technicians ----------------------------
insert into public.technicians (id, profile_id, employee_code, skills, service_areas, default_start_location, employment_status, hourly_rate, commission_rate) values
  ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','TECH-001',
     array['Exterior Detail','Interior Detail','Full Detail','Ceramic Coating','Paint Correction'],
     array['New Braunfels','Bulverde','Spring Branch','Canyon Lake'], 'New Braunfels, TX', 'Active', 28, 0.10),
  ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004','TECH-002',
     array['Window Tint','Headlight Restoration','Exterior Detail','Full Detail'],
     array['New Braunfels','Seguin','San Marcos'], 'Seguin, TX', 'Active', 26, 0.10),
  ('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005','TECH-003',
     array['Interior Detail','Full Detail','Pet Hair Removal','Maintenance Detail','Ozone Treatment'],
     array['Boerne','Dripping Springs','Wimberley','New Braunfels'], 'Boerne, TX', 'Active', 24, 0.08)
on conflict (id) do nothing;

-- ---------------------- technician_availability ---------------------
insert into public.technician_availability (technician_id, day_of_week, available_start, available_end, is_available)
select t.id, dow, '08:00', '18:00', true
from (values
  ('b0000000-0000-0000-0000-000000000001'::uuid),
  ('b0000000-0000-0000-0000-000000000002'::uuid),
  ('b0000000-0000-0000-0000-000000000003'::uuid)) as t(id)
cross join generate_series(1,6) as dow   -- Mon..Sat
where not exists (select 1 from public.technician_availability);

-- ----------------------------- customers ----------------------------
insert into public.customers (id, first_name, last_name, email, phone, address_line_1, city, state, postal_code, latitude, longitude, customer_notes) values
  ('c0000000-0000-0000-0000-000000000001','Sarah','Mitchell','sarah.m@example.com','(830) 555-0201','128 Gruene Rd','New Braunfels','TX','78130',29.7628,-98.1078,'Gate code 4412'),
  ('c0000000-0000-0000-0000-000000000002','Mike','Thompson','mike.t@example.com','(830) 555-0202','905 Oak Run Pkwy','New Braunfels','TX','78132',29.7100,-98.1400,''),
  ('c0000000-0000-0000-0000-000000000003','Jessica','Nguyen','jess.n@example.com','(830) 555-0203','221 Bulverde Crossing','Bulverde','TX','78163',29.7440,-98.4530,'Dog in backyard'),
  ('c0000000-0000-0000-0000-000000000004','David','Ramirez','david.r@example.com','(830) 555-0204','17 Spring Branch Trl','Spring Branch','TX','78070',29.8880,-98.3990,''),
  ('c0000000-0000-0000-0000-000000000005','Emily','Carter','emily.c@example.com','(830) 555-0205','44 Canyon Lake Dr','Canyon Lake','TX','78133',29.8760,-98.2620,'Park in driveway'),
  ('c0000000-0000-0000-0000-000000000006','Robert','Kim','rob.k@example.com','(512) 555-0206','780 Wimberley Sq','Wimberley','TX','78676',29.9970,-98.0980,''),
  ('c0000000-0000-0000-0000-000000000007','Ashley','Brooks','ashley.b@example.com','(830) 555-0207','300 Boerne Stage Rd','Boerne','TX','78006',29.7947,-98.7320,'Water spigot on left side'),
  ('c0000000-0000-0000-0000-000000000008','Chris','Patel','chris.p@example.com','(512) 555-0208','62 Dripping Springs Way','Dripping Springs','TX','78620',30.1900,-98.0860,''),
  ('c0000000-0000-0000-0000-000000000009','Megan','Foster','megan.f@example.com','(512) 555-0209','915 Hunter Rd','San Marcos','TX','78666',29.8833,-97.9414,'Apartment - call on arrival'),
  ('c0000000-0000-0000-0000-000000000010','Tyler','Morgan','tyler.m@example.com','(830) 555-0210','410 E Court St','Seguin','TX','78155',29.5688,-97.9647,'')
on conflict (id) do nothing;

-- ----------------------------- vehicles -----------------------------
insert into public.vehicles (id, customer_id, year, make, model, trim, color, size_category, license_plate) values
  ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',2021,'Toyota','RAV4','XLE','Silver','Mid-Size SUV','TX-RAV21'),
  ('d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002',2019,'Ford','F-150','Lariat','Black','Truck','TX-F150L'),
  ('d0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000003',2022,'Honda','Civic','Sport','Blue','Sedan','TX-CIV22'),
  ('d0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000004',2020,'Chevrolet','Tahoe','LT','White','Large SUV','TX-TAH20'),
  ('d0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000005',2023,'Tesla','Model 3','Long Range','Red','Sedan','TX-TSLA3'),
  ('d0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000006',2018,'Jeep','Wrangler','Rubicon','Green','Mid-Size SUV','TX-JEEP8'),
  ('d0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000007',2021,'BMW','X5','xDrive40i','Gray','Large SUV','TX-BMWX5'),
  ('d0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000008',2017,'Subaru','Outback','Limited','Silver','Mid-Size SUV','TX-OUTB7'),
  ('d0000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000009',2022,'Mazda','CX-5','Touring','Black','Mid-Size SUV','TX-CX522'),
  ('d0000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000010',2016,'Dodge','Charger','R/T','Black','Sedan','TX-CHGR6')
on conflict (id) do nothing;

-- ----------------------------- services -----------------------------
-- Prices/durations from the Auto Dude catalog (mid-tier where tiered).
insert into public.services (id, name, slug, description, category, default_duration_minutes, base_price, is_active) values
  ('e0000000-0000-0000-0000-000000000001','Exterior Detail','exterior-detail','Wash, clay & seal exterior treatment.','Detailing',120,140,true),
  ('e0000000-0000-0000-0000-000000000002','Interior Detail','interior-detail','Full interior clean & protect.','Detailing',180,275,true),
  ('e0000000-0000-0000-0000-000000000003','Full Detail','full-detail','Complete interior + exterior detail.','Detailing',240,350,true),
  ('e0000000-0000-0000-0000-000000000004','Window Tint','window-tint','Ceramic window tint installation.','Tint',120,549,true),
  ('e0000000-0000-0000-0000-000000000005','One-Step Paint Correction','paint-correction-1','Single-stage paint correction.','Correction',150,350,true),
  ('e0000000-0000-0000-0000-000000000006','Ceramic Coating','ceramic-coating','1-year ceramic coating protection.','Coating',300,549,true),
  ('e0000000-0000-0000-0000-000000000007','Headlight Restoration','headlight-restoration','Restore clouded headlights (per pair).','Restoration',60,110,true),
  ('e0000000-0000-0000-0000-000000000008','Maintenance Detail','maintenance-detail','Recurring upkeep detail for members.','Maintenance',90,150,true)
on conflict (id) do nothing;

-- --------------------- checklist templates + items ------------------
insert into public.service_checklist_templates (id, service_id, name, description) values
  ('f0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001','Exterior Detail Checklist',''),
  ('f0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000002','Interior Detail Checklist',''),
  ('f0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000003','Full Detail Checklist',''),
  ('f0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000004','Window Tint Checklist',''),
  ('f0000000-0000-0000-0000-000000000005','e0000000-0000-0000-0000-000000000005','Paint Correction Checklist',''),
  ('f0000000-0000-0000-0000-000000000006','e0000000-0000-0000-0000-000000000006','Ceramic Coating Checklist',''),
  ('f0000000-0000-0000-0000-000000000007','e0000000-0000-0000-0000-000000000007','Headlight Restoration Checklist',''),
  ('f0000000-0000-0000-0000-000000000008','e0000000-0000-0000-0000-000000000008','Maintenance Detail Checklist','')
on conflict (id) do nothing;

insert into public.service_checklist_template_items (template_id, title, sort_order, is_required, requires_photo)
select tmpl, title, ord, req, ph from (values
  -- Exterior
  ('f0000000-0000-0000-0000-000000000001'::uuid,'Pre-rinse & foam wash',1,true,false),
  ('f0000000-0000-0000-0000-000000000001'::uuid,'Hand wash panels',2,true,false),
  ('f0000000-0000-0000-0000-000000000001'::uuid,'Clay bar treatment',3,true,false),
  ('f0000000-0000-0000-0000-000000000001'::uuid,'Wheels & tires cleaned',4,true,true),
  ('f0000000-0000-0000-0000-000000000001'::uuid,'Sealant applied',5,true,false),
  ('f0000000-0000-0000-0000-000000000001'::uuid,'Final wipe-down & inspection',6,true,true),
  -- Interior
  ('f0000000-0000-0000-0000-000000000002'::uuid,'Remove trash & personal items',1,true,false),
  ('f0000000-0000-0000-0000-000000000002'::uuid,'Vacuum carpets & seats',2,true,false),
  ('f0000000-0000-0000-0000-000000000002'::uuid,'Shampoo/steam upholstery',3,true,false),
  ('f0000000-0000-0000-0000-000000000002'::uuid,'Wipe & protect surfaces',4,true,false),
  ('f0000000-0000-0000-0000-000000000002'::uuid,'Clean interior glass',5,true,false),
  ('f0000000-0000-0000-0000-000000000002'::uuid,'Final interior inspection',6,true,true),
  -- Full
  ('f0000000-0000-0000-0000-000000000003'::uuid,'Exterior wash & decontaminate',1,true,false),
  ('f0000000-0000-0000-0000-000000000003'::uuid,'Interior deep clean',2,true,false),
  ('f0000000-0000-0000-0000-000000000003'::uuid,'Wheels, tires & fenders',3,true,true),
  ('f0000000-0000-0000-0000-000000000003'::uuid,'Sealant / wax applied',4,true,false),
  ('f0000000-0000-0000-0000-000000000003'::uuid,'Glass in & out',5,true,false),
  ('f0000000-0000-0000-0000-000000000003'::uuid,'Final walkaround',6,true,true),
  -- Window Tint
  ('f0000000-0000-0000-0000-000000000004'::uuid,'Confirm film & VLT with customer',1,true,false),
  ('f0000000-0000-0000-0000-000000000004'::uuid,'Clean all glass',2,true,false),
  ('f0000000-0000-0000-0000-000000000004'::uuid,'Cut & install film',3,true,false),
  ('f0000000-0000-0000-0000-000000000004'::uuid,'Inspect for bubbles/edges',4,true,true),
  ('f0000000-0000-0000-0000-000000000004'::uuid,'Cure & care instructions given',5,true,false),
  -- Paint Correction
  ('f0000000-0000-0000-0000-000000000005'::uuid,'Wash & decontaminate',1,true,false),
  ('f0000000-0000-0000-0000-000000000005'::uuid,'Paint depth readings',2,false,false),
  ('f0000000-0000-0000-0000-000000000005'::uuid,'Compound / polish pass',3,true,true),
  ('f0000000-0000-0000-0000-000000000005'::uuid,'IPA wipe & inspect under light',4,true,true),
  -- Ceramic
  ('f0000000-0000-0000-0000-000000000006'::uuid,'Full paint correction prep',1,true,true),
  ('f0000000-0000-0000-0000-000000000006'::uuid,'Panel wipe / surface prep',2,true,false),
  ('f0000000-0000-0000-0000-000000000006'::uuid,'Apply coating panel by panel',3,true,false),
  ('f0000000-0000-0000-0000-000000000006'::uuid,'Level & buff flash',4,true,false),
  ('f0000000-0000-0000-0000-000000000006'::uuid,'Cure check & customer walkthrough',5,true,true),
  -- Headlight
  ('f0000000-0000-0000-0000-000000000007'::uuid,'Tape & mask surrounding paint',1,true,false),
  ('f0000000-0000-0000-0000-000000000007'::uuid,'Wet sand oxidation',2,true,false),
  ('f0000000-0000-0000-0000-000000000007'::uuid,'Polish & seal lens',3,true,true),
  -- Maintenance
  ('f0000000-0000-0000-0000-000000000008'::uuid,'Quick exterior wash',1,true,false),
  ('f0000000-0000-0000-0000-000000000008'::uuid,'Interior wipe & vacuum',2,true,false),
  ('f0000000-0000-0000-0000-000000000008'::uuid,'Glass & tires',3,true,false),
  ('f0000000-0000-0000-0000-000000000008'::uuid,'Condition report to office',4,false,true)
) as v(tmpl,title,ord,req,ph)
where not exists (select 1 from public.service_checklist_template_items);

-- ------------------------------- jobs -------------------------------
-- statuses spread across the workflow; times anchored to now() so the
-- dashboard's Today / This Week / In Progress sections always populate.
insert into public.jobs (id, job_number, customer_id, vehicle_id, service_address, city, state, postal_code, latitude, longitude,
  scheduled_start, scheduled_end, arrival_window_start, arrival_window_end, estimated_duration_minutes,
  status, payment_status, invoice_total, deposit_amount, remaining_balance, customer_notes, access_instructions, completed_at) values
  -- Completed (yesterday) — Carlos
  ('10000000-0000-0000-0000-000000000001','JOB-1001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','128 Gruene Rd','New Braunfels','TX','78130',29.7628,-98.1078,
    date_trunc('day',now())-interval '1 day'+interval '9 hours', date_trunc('day',now())-interval '1 day'+interval '13 hours', date_trunc('day',now())-interval '1 day'+interval '9 hours', date_trunc('day',now())-interval '1 day'+interval '10 hours', 240,
    'Completed','Paid',350,0,0,'Please focus on pet hair in back seat.','Gate code 4412', date_trunc('day',now())-interval '1 day'+interval '13 hours'),
  -- Completed (2 days ago) — Marcus (tint)
  ('10000000-0000-0000-0000-000000000002','JOB-1002','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000003','221 Bulverde Crossing','Bulverde','TX','78163',29.7440,-98.4530,
    date_trunc('day',now())-interval '2 day'+interval '10 hours', date_trunc('day',now())-interval '2 day'+interval '12 hours', null,null, 120,
    'Completed','Paid',549,100,0,'','Dog in backyard', date_trunc('day',now())-interval '2 day'+interval '12 hours'),
  -- Completed (today, morning) — Diego
  ('10000000-0000-0000-0000-000000000003','JOB-1003','c0000000-0000-0000-0000-000000000007','d0000000-0000-0000-0000-000000000007','300 Boerne Stage Rd','Boerne','TX','78006',29.7947,-98.7320,
    date_trunc('day',now())+interval '7 hours', date_trunc('day',now())+interval '10 hours', null,null, 180,
    'Completed','Paid',275,0,0,'','Water spigot on left side', date_trunc('day',now())+interval '10 hours'),
  -- In Progress (today) — Carlos
  ('10000000-0000-0000-0000-000000000004','JOB-1004','c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000005','44 Canyon Lake Dr','Canyon Lake','TX','78133',29.8760,-98.2620,
    date_trunc('day',now())+interval '11 hours', date_trunc('day',now())+interval '15 hours', date_trunc('day',now())+interval '11 hours', date_trunc('day',now())+interval '12 hours', 240,
    'In Progress','Deposit Paid',350,100,250,'','Park in driveway', null),
  -- Checked In (today) — Marcus
  ('10000000-0000-0000-0000-000000000005','JOB-1005','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000010','410 E Court St','Seguin','TX','78155',29.5688,-97.9647,
    date_trunc('day',now())+interval '12 hours', date_trunc('day',now())+interval '14 hours', null,null, 120,
    'Checked In','Unpaid',140,0,140,'','', null),
  -- En Route (today) — Diego
  ('10000000-0000-0000-0000-000000000006','JOB-1006','c0000000-0000-0000-0000-000000000008','d0000000-0000-0000-0000-000000000008','62 Dripping Springs Way','Dripping Springs','TX','78620',30.1900,-98.0860,
    date_trunc('day',now())+interval '13 hours', date_trunc('day',now())+interval '16 hours', null,null, 180,
    'En Route','Unpaid',275,0,275,'','', null),
  -- Technician Assigned (today, later) — Carlos
  ('10000000-0000-0000-0000-000000000007','JOB-1007','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002','905 Oak Run Pkwy','New Braunfels','TX','78132',29.7100,-98.1400,
    date_trunc('day',now())+interval '15 hours', date_trunc('day',now())+interval '17 hours', null,null, 120,
    'Technician Assigned','Unpaid',140,0,140,'Truck is lifted, bring step stool.','', null),
  -- Scheduled (today, late afternoon) — Marcus  [RUNNING LATE if now > start]
  ('10000000-0000-0000-0000-000000000008','JOB-1008','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000009','915 Hunter Rd','San Marcos','TX','78666',29.8833,-97.9414,
    date_trunc('day',now())+interval '8 hours', date_trunc('day',now())+interval '10 hours', null,null, 120,
    'Scheduled','Unpaid',140,0,140,'','Apartment - call on arrival', null),
  -- Confirmed (tomorrow) — UNASSIGNED (needs assignment)
  ('10000000-0000-0000-0000-000000000009','JOB-1009','c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000004','17 Spring Branch Trl','Spring Branch','TX','78070',29.8880,-98.3990,
    date_trunc('day',now())+interval '1 day'+interval '9 hours', date_trunc('day',now())+interval '1 day'+interval '14 hours', null,null, 300,
    'Confirmed','Deposit Paid',549,150,399,'','', null),
  -- Scheduled (in 2 days) — Diego
  ('10000000-0000-0000-0000-00000000000a','JOB-1010','c0000000-0000-0000-0000-000000000006','d0000000-0000-0000-0000-000000000006','780 Wimberley Sq','Wimberley','TX','78676',29.9970,-98.0980,
    date_trunc('day',now())+interval '2 day'+interval '10 hours', date_trunc('day',now())+interval '2 day'+interval '13 hours', null,null, 180,
    'Scheduled','Unpaid',275,0,275,'','', null),
  -- Technician Assigned (in 3 days) — Carlos
  ('10000000-0000-0000-0000-00000000000b','JOB-1011','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','128 Gruene Rd','New Braunfels','TX','78130',29.7628,-98.1078,
    date_trunc('day',now())+interval '3 day'+interval '9 hours', date_trunc('day',now())+interval '3 day'+interval '11 hours', null,null, 120,
    'Technician Assigned','Unpaid',140,0,140,'','Gate code 4412', null),
  -- Pending Confirmation (in 4 days) — UNASSIGNED
  ('10000000-0000-0000-0000-00000000000c','JOB-1012','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000002','905 Oak Run Pkwy','New Braunfels','TX','78132',29.7100,-98.1400,
    date_trunc('day',now())+interval '4 day'+interval '13 hours', date_trunc('day',now())+interval '4 day'+interval '17 hours', null,null, 240,
    'Pending Confirmation','Unpaid',350,0,350,'','', null),
  -- Draft (no schedule) — UNASSIGNED
  ('10000000-0000-0000-0000-00000000000d','JOB-1013','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000003','221 Bulverde Crossing','Bulverde','TX','78163',29.7440,-98.4530,
    null,null,null,null, 120,
    'Draft','Unpaid',140,0,140,'Customer requested quote first.','', null),
  -- Cancelled (this week)
  ('10000000-0000-0000-0000-00000000000e','JOB-1014','c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000005','44 Canyon Lake Dr','Canyon Lake','TX','78133',29.8760,-98.2620,
    date_trunc('day',now())+interval '1 day'+interval '15 hours', date_trunc('day',now())+interval '1 day'+interval '17 hours', null,null, 120,
    'Cancelled','Refunded',140,0,0,'Customer rescheduled to next month.','', null),
  -- No Show (yesterday)
  ('10000000-0000-0000-0000-00000000000f','JOB-1015','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000010','410 E Court St','Seguin','TX','78155',29.5688,-97.9647,
    date_trunc('day',now())-interval '1 day'+interval '14 hours', date_trunc('day',now())-interval '1 day'+interval '16 hours', null,null, 120,
    'No Show','Unpaid',140,0,140,'','', null)
on conflict (id) do nothing;

-- ------------------------- job_service_items ------------------------
insert into public.job_service_items (job_id, service_id, assigned_technician_id, service_name_snapshot, description_snapshot, price_snapshot, estimated_duration_minutes, status, sort_order, started_at, completed_at)
select j.job_id, j.service_id, j.tech, s.name, s.description, j.price, s.default_duration_minutes,
  j.item_status, 0,
  case when j.item_status in ('In Progress','Completed') then now()-interval '1 hour' else null end,
  case when j.item_status = 'Completed' then now()-interval '20 minutes' else null end
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid,'e0000000-0000-0000-0000-000000000003'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid,350::numeric,'Completed'),
  ('10000000-0000-0000-0000-000000000002'::uuid,'e0000000-0000-0000-0000-000000000004'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid,549,'Completed'),
  ('10000000-0000-0000-0000-000000000003'::uuid,'e0000000-0000-0000-0000-000000000002'::uuid,'b0000000-0000-0000-0000-000000000003'::uuid,275,'Completed'),
  ('10000000-0000-0000-0000-000000000004'::uuid,'e0000000-0000-0000-0000-000000000003'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid,350,'In Progress'),
  ('10000000-0000-0000-0000-000000000005'::uuid,'e0000000-0000-0000-0000-000000000001'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid,140,'Not Started'),
  ('10000000-0000-0000-0000-000000000006'::uuid,'e0000000-0000-0000-0000-000000000002'::uuid,'b0000000-0000-0000-0000-000000000003'::uuid,275,'Not Started'),
  ('10000000-0000-0000-0000-000000000007'::uuid,'e0000000-0000-0000-0000-000000000001'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid,140,'Not Started'),
  ('10000000-0000-0000-0000-000000000008'::uuid,'e0000000-0000-0000-0000-000000000001'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid,140,'Not Started'),
  ('10000000-0000-0000-0000-000000000009'::uuid,'e0000000-0000-0000-0000-000000000006'::uuid,null,549,'Not Started'),
  ('10000000-0000-0000-0000-00000000000a'::uuid,'e0000000-0000-0000-0000-000000000002'::uuid,'b0000000-0000-0000-0000-000000000003'::uuid,275,'Not Started'),
  ('10000000-0000-0000-0000-00000000000b'::uuid,'e0000000-0000-0000-0000-000000000001'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid,140,'Not Started'),
  ('10000000-0000-0000-0000-00000000000c'::uuid,'e0000000-0000-0000-0000-000000000003'::uuid,null,350,'Not Started'),
  ('10000000-0000-0000-0000-00000000000d'::uuid,'e0000000-0000-0000-0000-000000000001'::uuid,null,140,'Not Started'),
  ('10000000-0000-0000-0000-00000000000e'::uuid,'e0000000-0000-0000-0000-000000000001'::uuid,null,140,'Not Started'),
  ('10000000-0000-0000-0000-00000000000f'::uuid,'e0000000-0000-0000-0000-000000000001'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid,140,'Not Started')
) as j(job_id, service_id, tech, price, item_status)
join public.services s on s.id = j.service_id
where not exists (select 1 from public.job_service_items);

-- -------------------------- job_assignments -------------------------
insert into public.job_assignments (job_id, technician_id, assignment_role, is_primary, assigned_by, assigned_start, assigned_end)
select ja.job_id, ja.tech, 'primary', true, 'a0000000-0000-0000-0000-000000000002'::uuid, jb.scheduled_start, jb.scheduled_end
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000002'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000003'::uuid,'b0000000-0000-0000-0000-000000000003'::uuid),
  ('10000000-0000-0000-0000-000000000004'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000005'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000006'::uuid,'b0000000-0000-0000-0000-000000000003'::uuid),
  ('10000000-0000-0000-0000-000000000007'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000008'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-00000000000a'::uuid,'b0000000-0000-0000-0000-000000000003'::uuid),
  ('10000000-0000-0000-0000-00000000000b'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-00000000000f'::uuid,'b0000000-0000-0000-0000-000000000002'::uuid)
) as ja(job_id, tech)
join public.jobs jb on jb.id = ja.job_id
where not exists (select 1 from public.job_assignments);

-- -------------------------- job_status_history ----------------------
insert into public.job_status_history (job_id, previous_status, new_status, change_source, note, created_at)
select job_id, prev, nextst, 'system', note, now()-interval '1 hour'
from (values
  ('10000000-0000-0000-0000-000000000004'::uuid,'Checked In','In Progress','Started service'),
  ('10000000-0000-0000-0000-000000000005'::uuid,'En Route','Checked In','Arrived on site'),
  ('10000000-0000-0000-0000-000000000006'::uuid,'Technician Assigned','En Route','Heading to job'),
  ('10000000-0000-0000-0000-000000000001'::uuid,'In Progress','Completed','Job finished, customer happy')
) as h(job_id, prev, nextst, note)
where not exists (select 1 from public.job_status_history);

-- --------------------------- job_time_entries -----------------------
insert into public.job_time_entries (job_id, technician_id, entry_type, started_at, ended_at, duration_minutes)
select job_id, tech, etype,
  case when etype='complete' then null else now()-interval '2 hours' end,
  case when etype='complete' then null else now()-interval '90 minutes' end,
  case when etype='start' then 240 else null end
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid,'start'),
  ('10000000-0000-0000-0000-000000000004'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid,'check_in'),
  ('10000000-0000-0000-0000-000000000004'::uuid,'b0000000-0000-0000-0000-000000000001'::uuid,'start'),
  ('10000000-0000-0000-0000-000000000006'::uuid,'b0000000-0000-0000-0000-000000000003'::uuid,'en_route')
) as te(job_id, tech, etype)
where not exists (select 1 from public.job_time_entries);

-- --------------------------- job_inspections ------------------------
insert into public.job_inspections (job_id, inspection_type, completed_by, condition_summary, damage_notes, customer_concerns, recommendations, completed_at)
select job_id, itype, 'a0000000-0000-0000-0000-000000000003'::uuid, summ, dmg, conc, rec, now()-interval '90 minutes'
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid,'pre_service','Good overall condition','Minor scratch driver door','Pet hair in rear','Consider ceramic coating'),
  ('10000000-0000-0000-0000-000000000001'::uuid,'post_service','Excellent after full detail','','','Ceramic coating within 30 days'),
  ('10000000-0000-0000-0000-000000000004'::uuid,'pre_service','Clean daily driver','Small rock chip on hood','None','')
) as ins(job_id, itype, summ, dmg, conc, rec)
where not exists (select 1 from public.job_inspections);

-- ------------------------- maintenance_clients ----------------------
insert into public.maintenance_clients (customer_id, vehicle_id, program_name, frequency, status, start_date, next_service_date, last_service_date, preferred_day, preferred_time, assigned_technician_id, monthly_value, notes) values
  ('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','Maintenance Detail','Monthly','Active',
    current_date-interval '90 days', current_date+interval '5 days', current_date-interval '25 days','Tuesday','Morning','b0000000-0000-0000-0000-000000000001',150,''),
  ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000004','Maintenance Detail','Monthly','Active',
    current_date-interval '120 days', current_date+interval '2 days', current_date-interval '28 days','Thursday','Afternoon','b0000000-0000-0000-0000-000000000003',175,''),
  ('c0000000-0000-0000-0000-000000000007','d0000000-0000-0000-0000-000000000007','Maintenance Detail','Bi-Monthly','Past Due',
    current_date-interval '200 days', current_date-interval '6 days', current_date-interval '66 days','Monday','Morning','b0000000-0000-0000-0000-000000000002',200,'Called twice, awaiting callback'),
  ('c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000009','Maintenance Detail','Quarterly','Needs Scheduling',
    current_date-interval '30 days', null, current_date-interval '30 days','Friday','Morning',null,150,'New signup - schedule first visit'),
  ('c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000010','Maintenance Detail','Monthly','Paused',
    current_date-interval '150 days', null, current_date-interval '40 days','Wednesday','Afternoon','b0000000-0000-0000-0000-000000000002',150,'Paused for summer travel')
on conflict do nothing;

-- -------------------------------- leads -----------------------------
insert into public.leads (first_name, last_name, phone, email, source, campaign, service_interest, pipeline_stage, lead_status, estimated_value, created_at)
select
  (array['Sarah','Mike','Jess','David','Emily','Rob','Ashley','Chris','Megan','Tyler','Nina','Paul','Kayla','Sam','Rae','Owen','Lily','Jake','Maria','Cole'])[n],
  (array['H.','W.','L.','R.','C.','K.','B.','P.','F.','M.','A.','G.','S.','T.','V.','D.','N.','O.','Q.','Z.'])[n],
  '(830) 555-' || lpad((300+n)::text,4,'0'),
  'lead'||n||'@example.com',
  (array['Meta Ads','Google Ads','Google Business Profile','Organic Social','Referral','Direct','Other'])[1+(n % 7)],
  (array['NB Detailing Promo','Search - Mobile Detailing','GBP Organic','IG Reels','Word of Mouth','','Yelp'])[1+(n % 7)],
  (array['Full Detail','Window Tint','Ceramic Coating','Interior Detail','Exterior Detail','Paint Correction'])[1+(n % 6)],
  (array['New','Contacted','Qualified','Booked','Lost'])[1+(n % 5)],
  (array['New','Contacted','Qualified','Booked','Lost'])[1+(n % 5)],
  (array[140,275,350,549,650,300])[1+(n % 6)],
  now() - (n || ' days')::interval
from generate_series(1,20) as n
where not exists (select 1 from public.leads);

-- --------------------------- marketing_metrics ----------------------
insert into public.marketing_metrics (metric_date, platform, campaign_name, ad_spend, impressions, clicks, leads, booked_jobs, revenue)
select
  d::date,
  p.platform,
  p.campaign,
  round((p.base_spend * (0.7 + random()*0.6))::numeric, 2),
  (p.base_impr * (0.6 + random()*0.8))::int,
  (p.base_clicks * (0.6 + random()*0.8))::int,
  greatest(0, round(p.base_leads * (0.4 + random()))::int),
  greatest(0, round(p.base_leads * (0.4 + random()) * 0.35)::int),
  round((p.base_rev * (0.5 + random()))::numeric, 2)
from generate_series(current_date - 29, current_date, interval '1 day') as d
cross join (values
  ('Meta Ads','NB Detailing Promo', 45, 1800, 60, 3, 900),
  ('Google Ads','Search - Mobile Detailing', 55, 900, 45, 2, 750),
  ('Google Business Profile','GBP Organic', 0, 600, 40, 2, 550),
  ('Organic Social','IG / TikTok', 0, 1200, 30, 1, 300)
) as p(platform, campaign, base_spend, base_impr, base_clicks, base_leads, base_rev)
where not exists (select 1 from public.marketing_metrics);

-- =====================================================================
-- Seed complete.
-- =====================================================================
