import { SupabaseClient } from "@supabase/supabase-js";
import { JobServiceItem, JobChecklistItem } from "./types";

/** Snapshot a service onto a job as a job_service_item (price/name frozen at add time). */
export async function addServiceItem(
  sb: SupabaseClient,
  jobId: string,
  serviceId: string,
  opts: { assignedTechnicianId?: string | null; sortOrder?: number } = {},
): Promise<JobServiceItem> {
  const { data: svc, error: se } = await sb.from("services").select("*").eq("id", serviceId).single();
  if (se) throw new Error(se.message);
  const { data, error } = await sb
    .from("job_service_items")
    .insert({
      job_id: jobId,
      service_id: serviceId,
      assigned_technician_id: opts.assignedTechnicianId ?? null,
      service_name_snapshot: svc.name,
      description_snapshot: svc.description ?? "",
      price_snapshot: svc.base_price ?? 0,
      estimated_duration_minutes: svc.default_duration_minutes ?? 60,
      status: "Not Started",
      sort_order: opts.sortOrder ?? 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as JobServiceItem;
}

export async function removeServiceItem(sb: SupabaseClient, itemId: string): Promise<void> {
  const { error } = await sb.from("job_service_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
}

export async function listServiceItems(sb: SupabaseClient, jobId: string): Promise<JobServiceItem[]> {
  const { data, error } = await sb.from("job_service_items").select("*").eq("job_id", jobId).order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as JobServiceItem[];
}

/**
 * Materialize a service item's checklist from its service template (idempotent —
 * skips if the item already has checklist rows). Called when a tech opens a job.
 */
export async function ensureChecklistForItem(sb: SupabaseClient, item: JobServiceItem): Promise<JobChecklistItem[]> {
  const { data: existing } = await sb
    .from("job_checklist_items")
    .select("*")
    .eq("job_service_item_id", item.id)
    .order("sort_order");
  if (existing && existing.length > 0) return existing as JobChecklistItem[];
  if (!item.service_id) return [];

  // find the active template for this service
  const { data: tmpl } = await sb
    .from("service_checklist_templates")
    .select("id")
    .eq("service_id", item.service_id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!tmpl) return [];

  const { data: tItems } = await sb
    .from("service_checklist_template_items")
    .select("*")
    .eq("template_id", tmpl.id)
    .order("sort_order");
  if (!tItems || tItems.length === 0) return [];

  const rows = tItems.map((t) => ({
    job_service_item_id: item.id,
    template_item_id: t.id,
    title_snapshot: t.title,
    description_snapshot: t.description ?? "",
    is_required: t.is_required,
    requires_photo: t.requires_photo,
    status: "Not Started",
    sort_order: t.sort_order,
  }));
  const { data: inserted, error } = await sb.from("job_checklist_items").insert(rows).select("*");
  if (error) throw new Error(error.message);
  return (inserted ?? []) as JobChecklistItem[];
}

/** Ensure checklists exist for every service item on a job; returns them grouped. */
export async function ensureJobChecklists(sb: SupabaseClient, jobId: string): Promise<Record<string, JobChecklistItem[]>> {
  const items = await listServiceItems(sb, jobId);
  const out: Record<string, JobChecklistItem[]> = {};
  for (const item of items) {
    out[item.id] = await ensureChecklistForItem(sb, item);
  }
  return out;
}
