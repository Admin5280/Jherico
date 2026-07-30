import { SupabaseClient } from "@supabase/supabase-js";
import { Profile } from "./permissions";
import { jobBelongsToTech } from "./jobsDb";

/** True when the caller may access this job: staff always; techs only if assigned. */
export async function canAccessJob(sb: SupabaseClient, profile: Profile, jobId: string): Promise<boolean> {
  if (profile.role === "Admin" || profile.role === "Manager") return true;
  if (profile.role === "Technician" && profile.technician_id) {
    return jobBelongsToTech(sb, jobId, profile.technician_id);
  }
  return false;
}
