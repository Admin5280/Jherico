import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ALL_ROLES } from "@/lib/permissions";
import { canAccessJob } from "@/lib/jobAccess";
import { getWorkflowState } from "@/lib/workflowDb";
import { getJob } from "@/lib/jobsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/jobs/:id/workflow → job + materialized checklist/inspection/photo state
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    if (!(await canAccessJob(sb, gate.profile, params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const job = await getJob(sb, params.id);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const state = await getWorkflowState(sb, params.id);
    return NextResponse.json({ job, ...state });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
