import { SupabaseClient } from "@supabase/supabase-js";
import { JobPhoto, PhotoType } from "./types";

export const BUCKET_FOR: Record<PhotoType, string> = {
  before: "job-before-photos",
  after: "job-after-photos",
  damage: "job-damage-photos",
  profile: "profile-photos",
};

/** Upload a base64 data URL to the correct bucket and record a job_photos row. */
export async function uploadJobPhoto(
  sb: SupabaseClient,
  args: {
    jobId: string;
    jobServiceItemId?: string | null;
    photoType: PhotoType;
    dataUrl: string; // "data:image/jpeg;base64,...."
    caption?: string;
    uploadedBy?: string | null;
    filename?: string;
  },
): Promise<JobPhoto> {
  const bucket = BUCKET_FOR[args.photoType];
  const match = /^data:(.+?);base64,(.*)$/.exec(args.dataUrl);
  if (!match) throw new Error("Invalid image data");
  const contentType = match[1];
  const bytes = Buffer.from(match[2], "base64");
  const ext = contentType.includes("png") ? "png" : "jpg";
  const safeName = (args.filename || `${Date.now()}`).replace(/[^a-z0-9_-]/gi, "") + "." + ext;
  const path = `jobs/${args.jobId}/${args.photoType}/${safeName}`;

  const { error: upErr } = await sb.storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
  if (upErr) throw new Error(upErr.message);

  const { data, error } = await sb
    .from("job_photos")
    .insert({
      job_id: args.jobId,
      job_service_item_id: args.jobServiceItemId ?? null,
      uploaded_by: args.uploadedBy ?? null,
      photo_type: args.photoType,
      storage_path: `${bucket}/${path}`,
      caption: args.caption ?? "",
      taken_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as JobPhoto;
}

/** List a job's photos with short-lived signed URLs for display. */
export async function listJobPhotos(sb: SupabaseClient, jobId: string): Promise<JobPhoto[]> {
  const { data, error } = await sb.from("job_photos").select("*").eq("job_id", jobId).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as JobPhoto[];
  for (const p of rows) {
    const [bucket, ...rest] = p.storage_path.split("/");
    const key = rest.join("/");
    const { data: signed } = await sb.storage.from(bucket).createSignedUrl(key, 3600);
    p.signed_url = signed?.signedUrl ?? "";
  }
  return rows;
}

export async function deleteJobPhoto(sb: SupabaseClient, photoId: string): Promise<void> {
  const { data: photo } = await sb.from("job_photos").select("storage_path").eq("id", photoId).maybeSingle();
  if (photo?.storage_path) {
    const [bucket, ...rest] = (photo.storage_path as string).split("/");
    await sb.storage.from(bucket).remove([rest.join("/")]);
  }
  await sb.from("job_photos").delete().eq("id", photoId);
}
