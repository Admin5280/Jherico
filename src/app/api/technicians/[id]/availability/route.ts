import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { listAvailability, setAvailability } from "@/lib/techDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ availability: [] });
  try {
    return NextResponse.json({ availability: await listAvailability(sb, params.id) });
  } catch (e) {
    return NextResponse.json({ availability: [], error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    const body = (await req.json()) as { rows: { day_of_week: number; available_start: string; available_end: string; is_available: boolean }[] };
    const availability = await setAvailability(sb, params.id, body.rows ?? []);
    return NextResponse.json({ availability });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
