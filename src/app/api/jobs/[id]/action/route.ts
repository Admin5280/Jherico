import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ALL_ROLES } from "@/lib/permissions";
import { canAccessJob } from "@/lib/jobAccess";
import { performAction, TechAction } from "@/lib/workflowDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: TechAction[] = ["en_route", "check_in", "start", "complete"];

// POST /api/jobs/:id/action  { action, lat?, lng?, note? }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    if (!(await canAccessJob(sb, gate.profile, params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = (await req.json()) as { action: TechAction; lat?: number; lng?: number; note?: string };
    if (!VALID.includes(body.action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    const source = gate.profile.role === "Technician" ? "technician" : gate.profile.role === "Admin" ? "admin" : "manager";
    const result = await performAction(sb, {
      jobId: params.id,
      action: body.action,
      technicianId: gate.profile.technician_id ?? null,
      actorProfileId: gate.profile.id,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      note: body.note,
      source,
    });
    return NextResponse.json(result);
  } catch (e) {
    // completion-gate failures surface as 422
    const msg = String(e instanceof Error ? e.message : e);
    const status = msg.startsWith("Cannot complete") ? 422 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
