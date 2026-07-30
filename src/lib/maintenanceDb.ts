import { SupabaseClient } from "@supabase/supabase-js";
import { MaintenanceClient } from "./types";
import { createJob } from "./jobsDb";
import { assignTechnician } from "./assignmentsDb";

interface RawTech { profile?: { first_name?: string; last_name?: string } | null }

function shape(row: Record<string, unknown>): MaintenanceClient {
  const tech = row.technician as (RawTech & Record<string, unknown>) | null;
  return {
    ...(row as unknown as MaintenanceClient),
    technician: tech
      ? ({ ...(tech as object), first_name: tech.profile?.first_name ?? "", last_name: tech.profile?.last_name ?? "" } as MaintenanceClient["technician"])
      : null,
  };
}

export async function listMaintenance(sb: SupabaseClient): Promise<MaintenanceClient[]> {
  const { data, error } = await sb
    .from("maintenance_clients")
    .select("*, customer:customers(*), vehicle:vehicles(*), technician:technicians(*, profile:profiles(first_name,last_name))")
    .order("next_service_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => shape(r as Record<string, unknown>));
}

/** Create a scheduled job from a maintenance visit. */
export async function createJobFromVisit(sb: SupabaseClient, maintenanceId: string, actorProfileId?: string | null) {
  const { data: m } = await sb
    .from("maintenance_clients")
    .select("*, customer:customers(*)")
    .eq("id", maintenanceId)
    .single();
  if (!m) throw new Error("Maintenance client not found");

  const customer = m.customer as Record<string, unknown> | null;

  // find the Maintenance Detail service
  const { data: svc } = await sb.from("services").select("id, base_price, default_duration_minutes").eq("slug", "maintenance-detail").maybeSingle();

  // schedule at next_service_date (default 9:00) or leave unscheduled
  let scheduledStart: string | null = null;
  if (m.next_service_date) {
    const d = new Date(`${m.next_service_date}T09:00:00`);
    scheduledStart = isNaN(d.getTime()) ? null : d.toISOString();
  }
  const dur = svc?.default_duration_minutes ?? 90;
  const scheduledEnd = scheduledStart ? new Date(new Date(scheduledStart).getTime() + dur * 60000).toISOString() : null;

  const job = await createJob(
    sb,
    {
      customer_id: m.customer_id as string,
      vehicle_id: (m.vehicle_id as string) ?? null,
      service_address: (customer?.address_line_1 as string) ?? "",
      city: (customer?.city as string) ?? "",
      state: (customer?.state as string) ?? "TX",
      postal_code: (customer?.postal_code as string) ?? "",
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      estimated_duration_minutes: dur,
      status: "Scheduled",
      invoice_total: Number(m.monthly_value ?? svc?.base_price ?? 0),
      internal_notes: `Auto-created from maintenance program: ${m.program_name ?? "Maintenance"}`,
      service_ids: svc ? [svc.id as string] : [],
    } as never,
    actorProfileId,
  );

  // assign the program's technician if set
  if (m.assigned_technician_id) {
    await assignTechnician(sb, {
      jobId: job.id,
      technicianId: m.assigned_technician_id as string,
      isPrimary: true,
      force: true,
      actorProfileId,
    });
  }

  return job;
}
