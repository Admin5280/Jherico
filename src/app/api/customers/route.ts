import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { listCustomers, createCustomer } from "@/lib/customersDb";
import { Customer } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ customers: [] });
  try {
    return NextResponse.json({ customers: await listCustomers(sb) });
  } catch (e) {
    return NextResponse.json({ customers: [], error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    const body = (await req.json()) as Partial<Customer>;
    return NextResponse.json({ customer: await createCustomer(sb, body) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
