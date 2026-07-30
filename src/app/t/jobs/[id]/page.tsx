"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiSend } from "@/lib/api";
import { JobExpanded, JobServiceItem, JobChecklistItem, JobInspection, JobPhoto, ChecklistItemStatus } from "@/lib/types";
import { Loading, ErrorState, Toast, Textarea } from "@/components/ui";
import { PhotoUploader } from "@/components/PhotoUploader";
import { withinServiceWindow } from "@/components/TechJobCard";
import { ValidationResult } from "@/lib/workflowDb";
import { fmtDateTime, fmtDuration, mapsUrl } from "@/lib/format";
import { getPosition } from "@/lib/geo";

interface WF {
  job: JobExpanded;
  serviceItems: JobServiceItem[];
  checklists: Record<string, JobChecklistItem[]>;
  inspections: JobInspection[];
  photos: JobPhoto[];
  validation: ValidationResult;
}

export default function TechWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wf, setWf] = useState<WF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "good" | "danger" } | null>(null);
  const [acting, setActing] = useState(false);

  async function load() {
    try {
      const data = await apiGet<WF>(`/api/jobs/${id}/workflow`);
      setWf(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function doAction(action: "en_route" | "check_in" | "start" | "complete") {
    setActing(true);
    const coords = action === "check_in" || action === "en_route" ? await getPosition() : { lat: null, lng: null };
    try {
      const res = await fetch(`/api/jobs/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lat: coords.lat, lng: coords.lng }),
      });
      if (!res.ok) {
        const j = await res.json();
        setToast({ msg: j.error || "Action failed", tone: "danger" });
      } else {
        setToast({ msg: labelFor(action) + " ✓", tone: "good" });
        await load();
      }
    } finally {
      setActing(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!wf) return <ErrorState message="Job not found" />;

  const j = wf.job;
  const reveal = withinServiceWindow(j);
  const phone = j.customer?.phone ?? "";
  const address = `${j.service_address}, ${j.city}, ${j.state} ${j.postal_code}`;
  const pre = wf.inspections.find((i) => i.inspection_type === "pre_service");
  const post = wf.inspections.find((i) => i.inspection_type === "post_service");

  return (
    <div className="pb-24">
      {/* header */}
      <button onClick={() => router.back()} className="text-sm text-muted mb-2">← Back</button>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-head font-bold text-ink">{j.scheduled_start ? fmtDateTime(j.scheduled_start) : "Unscheduled"}</div>
          <div className="text-xs text-muted font-mono">{j.job_number}</div>
        </div>
        <StatusChip status={j.status} />
      </div>

      {/* customer + vehicle */}
      <Panel title="Customer & Vehicle">
        <div className="text-base font-semibold text-ink">
          {reveal ? `${j.customer?.first_name ?? ""} ${j.customer?.last_name ?? ""}`.trim() : `${j.customer?.first_name ?? ""} ${j.customer?.last_name?.[0] ?? ""}.`}
        </div>
        <div className="text-sm text-muted">{j.vehicle ? `${j.vehicle.year ?? ""} ${j.vehicle.make} ${j.vehicle.model} · ${j.vehicle.color} · ${j.vehicle.size_category}` : "—"}</div>
        {j.vehicle?.license_plate && <div className="text-xs text-muted">Plate: {j.vehicle.license_plate}</div>}
        <div className="text-sm text-ink mt-2">{address}</div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <a href={mapsUrl(address, j.latitude, j.longitude)} target="_blank" rel="noreferrer" className="text-center bg-surface2 border border-line rounded-lg py-2.5 text-sm text-ink">🧭 Navigate</a>
          {reveal && phone ? (
            <a href={`tel:${phone}`} className="text-center bg-surface2 border border-line rounded-lg py-2.5 text-sm text-ink">📞 Call</a>
          ) : (
            <span className="text-center border border-line/50 rounded-lg py-2.5 text-sm text-muted">Contact hidden</span>
          )}
          {reveal && phone && <a href={`sms:${phone}`} className="col-span-2 text-center bg-surface2 border border-line rounded-lg py-2.5 text-sm text-ink">💬 Text customer</a>}
        </div>
      </Panel>

      {/* special instructions */}
      {(j.access_instructions || j.customer_notes) && (
        <Panel title="Special Instructions">
          {j.access_instructions && <div className="text-sm text-ink">🔑 {j.access_instructions}</div>}
          {j.customer_notes && <div className="text-sm text-muted mt-1">{j.customer_notes}</div>}
        </Panel>
      )}

      {/* services */}
      <Panel title="Assigned Services">
        {wf.serviceItems.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-line/60 last:border-0">
            <span className="text-sm text-ink">{s.service_name_snapshot}</span>
            <span className="text-xs text-muted">{fmtDuration(s.estimated_duration_minutes)}</span>
          </div>
        ))}
      </Panel>

      {/* pre-service inspection */}
      <Panel title="Pre-Service Inspection">
        <InspectionForm jobId={j.id} type="pre_service" existing={pre} onSaved={(m) => { setToast({ msg: m, tone: "good" }); load(); }} />
      </Panel>

      {/* before photos */}
      <Panel title={`Before Photos${wf.validation.beforePhotoCount ? ` (${wf.validation.beforePhotoCount})` : ""}`} required>
        <PhotoUploader jobId={j.id} photoType="before" photos={wf.photos.filter((p) => p.photo_type === "before")} onChange={load} />
      </Panel>

      {/* checklist */}
      <Panel title="Service Checklist">
        <div className="text-xs text-muted mb-2">{wf.validation.requiredChecklistDone}/{wf.validation.requiredChecklistTotal} required items complete</div>
        {wf.serviceItems.map((s) => (
          <div key={s.id} className="mb-3">
            <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">{s.service_name_snapshot}</div>
            <div className="space-y-1.5">
              {(wf.checklists[s.id] ?? []).map((c) => (
                <ChecklistRow key={c.id} jobId={j.id} item={c} onChanged={load} />
              ))}
            </div>
          </div>
        ))}
      </Panel>

      {/* after-service inspection / tech notes */}
      <Panel title="After-Service Notes & Recommendations">
        <InspectionForm jobId={j.id} type="post_service" existing={post} onSaved={(m) => { setToast({ msg: m, tone: "good" }); load(); }} post />
      </Panel>

      {/* after photos */}
      <Panel title={`After Photos${wf.validation.afterPhotoCount ? ` (${wf.validation.afterPhotoCount})` : ""}`} required>
        <PhotoUploader jobId={j.id} photoType="after" photos={wf.photos.filter((p) => p.photo_type === "after")} onChange={load} />
      </Panel>

      {/* completion gate reasons */}
      {j.status === "In Progress" && !wf.validation.canComplete && (
        <div className="mt-4 text-xs text-gold bg-gold/10 border border-gold/30 rounded-lg p-3">
          <div className="font-semibold mb-1">Before you can complete:</div>
          <ul className="list-disc ml-4 space-y-0.5">{wf.validation.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}

      {/* sticky action bar */}
      <ActionBar status={j.status} acting={acting} canComplete={wf.validation.canComplete} onAction={doAction} onSummary={() => router.push("/t/today")} />

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

function labelFor(a: string): string {
  return { en_route: "En route", check_in: "Checked in", start: "Job started", complete: "Job completed" }[a] ?? a;
}

/* ---------------- panel ---------------- */
function Panel({ title, children, required }: { title: string; children: React.ReactNode; required?: boolean }) {
  return (
    <section className="mt-4 bg-surface border border-line rounded-xl p-4">
      <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-3">
        {title}{required && <span className="text-danger ml-1">*</span>}
      </h2>
      {children}
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  return <span className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wide">{status}</span>;
}

/* ---------------- checklist row ---------------- */
const CYCLE: ChecklistItemStatus[] = ["Not Started", "In Progress", "Completed", "Skipped"];
const CHK_TONE: Record<ChecklistItemStatus, string> = {
  "Not Started": "bg-white/5 text-muted border-line",
  "In Progress": "bg-gold/15 text-gold border-gold/40",
  Completed: "bg-good/15 text-good border-good/40",
  Skipped: "bg-white/5 text-muted border-line line-through",
};

function ChecklistRow({ jobId, item, onChanged }: { jobId: string; item: JobChecklistItem; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(!!item.technician_note);
  const [note, setNote] = useState(item.technician_note ?? "");

  async function setStatus(status: ChecklistItemStatus) {
    setBusy(true);
    try {
      await apiSend(`/api/jobs/${jobId}/checklist`, "PATCH", { item_id: item.id, status });
      onChanged();
    } finally {
      setBusy(false);
    }
  }
  async function saveNote() {
    await apiSend(`/api/jobs/${jobId}/checklist`, "PATCH", { item_id: item.id, technician_note: note });
    onChanged();
  }

  return (
    <div className={`border rounded-lg p-2.5 ${CHK_TONE[item.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm text-ink">{item.title_snapshot}{item.is_required && <span className="text-danger ml-1">*</span>}{item.requires_photo && <span className="ml-1" title="photo recommended">📷</span>}</div>
        </div>
        <button onClick={() => { const next = CYCLE[(CYCLE.indexOf(item.status) + 1) % CYCLE.length]; setStatus(next); }} disabled={busy}
          className="text-xs px-2 py-1 rounded bg-black/30 text-ink shrink-0">{item.status}</button>
      </div>
      <button onClick={() => setNoteOpen((o) => !o)} className="text-[11px] text-muted mt-1">{noteOpen ? "hide note" : "+ note"}</button>
      {noteOpen && (
        <div className="mt-1 flex gap-1.5">
          <input value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote} placeholder="Note…"
            className="flex-1 bg-base border border-line rounded px-2 py-1 text-xs text-ink" />
        </div>
      )}
    </div>
  );
}

/* ---------------- inspection form ---------------- */
function InspectionForm({ jobId, type, existing, onSaved, post }: {
  jobId: string; type: "pre_service" | "post_service"; existing?: JobInspection; onSaved: (m: string) => void; post?: boolean;
}) {
  const [condition, setCondition] = useState(existing?.condition_summary ?? "");
  const [damage, setDamage] = useState(existing?.damage_notes ?? "");
  const [concerns, setConcerns] = useState(existing?.customer_concerns ?? "");
  const [recs, setRecs] = useState(existing?.recommendations ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiSend(`/api/jobs/${jobId}/inspection`, "PUT", {
        inspection_type: type,
        condition_summary: condition,
        damage_notes: damage,
        customer_concerns: concerns,
        recommendations: recs,
      });
      onSaved(post ? "After-service notes saved" : "Inspection saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {!post && (
        <>
          <LabeledArea label="Vehicle condition" value={condition} onChange={setCondition} placeholder="Overall condition, walkaround notes…" />
          <LabeledArea label="Existing damage" value={damage} onChange={setDamage} placeholder="Scratches, dents, chips…" />
          <LabeledArea label="Customer concerns" value={concerns} onChange={setConcerns} placeholder="What the customer flagged…" />
        </>
      )}
      {post && (
        <>
          <LabeledArea label="Final notes" value={condition} onChange={setCondition} placeholder="Summary of work done…" />
          <LabeledArea label="Damage / issues found" value={damage} onChange={setDamage} placeholder="Anything discovered…" />
          <LabeledArea label="Recommended future services" value={recs} onChange={setRecs} placeholder="Ceramic, correction, maintenance…" />
        </>
      )}
      <button onClick={save} disabled={saving} className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
        {saving ? "Saving…" : existing ? "Update" : "Save"}
      </button>
    </div>
  );
}
function LabeledArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <Textarea rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </label>
  );
}

/* ---------------- sticky action bar ---------------- */
function ActionBar({ status, acting, canComplete, onAction, onSummary }: {
  status: string; acting: boolean; canComplete: boolean;
  onAction: (a: "en_route" | "check_in" | "start" | "complete") => void; onSummary: () => void;
}) {
  let content: React.ReactNode = null;
  const base = "w-full rounded-xl py-3.5 font-head font-bold text-lg tracking-wide disabled:opacity-50";

  if (["Confirmed", "Scheduled", "Technician Assigned", "Rescheduled"].includes(status)) {
    content = <button onClick={() => onAction("en_route")} disabled={acting} className={`${base} bg-accent text-white`}>🚗 EN ROUTE</button>;
  } else if (status === "En Route") {
    content = <button onClick={() => onAction("check_in")} disabled={acting} className={`${base} bg-accent text-white`}>📍 CHECK IN</button>;
  } else if (status === "Checked In") {
    content = <button onClick={() => onAction("start")} disabled={acting} className={`${base} bg-accent text-white`}>▶ START JOB</button>;
  } else if (["In Progress", "Waiting"].includes(status)) {
    content = <button onClick={() => onAction("complete")} disabled={acting || !canComplete} className={`${base} ${canComplete ? "bg-good text-white" : "bg-surface2 text-muted"}`}>✓ COMPLETE JOB</button>;
  } else if (status === "Completed") {
    content = <button onClick={onSummary} className={`${base} bg-surface2 text-ink border border-line`}>View Summary →</button>;
  } else {
    content = <div className="text-center text-sm text-muted py-3">No action available ({status})</div>;
  }

  return (
    <div className="fixed bottom-16 inset-x-0 z-30 px-3 md:max-w-md md:mx-auto">
      <div className="bg-base/95 backdrop-blur border border-line rounded-2xl p-2 shadow-card">{content}</div>
    </div>
  );
}
