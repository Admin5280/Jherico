import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { listLeads } from "@/lib/leadsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ leads: [] });
  try {
    return NextResponse.json({ leads: await listLeads(sb) });
  } catch (e) {
    return NextResponse.json({ leads: [], error: String(e) }, { status: 500 });
  }
}
