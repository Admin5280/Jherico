import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { assignTechnician, unassignTechnician } from "@/lib/assignmentsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/jobs/:id/assign  { technician_id, is_primary?, role?, force? }
// → 200 { conflicts } when overlap & !force ; 200 { ok, assignment } otherwise
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    const body = (await req.json()) as { technician_id: string; is_primary?: boolean; role?: "primary" | "assist"; force?: boolean };
    if (!body.technician_id) return NextResponse.json({ error: "technician_id required" }, { status: 400 });
    const result = await assignTechnician(sb, {
      jobId: params.id,
      technicianId: body.technician_id,
      isPrimary: body.is_primary,
      role: body.role,
      force: body.force,
      actorProfileId: gate.profile.id,
    });
    if (result.conflicts) return NextResponse.json({ conflicts: result.conflicts }, { status: 409 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/jobs/:id/assign  { technician_id }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    const body = (await req.json()) as { technician_id: string };
    await unassignTechnician(sb, params.id, body.technician_id, gate.profile.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
