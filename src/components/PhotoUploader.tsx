"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/imageClient";
import { JobPhoto, PhotoType } from "@/lib/types";

export function PhotoUploader({ jobId, photoType, photos, onChange }: {
  jobId: string; photoType: PhotoType; photos: JobPhoto[]; onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setErr("");
    setBusy(true);
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      try {
        setProgress(Math.round((i / list.length) * 100));
        const dataUrl = await compressImage(list[i]);
        const res = await fetch(`/api/jobs/${jobId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_type: photoType, data_url: dataUrl }),
        });
        if (!res.ok) throw new Error((await res.json())?.error || "Upload failed");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    }
    setProgress(100);
    setBusy(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
    onChange();
  }

  async function remove(photoId: string) {
    await fetch(`/api/jobs/${jobId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_id: photoId }),
    });
    onChange();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-line bg-base">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.signed_url ? <img src={p.signed_url} alt={p.caption || photoType} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-[10px] text-muted">no preview</div>}
            <button onClick={() => remove(p.id)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white text-xs">✕</button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="aspect-square rounded-lg border-2 border-dashed border-line flex flex-col items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
        >
          <span className="text-2xl leading-none">＋</span>
          <span className="text-[11px] mt-1">{busy ? `${progress}%` : "Add photo"}</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {err && <div className="text-xs text-danger mt-2">{err}</div>}
    </div>
  );
}
