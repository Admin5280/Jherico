import { SupabaseClient } from "@supabase/supabase-js";
import { JobAssignment } from "./types";
import { logActivity, logStatusChange } from "./activity";

export interface ConflictInfo {
  conflict: true;
  jobId: string;
  jobNumber: string;
  start: string | null;
  end: string | null;
}

/** Find overlapping assignments for a technician within a time window (excluding one job). */
export async function findConflicts(
  sb: SupabaseClient,
  technicianId: string,
  start: string | null,
  end: string | null,
  excludeJobId?: string,
): Promise<ConflictInfo[]> {
  if (!start || !end) return [];
  // pull this tech's assignments joined to job times
  const { data } = await sb
    .from("job_assignments")
    .select("job_id, job:jobs(id, job_number, scheduled_start, scheduled_end, status)")
    .eq("technician_id", technicianId);
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const out: ConflictInfo[] = [];
  for (const row of data ?? []) {
    const job = (row as Record<string, unknown>).job as { id: string; job_number: string; scheduled_start: string | null; scheduled_end: string | null; status: string } | null;
    if (!job || job.id === excludeJobId) continue;
    if (["Cancelled", "Completed", "No Show", "Rescheduled"].includes(job.status)) continue;
    if (!job.scheduled_start || !job.scheduled_end) continue;
    const js = new Date(job.scheduled_start).getTime();
    const je = new Date(job.scheduled_end).getTime();
    if (s < je && js < e) {
      out.push({ conflict: true, jobId: job.id, jobNumber: job.job_number, start: job.scheduled_start, end: job.scheduled_end });
    }
  }
  return out;
}

export async function listAssignments(sb: SupabaseClient, jobId: string): Promise<JobAssignment[]> {
  const { data, error } = await sb
    .from("job_assignments")
    .select("*, technician:technicians(*, profile:profiles(first_name,last_name,phone))")
    .eq("job_id", jobId);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as JobAssignment[];
}

export interface AssignResult {
  ok?: true;
  assignment?: JobAssignment;
  conflicts?: ConflictInfo[];
}

/**
 * Assign a technician to a job. Returns { conflicts } (without assigning) when
 * an overlap exists and force !== true. Bumps job status to Technician Assigned.
 */
export async function assignTechnician(
  sb: SupabaseClient,
  args: {
    jobId: string;
    technicianId: string;
    isPrimary?: boolean;
    role?: "primary" | "assist";
    force?: boolean;
    actorProfileId?: string | null;
  },
): Promise<AssignResult> {
  const { data: job } = await sb.from("jobs").select("id, job_number, status, scheduled_start, scheduled_end").eq("id", args.jobId).single();
  if (!job) throw new Error("Job not found");

  if (!args.force) {
    const conflicts = await findConflicts(sb, args.technicianId, job.scheduled_start, job.scheduled_end, args.jobId);
    if (conflicts.length) return { conflicts };
  }

  const isPrimary = args.isPrimary ?? true;
  // if making primary, demote existing primaries
  if (isPrimary) {
    await sb.from("job_assignments").update({ is_primary: false }).eq("job_id", args.jobId);
  }

  const { data, error } = await sb
    .from("job_assignments")
    .upsert(
      {
        job_id: args.jobId,
        technician_id: args.technicianId,
        assignment_role: args.role ?? (isPrimary ? "primary" : "assist"),
        is_primary: isPrimary,
        assigned_start: job.scheduled_start,
        assigned_end: job.scheduled_end,
        assigned_by: args.actorProfileId ?? null,
      },
      { onConflict: "job_id,technician_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // advance status when still pre-assignment
  if (["Draft", "Pending Confirmation", "Confirmed", "Scheduled"].includes(job.status)) {
    await sb.from("jobs").update({ status: "Technician Assigned" }).eq("id", args.jobId);
    await logStatusChange(sb, {
      job_id: args.jobId, previous_status: job.status, new_status: "Technician Assigned",
      changed_by: args.actorProfileId, change_source: "admin", note: "Technician assigned",
    });
  }

  await logActivity(sb, {
    actor_profile_id: args.actorProfileId, entity_type: "job", entity_id: args.jobId,
    action: "assign_technician", new_data: { technician_id: args.technicianId },
  });

  return { ok: true, assignment: data as JobAssignment };
}

export async function unassignTechnician(
  sb: SupabaseClient,
  jobId: string,
  technicianId: string,
  actorProfileId?: string | null,
): Promise<void> {
  const { error } = await sb.from("job_assignments").delete().eq("job_id", jobId).eq("technician_id", technicianId);
  if (error) throw new Error(error.message);
  await logActivity(sb, { actor_profile_id: actorProfileId, entity_type: "job", entity_id: jobId, action: "unassign_technician", old_data: { technician_id: technicianId } });
}
