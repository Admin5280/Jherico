import { SupabaseClient } from "@supabase/supabase-js";
import { JobStatus, JobServiceItem, JobChecklistItem, JobInspection, InspectionType, JobPhoto } from "./types";
import { logStatusChange, logActivity } from "./activity";
import { ensureJobChecklists, listServiceItems } from "./jobItemsDb";
import { listJobPhotos } from "./photosDb";

export type TechAction = "en_route" | "check_in" | "start" | "complete";

const ACTION_STATUS: Record<TechAction, JobStatus> = {
  en_route: "En Route",
  check_in: "Checked In",
  start: "In Progress",
  complete: "Completed",
};

export interface ValidationResult {
  canComplete: boolean;
  reasons: string[];
  requiredChecklistTotal: number;
  requiredChecklistDone: number;
  beforePhotoCount: number;
  afterPhotoCount: number;
}

export interface WorkflowState {
  serviceItems: JobServiceItem[];
  checklists: Record<string, JobChecklistItem[]>;
  inspections: JobInspection[];
  photos: JobPhoto[];
  validation: ValidationResult;
}

/** Load (and materialize) a job's technician workflow state. */
export async function getWorkflowState(sb: SupabaseClient, jobId: string): Promise<WorkflowState> {
  const checklists = await ensureJobChecklists(sb, jobId);
  const serviceItems = await listServiceItems(sb, jobId);
  const { data: inspRows } = await sb.from("job_inspections").select("*").eq("job_id", jobId);
  const inspections = (inspRows ?? []) as JobInspection[];
  const photos = await listJobPhotos(sb, jobId);

  const allChecklistItems = Object.values(checklists).flat();
  const required = allChecklistItems.filter((c) => c.is_required);
  const requiredDone = required.filter((c) => c.status === "Completed");
  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  const reasons: string[] = [];
  if (requiredDone.length < required.length) reasons.push(`${required.length - requiredDone.length} required checklist item(s) remaining`);
  if (beforePhotos.length === 0) reasons.push("At least one BEFORE photo is required");
  if (afterPhotos.length === 0) reasons.push("At least one AFTER photo is required");

  return {
    serviceItems,
    checklists,
    inspections,
    photos,
    validation: {
      canComplete: reasons.length === 0,
      reasons,
      requiredChecklistTotal: required.length,
      requiredChecklistDone: requiredDone.length,
      beforePhotoCount: beforePhotos.length,
      afterPhotoCount: afterPhotos.length,
    },
  };
}

/** Perform a technician status action with timestamps + optional GPS. */
export async function performAction(
  sb: SupabaseClient,
  args: {
    jobId: string;
    action: TechAction;
    technicianId?: string | null;
    actorProfileId?: string | null;
    lat?: number | null;
    lng?: number | null;
    note?: string;
    source?: "technician" | "admin" | "manager";
  },
): Promise<{ status: JobStatus }> {
  const { data: job } = await sb.from("jobs").select("id, status").eq("id", args.jobId).single();
  if (!job) throw new Error("Job not found");
  const newStatus = ACTION_STATUS[args.action];
  const now = new Date().toISOString();

  // completion gating
  if (args.action === "complete") {
    const state = await getWorkflowState(sb, args.jobId);
    if (!state.validation.canComplete) {
      throw new Error("Cannot complete: " + state.validation.reasons.join("; "));
    }
  }

  // record the time entry
  const entryTypeMap: Record<TechAction, string> = { en_route: "en_route", check_in: "check_in", start: "start", complete: "complete" };
  await sb.from("job_time_entries").insert({
    job_id: args.jobId,
    technician_id: args.technicianId ?? null,
    entry_type: entryTypeMap[args.action],
    started_at: now,
    latitude: args.lat ?? null,
    longitude: args.lng ?? null,
    note: args.note ?? "",
  });

  // job status update (+ completed_at / duration on complete)
  const update: Record<string, unknown> = { status: newStatus };
  if (args.action === "complete") {
    update.completed_at = now;
    // mark remaining service items completed
    await sb.from("job_service_items").update({ status: "Completed", completed_at: now }).eq("job_id", args.jobId).neq("status", "Completed");
  }
  if (args.action === "start") {
    await sb.from("job_service_items").update({ status: "In Progress", started_at: now }).eq("job_id", args.jobId).eq("status", "Not Started");
  }
  await sb.from("jobs").update(update).eq("id", args.jobId);

  await logStatusChange(sb, {
    job_id: args.jobId, previous_status: job.status, new_status: newStatus,
    changed_by: args.actorProfileId, change_source: args.source ?? "technician",
    note: args.note ?? "",
  });
  await logActivity(sb, {
    actor_profile_id: args.actorProfileId, entity_type: "job", entity_id: args.jobId,
    action: `tech_${args.action}`, new_data: { status: newStatus },
  });

  return { status: newStatus };
}

/** Update a checklist item's status / note (sets completion metadata). */
export async function updateChecklistItem(
  sb: SupabaseClient,
  itemId: string,
  fields: { status?: JobChecklistItem["status"]; technician_note?: string },
  actorProfileId?: string | null,
): Promise<JobChecklistItem> {
  const payload: Record<string, unknown> = {};
  if (fields.status !== undefined) {
    payload.status = fields.status;
    if (fields.status === "Completed") {
      payload.completed_at = new Date().toISOString();
      payload.completed_by = actorProfileId ?? null;
    } else {
      payload.completed_at = null;
    }
  }
  if (fields.technician_note !== undefined) payload.technician_note = fields.technician_note;
  const { data, error } = await sb.from("job_checklist_items").update(payload).eq("id", itemId).select("*").single();
  if (error) throw new Error(error.message);
  return data as JobChecklistItem;
}

/** Create or update a pre/post inspection. */
export async function upsertInspection(
  sb: SupabaseClient,
  args: {
    jobId: string;
    inspectionType: InspectionType;
    completedBy?: string | null;
    condition_summary?: string;
    damage_notes?: string;
    customer_concerns?: string;
    recommendations?: string;
    lat?: number | null;
    lng?: number | null;
  },
): Promise<JobInspection> {
  const { data, error } = await sb
    .from("job_inspections")
    .upsert(
      {
        job_id: args.jobId,
        inspection_type: args.inspectionType,
        completed_by: args.completedBy ?? null,
        condition_summary: args.condition_summary ?? "",
        damage_notes: args.damage_notes ?? "",
        customer_concerns: args.customer_concerns ?? "",
        recommendations: args.recommendations ?? "",
        latitude: args.lat ?? null,
        longitude: args.lng ?? null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "job_id,inspection_type" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as JobInspection;
}
