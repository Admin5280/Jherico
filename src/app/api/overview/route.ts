import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { getOverview } from "@/lib/overviewDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ configured: false }, { status: 200 });
  try {
    const data = await getOverview(sb);
    return NextResponse.json({ configured: true, ...data });
  } catch (e) {
    return NextResponse.json({ configured: true, error: String(e) }, { status: 500 });
  }
}
