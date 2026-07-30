import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ALL_ROLES } from "@/lib/permissions";
import { canAccessJob } from "@/lib/jobAccess";
import { updateChecklistItem } from "@/lib/workflowDb";
import { JobChecklistItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/jobs/:id/checklist  { item_id, status?, technician_note? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    if (!(await canAccessJob(sb, gate.profile, params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = (await req.json()) as { item_id: string; status?: JobChecklistItem["status"]; technician_note?: string };
    if (!body.item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
    const item = await updateChecklistItem(sb, body.item_id, { status: body.status, technician_note: body.technician_note }, gate.profile.id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
