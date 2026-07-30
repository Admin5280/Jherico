import { SupabaseClient } from "@supabase/supabase-js";

/** Append an activity_logs row (best-effort; never throws into the caller). */
export async function logActivity(
  sb: SupabaseClient,
  args: {
    actor_profile_id?: string | null;
    entity_type: string;
    entity_id?: string | null;
    action: string;
    old_data?: unknown;
    new_data?: unknown;
  },
): Promise<void> {
  try {
    await sb.from("activity_logs").insert({
      actor_profile_id: args.actor_profile_id ?? null,
      entity_type: args.entity_type,
      entity_id: args.entity_id ?? null,
      action: args.action,
      old_data: args.old_data ?? null,
      new_data: args.new_data ?? null,
    });
  } catch {
    /* logging must never break the request */
  }
}

/** Record a job status change into job_status_history (best-effort). */
export async function logStatusChange(
  sb: SupabaseClient,
  args: {
    job_id: string;
    previous_status: string | null;
    new_status: string;
    changed_by?: string | null;
    change_source?: "admin" | "manager" | "technician" | "webhook" | "system";
    note?: string;
  },
): Promise<void> {
  try {
    await sb.from("job_status_history").insert({
      job_id: args.job_id,
      previous_status: args.previous_status,
      new_status: args.new_status,
      changed_by: args.changed_by ?? null,
      change_source: args.change_source ?? "system",
      note: args.note ?? "",
    });
  } catch {
    /* best effort */
  }
}
