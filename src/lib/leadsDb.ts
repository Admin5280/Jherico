import { SupabaseClient } from "@supabase/supabase-js";
import { Lead } from "./types";

export async function listLeads(sb: SupabaseClient): Promise<Lead[]> {
  const { data, error } = await sb.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  booked: number;
  lost: number;
  bookingRate: number; // %
  pipelineValue: number;
}

export function computeLeadStats(leads: Lead[]): LeadStats {
  const by = (s: string) => leads.filter((l) => l.lead_status === s).length;
  const booked = by("Booked");
  const total = leads.length;
  const open = leads.filter((l) => l.lead_status !== "Lost");
  return {
    total,
    new: by("New"),
    contacted: by("Contacted"),
    qualified: by("Qualified"),
    booked,
    lost: by("Lost"),
    bookingRate: total ? (booked / total) * 100 : 0,
    pipelineValue: open.reduce((s, l) => s + Number(l.estimated_value || 0), 0),
  };
}
