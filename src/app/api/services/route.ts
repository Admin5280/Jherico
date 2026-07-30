import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ALL_ROLES } from "@/lib/permissions";
import { listServices } from "@/lib/servicesDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ services: [] });
  try {
    return NextResponse.json({ services: await listServices(sb) });
  } catch (e) {
    return NextResponse.json({ services: [], error: String(e) }, { status: 500 });
  }
}
