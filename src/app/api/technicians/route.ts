import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { listTechnicians } from "@/lib/techDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ technicians: [] });
  try {
    return NextResponse.json({ technicians: await listTechnicians(sb) });
  } catch (e) {
    return NextResponse.json({ technicians: [], error: String(e) }, { status: 500 });
  }
}
