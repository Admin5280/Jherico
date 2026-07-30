import { SupabaseClient } from "@supabase/supabase-js";
import { Job, JobExpanded, JobStatus, JobServiceItem, Technician } from "./types";
import { logStatusChange, logActivity } from "./activity";
import { addServiceItem } from "./jobItemsDb";

// nested select that pulls customer, vehicle, assignments (+ technician + profile) and service items
const JOB_SELECT = `
  *,
  customer:customers(*),
  vehicle:vehicles(*),
  assignments:job_assignments(*, technician:technicians(*, profile:profiles(first_name,last_name,phone,email,avatar_url))),
  service_items:job_service_items(*)
`;

interface RawTechnician extends Technician {
  profile?: { first_name?: string; last_name?: string; phone?: string; email?: string; avatar_url?: string } | null;
}

/** Flatten a technician's joined profile onto the technician object. */
function shapeTechnician(t: RawTechnician | null | undefined): Technician | null {
  if (!t) return null;
  const p = t.profile ?? {};
  return {
    ...t,
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    avatar_url: p.avatar_url ?? "",
  };
}

function shapeJob(row: Record<string, unknown>): JobExpanded {
  const assignmentsRaw = (row.assignments as Array<Record<string, unknown>>) ?? [];
  const assignments = assignmentsRaw.map((a) => ({
    ...(a as object),
    technician: shapeTechnician(a.technician as RawTechnician),
  })) as JobExpanded["assignments"];
  const primary = assignments?.find((a) => a.is_primary) ?? assignments?.[0];
  return {
    ...(row as unknown as Job),
    customer: (row.customer as JobExpanded["customer"]) ?? null,
    vehicle: (row.vehicle as JobExpanded["vehicle"]) ?? null,
    assignments,
    service_items: ((row.service_items as JobServiceItem[]) ?? []).sort((a, b) => a.sort_order - b.sort_order),
    primary_technician: primary?.technician ?? null,
  };
}

export interface ListJobsOptions {
  technicianId?: string | null; // scope to a technician's assigned jobs
  status?: JobStatus | null;
  includeArchived?: boolean;
}

/** List jobs (expanded). When technicianId is set, only that tech's assigned jobs. */
export async function listJobs(sb: SupabaseClient, opts: ListJobsOptions = {}): Promise<JobExpanded[]> {
  let jobIds: string[] | null = null;
  if (opts.technicianId) {
    const { data: assigns } = await sb
      .from("job_assignments")
      .select("job_id")
      .eq("technician_id", opts.technicianId);
    jobIds = (assigns ?? []).map((a) => a.job_id as string);
    if (jobIds.length === 0) return [];
  }

  let q = sb.from("jobs").select(JOB_SELECT).order("scheduled_start", { ascending: true, nullsFirst: false });
  if (jobIds) q = q.in("id", jobIds);
  if (opts.status) q = q.eq("status", opts.status);
  if (!opts.includeArchived) q = q.is("archived_at", null);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(shapeJob);
}

/** Fetch a single expanded job. Returns null if not found. */
export async function getJob(sb: SupabaseClient, id: string): Promise<JobExpanded | null> {
  const { data, error } = await sb.from("jobs").select(JOB_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? shapeJob(data as Record<string, unknown>) : null;
}

/** Is a job assigned to the given technician? Used to authorize technician access. */
export async function jobBelongsToTech(sb: SupabaseClient, jobId: string, technicianId: string): Promise<boolean> {
  const { data } = await sb
    .from("job_assignments")
    .select("id")
    .eq("job_id", jobId)
    .eq("technician_id", technicianId)
    .maybeSingle();
  return !!data;
}

async function nextJobNumber(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.from("jobs").select("job_number").order("created_at", { ascending: false }).limit(1);
  const last = data?.[0]?.job_number as string | undefined;
  const n = last && /JOB-(\d+)/.test(last) ? parseInt(last.replace(/\D/g, ""), 10) + 1 : 1001;
  return `JOB-${n}`;
}

const EDITABLE_FIELDS: (keyof Job)[] = [
  "customer_id", "vehicle_id", "service_address", "city", "state", "postal_code", "latitude", "longitude",
  "scheduled_start", "scheduled_end", "arrival_window_start", "arrival_window_end", "estimated_duration_minutes",
  "status", "payment_status", "invoice_total", "deposit_amount", "remaining_balance",
  "customer_notes", "internal_notes", "access_instructions", "assigned_vehicle",
  "ghl_appointment_id", "ghl_contact_id", "ghl_opportunity_id",
];

export async function createJob(
  sb: SupabaseClient,
  body: Partial<Job> & { service_ids?: string[] },
  actorProfileId?: string | null,
): Promise<JobExpanded> {
  const payload: Record<string, unknown> = {};
  for (const f of EDITABLE_FIELDS) if (body[f] !== undefined) payload[f] = body[f];
  payload.job_number = body.job_number || (await nextJobNumber(sb));
  if (!payload.status) payload.status = "Draft";

  const { data, error } = await sb.from("jobs").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  const id = data.id as string;

  // snapshot chosen services as job_service_items
  if (body.service_ids && body.service_ids.length) {
    let total = 0;
    for (let i = 0; i < body.service_ids.length; i++) {
      const item = await addServiceItem(sb, id, body.service_ids[i], { sortOrder: i });
      total += Number(item.price_snapshot || 0);
    }
    // seed invoice_total from line items when not explicitly provided
    if (body.invoice_total === undefined && total > 0) {
      await sb.from("jobs").update({ invoice_total: total, remaining_balance: total }).eq("id", id);
    }
  }

  await logStatusChange(sb, {
    job_id: id, previous_status: null, new_status: (payload.status as string) ?? "Draft",
    changed_by: actorProfileId, change_source: "admin", note: "Job created",
  });
  await logActivity(sb, { actor_profile_id: actorProfileId, entity_type: "job", entity_id: id, action: "create", new_data: payload });

  const job = await getJob(sb, id);
  return job as JobExpanded;
}

export async function updateJob(sb: SupabaseClient, id: string, body: Partial<Job>, actorProfileId?: string | null): Promise<JobExpanded> {
  const existing = await getJob(sb, id);
  if (!existing) throw new Error("Job not found");

  const payload: Record<string, unknown> = {};
  for (const f of EDITABLE_FIELDS) if (body[f] !== undefined) payload[f] = body[f];

  const statusChanged = payload.status && payload.status !== existing.status;
  if (payload.status === "Completed" && existing.status !== "Completed") payload.completed_at = new Date().toISOString();

  const { error } = await sb.from("jobs").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  if (statusChanged) {
    await logStatusChange(sb, {
      job_id: id, previous_status: existing.status, new_status: payload.status as string,
      changed_by: actorProfileId, change_source: "admin",
    });
  }
  await logActivity(sb, { actor_profile_id: actorProfileId, entity_type: "job", entity_id: id, action: "update", old_data: existing, new_data: payload });

  return (await getJob(sb, id)) as JobExpanded;
}

export async function archiveJob(sb: SupabaseClient, id: string, actorProfileId?: string | null): Promise<void> {
  const { error } = await sb.from("jobs").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity(sb, { actor_profile_id: actorProfileId, entity_type: "job", entity_id: id, action: "archive" });
}

/** Job status history (newest first) with actor names. */
export async function getJobHistory(sb: SupabaseClient, jobId: string) {
  const { data, error } = await sb
    .from("job_status_history")
    .select("*, changer:profiles(first_name,last_name)")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const c = (r as Record<string, unknown>).changer as { first_name?: string; last_name?: string } | null;
    return { ...r, changed_by_name: c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() : "" };
  });
}
