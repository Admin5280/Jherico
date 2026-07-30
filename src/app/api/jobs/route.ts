import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER, ALL_ROLES } from "@/lib/permissions";
import { listJobs, createJob } from "@/lib/jobsDb";
import { Job } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/jobs — all jobs for staff; assigned-only for technicians
export async function GET() {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ configured: false, jobs: [] });
  try {
    const isTech = gate.profile.role === "Technician";
    const jobs = await listJobs(sb, isTech ? { technicianId: gate.profile.technician_id ?? "__none__" } : {});
    return NextResponse.json({ configured: true, jobs });
  } catch (e) {
    return NextResponse.json({ configured: true, jobs: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/jobs — create (admin/manager)
export async function POST(req: NextRequest) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    const body = (await req.json()) as Partial<Job> & { service_ids?: string[] };
    const job = await createJob(sb, body, gate.profile.id);
    return NextResponse.json({ job });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
