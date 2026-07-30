import { SupabaseClient } from "@supabase/supabase-js";
import { Technician, TechnicianAvailability } from "./types";

interface RawProfile { first_name?: string; last_name?: string; phone?: string; email?: string; avatar_url?: string }

function shape(t: Record<string, unknown>): Technician {
  const p = (t.profile as RawProfile) ?? {};
  return {
    ...(t as unknown as Technician),
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    avatar_url: p.avatar_url ?? "",
  };
}

export async function listTechnicians(sb: SupabaseClient): Promise<Technician[]> {
  const { data, error } = await sb
    .from("technicians")
    .select("*, profile:profiles(first_name,last_name,phone,email,avatar_url)")
    .order("employee_code", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(shape);
}

export async function getTechnician(sb: SupabaseClient, id: string): Promise<Technician | null> {
  const { data, error } = await sb
    .from("technicians")
    .select("*, profile:profiles(first_name,last_name,phone,email,avatar_url)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? shape(data as Record<string, unknown>) : null;
}

export async function listAvailability(sb: SupabaseClient, technicianId?: string): Promise<TechnicianAvailability[]> {
  let q = sb.from("technician_availability").select("*").order("day_of_week", { ascending: true });
  if (technicianId) q = q.eq("technician_id", technicianId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as TechnicianAvailability[];
}

/** Replace a technician's weekly availability (7 rows, day_of_week 0..6). */
export async function setAvailability(
  sb: SupabaseClient,
  technicianId: string,
  rows: { day_of_week: number; available_start: string; available_end: string; is_available: boolean }[],
): Promise<TechnicianAvailability[]> {
  await sb.from("technician_availability").delete().eq("technician_id", technicianId).is("effective_date", null);
  const payload = rows.map((r) => ({
    technician_id: technicianId,
    day_of_week: r.day_of_week,
    available_start: r.available_start,
    available_end: r.available_end,
    is_available: r.is_available,
  }));
  const { data, error } = await sb.from("technician_availability").insert(payload).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as TechnicianAvailability[];
}
