import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ADMIN_MANAGER } from "@/lib/permissions";
import { assignTechnician, findConflicts } from "@/lib/assignmentsDb";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/schedule/move
 * body: { job_id, scheduled_start?, technician_id?, force? }
 * - reschedules (scheduled_start → recompute end from duration)
 * - and/or (re)assigns the primary technician
 * Returns 409 { conflicts } when an overlap exists and force !== true.
 */
export async function POST(req: NextRequest) {
  const gate = await requireRole(ADMIN_MANAGER);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });

  try {
    const body = (await req.json()) as { job_id: string; scheduled_start?: string; technician_id?: string; force?: boolean };
    if (!body.job_id) return NextResponse.json({ error: "job_id required" }, { status: 400 });

    const { data: job } = await sb
      .from("jobs")
      .select("id, status, scheduled_start, scheduled_end, estimated_duration_minutes")
      .eq("id", body.job_id)
      .single();
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // compute the new window
    let newStart = job.scheduled_start as string | null;
    let newEnd = job.scheduled_end as string | null;
    if (body.scheduled_start) {
      newStart = new Date(body.scheduled_start).toISOString();
      newEnd = new Date(new Date(newStart).getTime() + Number(job.estimated_duration_minutes || 120) * 60000).toISOString();
    }

    // determine which tech to conflict-check against
    const targetTech =
      body.technician_id ??
      (
        await sb.from("job_assignments").select("technician_id").eq("job_id", body.job_id).eq("is_primary", true).maybeSingle()
      ).data?.technician_id;

    if (targetTech && !body.force) {
      const conflicts = await findConflicts(sb, targetTech, newStart, newEnd, body.job_id);
      if (conflicts.length) return NextResponse.json({ conflicts }, { status: 409 });
    }

    // apply reschedule
    if (body.scheduled_start) {
      await sb.from("jobs").update({ scheduled_start: newStart, scheduled_end: newEnd }).eq("id", body.job_id);
      // keep any existing assignment window in sync
      await sb.from("job_assignments").update({ assigned_start: newStart, assigned_end: newEnd }).eq("job_id", body.job_id);
      await logActivity(sb, {
        actor_profile_id: gate.profile.id, entity_type: "job", entity_id: body.job_id,
        action: "reschedule", old_data: { scheduled_start: job.scheduled_start }, new_data: { scheduled_start: newStart },
      });
    }

    // apply reassignment (force true here — conflicts already handled above)
    if (body.technician_id) {
      const r = await assignTechnician(sb, {
        jobId: body.job_id, technicianId: body.technician_id, isPrimary: true, force: true, actorProfileId: gate.profile.id,
      });
      return NextResponse.json({ ok: true, assignment: r.assignment, scheduled_start: newStart, scheduled_end: newEnd });
    }

    return NextResponse.json({ ok: true, scheduled_start: newStart, scheduled_end: newEnd });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
