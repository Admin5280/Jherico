import { SupabaseClient } from "@supabase/supabase-js";
import { Customer, Vehicle } from "./types";

export interface CustomerWithVehicles extends Customer {
  vehicles?: Vehicle[];
}

export async function listCustomers(sb: SupabaseClient): Promise<CustomerWithVehicles[]> {
  const { data, error } = await sb
    .from("customers")
    .select("*, vehicles(*)")
    .order("last_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerWithVehicles[];
}

export async function getCustomer(sb: SupabaseClient, id: string): Promise<CustomerWithVehicles | null> {
  const { data, error } = await sb.from("customers").select("*, vehicles(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CustomerWithVehicles) ?? null;
}

const CUSTOMER_FIELDS: (keyof Customer)[] = [
  "ghl_contact_id", "first_name", "last_name", "email", "phone", "secondary_phone",
  "address_line_1", "address_line_2", "city", "state", "postal_code", "latitude", "longitude", "customer_notes",
];

export async function createCustomer(sb: SupabaseClient, body: Partial<Customer>): Promise<Customer> {
  const payload: Record<string, unknown> = {};
  for (const f of CUSTOMER_FIELDS) if (body[f] !== undefined) payload[f] = body[f];
  const { data, error } = await sb.from("customers").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function updateCustomer(sb: SupabaseClient, id: string, body: Partial<Customer>): Promise<Customer> {
  const payload: Record<string, unknown> = {};
  for (const f of CUSTOMER_FIELDS) if (body[f] !== undefined) payload[f] = body[f];
  const { data, error } = await sb.from("customers").update(payload).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function createVehicle(sb: SupabaseClient, body: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await sb.from("vehicles").insert(body).select("*").single();
  if (error) throw new Error(error.message);
  return data as Vehicle;
}
