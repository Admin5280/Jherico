import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { listMaintenance, createJobFromVisit } from "@/lib/maintenanceDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ maintenance: [] });
  try {
    return NextResponse.json({ maintenance: await listMaintenance(sb) });
  } catch (e) {
    return NextResponse.json({ maintenance: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/maintenance  { maintenance_id }  → create a job from the visit
export async function POST(req: NextRequest) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    const body = (await req.json()) as { maintenance_id: string };
    if (!body.maintenance_id) return NextResponse.json({ error: "maintenance_id required" }, { status: 400 });
    const job = await createJobFromVisit(sb, body.maintenance_id, gate.profile.id);
    return NextResponse.json({ job });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
