import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, isGuardError } from "@/lib/authServer";
import { ALL_ROLES } from "@/lib/permissions";
import { canAccessJob } from "@/lib/jobAccess";
import { uploadJobPhoto, listJobPhotos, deleteJobPhoto } from "@/lib/photosDb";
import { PhotoType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ photos: [] });
  try {
    if (!(await canAccessJob(sb, gate.profile, params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ photos: await listJobPhotos(sb, params.id) });
  } catch (e) {
    return NextResponse.json({ photos: [], error: String(e) }, { status: 500 });
  }
}

// POST — upload a base64 data URL  { photo_type, data_url, caption?, job_service_item_id? }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    if (!(await canAccessJob(sb, gate.profile, params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = (await req.json()) as { photo_type: PhotoType; data_url: string; caption?: string; job_service_item_id?: string };
    if (!body.data_url || !body.photo_type) return NextResponse.json({ error: "photo_type and data_url required" }, { status: 400 });
    const photo = await uploadJobPhoto(sb, {
      jobId: params.id,
      jobServiceItemId: body.job_service_item_id ?? null,
      photoType: body.photo_type,
      dataUrl: body.data_url,
      caption: body.caption,
      uploadedBy: gate.profile.id,
    });
    return NextResponse.json({ photo });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE — remove a photo  { photo_id }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(ALL_ROLES);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  try {
    if (!(await canAccessJob(sb, gate.profile, params.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = (await req.json()) as { photo_id: string };
    await deleteJobPhoto(sb, body.photo_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
