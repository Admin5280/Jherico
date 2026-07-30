"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApiData } from "@/lib/api";
import { JobExpanded, Technician, STATUS_TONE } from "@/lib/types";
import { PageHeader, Card, Button, Select, Loading, ErrorState, JobStatusBadge, Toast } from "@/components/ui";
import { moveJob, rescheduleToDate, MoveArgs } from "@/lib/scheduleClient";
import { ConflictInfo } from "@/lib/assignmentsDb";
import { fmtTime, fmtDuration, shortName, isoDate, fullName } from "@/lib/format";

type View = "day" | "week" | "tech";

const TONE_BAR: Record<string, string> = {
  neutral: "border-l-muted", info: "border-l-accent", warn: "border-l-gold",
  active: "border-l-redglow", good: "border-l-good", danger: "border-l-danger",
};

export default function SchedulePage() {
  const { data, loading, error, refetch } = useApiData<{ jobs: JobExpanded[] }>("/api/jobs");
  const { data: techData } = useApiData<{ technicians: Technician[] }>("/api/technicians");
  const [view, setView] = useState<View>("day");
  const [anchor, setAnchor] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [drawer, setDrawer] = useState<JobExpanded | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "good" | "danger" } | null>(null);
  const [pendingMove, setPendingMove] = useState<{ args: MoveArgs; conflicts: ConflictInfo[] } | null>(null);

  const jobs = data?.jobs ?? [];
  const techs = techData?.technicians ?? [];

  function shift(days: number) {
    setAnchor((a) => { const d = new Date(a); d.setDate(d.getDate() + days); return d; });
  }

  async function doMove(args: MoveArgs) {
    const res = await moveJob(args);
    if (res.conflicts) { setPendingMove({ args, conflicts: res.conflicts }); return; }
    if (res.error) { setToast({ msg: res.error, tone: "danger" }); return; }
    setToast({ msg: "Schedule updated", tone: "good" });
    setPendingMove(null);
    refetch();
  }

  if (loading) return <Loading label="Loading schedule…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle="Drag jobs between technicians (day) or days (week) to reschedule"
        actions={
          <div className="flex rounded-lg border border-line overflow-hidden">
            {(["day", "week", "tech"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm capitalize ${view === v ? "bg-accent text-white" : "text-muted"}`}>{v}</button>
            ))}
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={() => shift(view === "day" ? -1 : -7)}>←</Button>
        <Button variant="ghost" onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setAnchor(d); }}>Today</Button>
        <Button variant="outline" onClick={() => shift(view === "day" ? 1 : 7)}>→</Button>
        <span className="text-sm text-ink font-medium ml-2">{rangeLabel(view, anchor)}</span>
        {view === "tech" && (
          <div className="ml-auto w-56">
            <Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}
              options={[{ value: "", label: "— pick technician —" }, ...techs.map((t) => ({ value: t.id, label: fullName(t.first_name, t.last_name) }))]} />
          </div>
        )}
      </div>

      {view === "day" && <DayView jobs={jobs} techs={techs} day={anchor} onMove={doMove} onOpen={setDrawer} />}
      {view === "week" && <WeekView jobs={jobs} anchor={anchor} onMove={doMove} onOpen={setDrawer} />}
      {view === "tech" && <TechView jobs={jobs} techId={selectedTech} anchor={anchor} onOpen={setDrawer} />}

      {drawer && <JobDrawer job={drawer} onClose={() => setDrawer(null)} onMove={doMove} techs={techs} />}

      {pendingMove && (
        <ConflictModal
          conflicts={pendingMove.conflicts}
          onCancel={() => setPendingMove(null)}
          onForce={() => doMove({ ...pendingMove.args, force: true })}
        />
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </>
  );
}

/* ---------------- helpers ---------------- */
function sameDay(iso: string | null | undefined, day: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
}
function weekDays(anchor: Date): Date[] {
  const start = new Date(anchor);
  const dow = (start.getDay() + 6) % 7; // Monday=0
  start.setDate(start.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
}
function rangeLabel(view: View, anchor: Date): string {
  if (view === "day") return anchor.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const days = weekDays(anchor);
  return `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/* ---------------- card ---------------- */
function JobCard({ job, onOpen }: { job: JobExpanded; onOpen: (j: JobExpanded) => void }) {
  const tone = STATUS_TONE[job.status] ?? "neutral";
  const svc = job.service_items?.[0]?.service_name_snapshot ?? "—";
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/job-id", job.id)}
      onClick={() => onOpen(job)}
      className={`bg-surface2 border border-line border-l-4 ${TONE_BAR[tone]} rounded-lg p-2 cursor-grab active:cursor-grabbing hover:border-accent transition-colors`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">{job.scheduled_start ? fmtTime(job.scheduled_start) : "—"}</span>
        <span className="text-[10px] text-muted">{fmtDuration(job.estimated_duration_minutes)}</span>
      </div>
      <div className="text-xs text-ink mt-0.5 truncate">{shortName(job.customer?.first_name, job.customer?.last_name)}</div>
      <div className="text-[11px] text-muted truncate">{svc} · {job.city}</div>
      <div className="mt-1"><JobStatusBadge status={job.status} /></div>
    </div>
  );
}

/* ---------------- day view (tech lanes) ---------------- */
function DayView({ jobs, techs, day, onMove, onOpen }: {
  jobs: JobExpanded[]; techs: Technician[]; day: Date;
  onMove: (a: MoveArgs) => void; onOpen: (j: JobExpanded) => void;
}) {
  const dayJobs = jobs.filter((j) => sameDay(j.scheduled_start, day));
  const unassigned = dayJobs.filter((j) => (j.assignments?.length ?? 0) === 0);

  function lane(techId: string | null, list: JobExpanded[], title: string, subtitle?: string) {
    return (
      <div
        key={techId ?? "unassigned"}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const id = e.dataTransfer.getData("text/job-id");
          if (id && techId) onMove({ job_id: id, technician_id: techId });
        }}
        className="w-64 shrink-0"
      >
        <div className="text-xs font-semibold text-ink uppercase tracking-wide mb-2 flex items-center justify-between">
          <span>{title}</span><span className="text-muted">{list.length}</span>
        </div>
        {subtitle && <div className="text-[10px] text-muted -mt-1 mb-2">{subtitle}</div>}
        <div className="space-y-2 min-h-[120px] bg-base/40 rounded-lg p-2 border border-line/60">
          {list.length === 0 ? <div className="text-[11px] text-muted text-center py-6">Drop here</div> :
            list.sort((a, b) => new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime()).map((j) => <JobCard key={j.id} job={j} onOpen={onOpen} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {lane(null, unassigned, "Unassigned", "not draggable target")}
      {techs.map((t) => lane(t.id, dayJobs.filter((j) => j.primary_technician?.id === t.id), fullName(t.first_name, t.last_name), t.employee_code))}
    </div>
  );
}

/* ---------------- week view (day columns) ---------------- */
function WeekView({ jobs, anchor, onMove, onOpen }: {
  jobs: JobExpanded[]; anchor: Date; onMove: (a: MoveArgs) => void; onOpen: (j: JobExpanded) => void;
}) {
  const days = weekDays(anchor);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
      {days.map((day) => {
        const list = jobs.filter((j) => sameDay(j.scheduled_start, day));
        return (
          <div key={day.toISOString()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/job-id");
              const job = jobs.find((j) => j.id === id);
              if (job) onMove({ job_id: id, scheduled_start: rescheduleToDate(job, isoDate(day)) });
            }}
          >
            <div className="text-xs font-semibold text-ink text-center mb-2">
              {day.toLocaleDateString("en-US", { weekday: "short" })}
              <span className="text-muted ml-1">{day.getDate()}</span>
            </div>
            <div className="space-y-2 min-h-[140px] bg-base/40 rounded-lg p-1.5 border border-line/60">
              {list.map((j) => <JobCard key={j.id} job={j} onOpen={onOpen} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- tech view ---------------- */
function TechView({ jobs, techId, anchor, onOpen }: { jobs: JobExpanded[]; techId: string; anchor: Date; onOpen: (j: JobExpanded) => void }) {
  const days = weekDays(anchor);
  if (!techId) return <Card className="p-8 text-center text-muted text-sm">Pick a technician to see their week.</Card>;
  const techJobs = jobs.filter((j) => j.primary_technician?.id === techId);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
      {days.map((day) => {
        const list = techJobs.filter((j) => sameDay(j.scheduled_start, day));
        const load = list.reduce((s, j) => s + Number(j.estimated_duration_minutes || 0), 0);
        return (
          <div key={day.toISOString()}>
            <div className="text-xs font-semibold text-ink text-center mb-1">
              {day.toLocaleDateString("en-US", { weekday: "short" })} <span className="text-muted">{day.getDate()}</span>
            </div>
            <div className="text-[10px] text-center text-muted mb-1">{fmtDuration(load)}</div>
            <div className="space-y-2 min-h-[140px] bg-base/40 rounded-lg p-1.5 border border-line/60">
              {list.map((j) => <JobCard key={j.id} job={j} onOpen={onOpen} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- job drawer ---------------- */
function JobDrawer({ job, onClose, onMove, techs }: {
  job: JobExpanded; onClose: () => void; onMove: (a: MoveArgs) => void; techs: Technician[];
}) {
  const [start, setStart] = useState(job.scheduled_start ? toLocal(job.scheduled_start) : "");
  const [tech, setTech] = useState(job.primary_technician?.id ?? "");
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md bg-surface border-l border-line h-full overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-head font-semibold text-lg text-ink">{job.job_number}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
        </div>
        <div className="flex items-center gap-2 mb-4"><JobStatusBadge status={job.status} /><span className="text-sm text-muted">{fmtDuration(job.estimated_duration_minutes)}</span></div>
        <div className="space-y-1.5 text-sm mb-4">
          <div className="text-ink font-medium">{fullName(job.customer?.first_name, job.customer?.last_name)}</div>
          <div className="text-muted">{job.vehicle ? `${job.vehicle.year ?? ""} ${job.vehicle.make} ${job.vehicle.model}` : "—"}</div>
          <div className="text-muted">{job.service_items?.map((s) => s.service_name_snapshot).join(", ")}</div>
          <div className="text-muted">{job.service_address}, {job.city}</div>
        </div>
        <div className="space-y-3 border-t border-line pt-4">
          <label className="block"><span className="text-xs text-muted">Scheduled start</span>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none" />
          </label>
          <label className="block"><span className="text-xs text-muted">Primary technician</span>
            <select value={tech} onChange={(e) => setTech(e.target.value)} className="mt-1 w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none">
              <option value="">— unassigned —</option>
              {techs.map((t) => <option key={t.id} value={t.id}>{fullName(t.first_name, t.last_name)}</option>)}
            </select>
          </label>
          <div className="flex gap-2">
            <Button variant="accent" onClick={() => onMove({ job_id: job.id, scheduled_start: start ? new Date(start).toISOString() : undefined, technician_id: tech || undefined })}>Save schedule</Button>
            <Link href={`/jobs/${job.id}`}><Button variant="outline">Full details →</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
function toLocal(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/* ---------------- conflict modal ---------------- */
function ConflictModal({ conflicts, onCancel, onForce }: { conflicts: ConflictInfo[]; onCancel: () => void; onForce: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <Card className="p-5 max-w-sm w-full border-danger/40" >
        <div className="text-danger font-semibold mb-2">⚠ Technician conflict</div>
        <p className="text-sm text-muted mb-3">This move overlaps an existing assignment:</p>
        <ul className="text-xs text-ink space-y-1 mb-4">
          {conflicts.map((c) => <li key={c.jobId}>· {c.jobNumber} at {fmtTime(c.start)}</li>)}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onForce}>Move anyway</Button>
        </div>
      </Card>
    </div>
  );
}
