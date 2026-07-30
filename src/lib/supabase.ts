import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase admin client (uses the service-role key). Never import
// this into a client component — the service key must never reach the browser.
// This client BYPASSES RLS, so every API route must gate on requireRole() and
// scope technician queries to their own assignments (see authServer.ts).
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export const supabaseConfigured = () =>
  !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
