import { supabaseServer } from "./supabaseServer";
import { supabaseAdmin } from "./supabase";
import { Profile, Role } from "./permissions";

export const authEnvConfigured = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * The logged-in user's profile (role, technician_id, etc.), or null.
 * Reads via the service role to avoid RLS recursion. When the caller is a
 * technician, their technicians.id is joined on so query helpers can scope.
 */
export async function callerProfile(): Promise<Profile | null> {
  if (!authEnvConfigured()) return null;
  try {
    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = supabaseAdmin();
    if (!admin) return null;

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!profile) return null;

    let technician_id: string | null = null;
    if (profile.role === "Technician") {
      const { data: tech } = await admin
        .from("technicians")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();
      technician_id = tech?.id ?? null;
    }

    return { ...(profile as Profile), technician_id };
  } catch {
    return null;
  }
}

export interface Guard {
  profile: Profile;
}
export interface GuardError {
  error: string;
  status: number;
}
export function isGuardError(g: Guard | GuardError): g is GuardError {
  return "error" in g;
}

/**
 * Guard for API routes. Returns { profile } when allowed, or { error, status }.
 * When auth env vars are missing (setup not complete), fails OPEN as a demo
 * Admin so the app is usable before Supabase Auth is wired — this mirrors the
 * 5280 pattern. Once env vars are present, real gating applies.
 */
export async function requireRole(roles: Role[]): Promise<Guard | GuardError> {
  if (!authEnvConfigured()) {
    return {
      profile: {
        id: "demo-admin",
        first_name: "Demo",
        last_name: "Admin",
        email: "demo@autodude.local",
        phone: "",
        role: "Admin",
        avatar_url: "",
        is_active: true,
        technician_id: null,
      },
    };
  }
  const profile = await callerProfile();
  if (!profile) return { error: "Unauthorized", status: 401 };
  if (!profile.is_active) return { error: "Account disabled", status: 403 };
  if (!roles.includes(profile.role)) return { error: "Forbidden", status: 403 };
  return { profile };
}
