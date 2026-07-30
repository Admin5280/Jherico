import { SupabaseClient } from "@supabase/supabase-js";
import { Service } from "./types";

export async function listServices(sb: SupabaseClient, activeOnly = false): Promise<Service[]> {
  let q = sb.from("services").select("*").order("name", { ascending: true });
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
}
