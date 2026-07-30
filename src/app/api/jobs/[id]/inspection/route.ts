import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ALL_ROLES } from "@/lib/permissions";
import { canAccessJob } from "@/lib/jobAccess";
import { upsertInspection } from "@/lib/workflowDb";
import { InspectionType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/jobs/:id/inspection  { inspection_type, condition_summary?, damage_notes?, customer_concerns?, recommendations?, lat?, lng? }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    if (!(await canAccessJob(sb, gate.profile, params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = (await req.json()) as {
      inspection_type: InspectionType; condition_summary?: string; damage_notes?: string;
      customer_concerns?: string; recommendations?: string; lat?: number; lng?: number;
    };
    if (body.inspection_type !== "pre_service" && body.inspection_type !== "post_service") {
      return NextResponse.json({ error: "Invalid inspection_type" }, { status: 400 });
    }
    const inspection = await upsertInspection(sb, {
      jobId: params.id,
      inspectionType: body.inspection_type,
      completedBy: gate.profile.id,
      condition_summary: body.condition_summary,
      damage_notes: body.damage_notes,
      customer_concerns: body.customer_concerns,
      recommendations: body.recommendations,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
    });
    return NextResponse.json({ inspection });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
