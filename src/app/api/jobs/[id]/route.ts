import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER, ALL_ROLES } from "@/lib/permissions";
import { getJob, updateJob, archiveJob, getJobHistory, jobBelongsToTech } from "@/lib/jobsDb";
import { Job } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/jobs/:id — expanded job + status history
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    // technicians may only open their assigned jobs
    if (gate.profile.role === "Technician") {
      const ok = gate.profile.technician_id && (await jobBelongsToTech(sb, params.id, gate.profile.technician_id));
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const job = await getJob(sb, params.id);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const history = await getJobHistory(sb, params.id);
    return NextResponse.json({ job, history });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH /api/jobs/:id — edit (admin/manager)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    const body = (await req.json()) as Partial<Job>;
    const job = await updateJob(sb, params.id, body, gate.profile.id);
    return NextResponse.json({ job });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/jobs/:id — archive (admin only)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(["Admin"]);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    await archiveJob(sb, params.id, gate.profile.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
