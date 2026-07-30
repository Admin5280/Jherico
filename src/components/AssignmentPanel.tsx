"use client";

import { useEffect, useState } from "react";
import { Card, Button, Select, Toast } from "./ui";
import { apiGet, apiSend } from "@/lib/api";
import { JobExpanded, Technician } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { ConflictInfo } from "@/lib/assignmentsDb";

export function AssignmentPanel({ job, onChanged, canEdit }: { job: JobExpanded; onChanged: () => void; canEdit: boolean }) {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "good" | "danger" } | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[] | null>(null);

  useEffect(() => {
    if (!canEdit) return;
    apiGet<{ technicians: Technician[] }>("/api/technicians").then((r) => setTechs(r.technicians)).catch(() => {});
  }, [canEdit]);

  async function assign(force = false) {
    if (!pick) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technician_id: pick, is_primary: true, force }),
      });
      if (res.status === 409) {
        const j = await res.json();
        setConflicts(j.conflicts);
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error((await res.json())?.error || "Failed");
      setConflicts(null);
      setPick("");
      setToast({ msg: "Technician assigned", tone: "good" });
      onChanged();
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : String(e), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function unassign(technicianId: string) {
    setBusy(true);
    try {
      await apiSend(`/api/jobs/${job.id}/assign`, "DELETE", { technician_id: technicianId });
      setToast({ msg: "Technician removed", tone: "good" });
      onChanged();
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : String(e), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  const assigned = job.assignments ?? [];
  const availableTechs = techs.filter((t) => !assigned.some((a) => a.technician_id === t.id));

  return (
    <Card className="p-4 space-y-3">
      {assigned.length === 0 ? (
        <div className="text-sm text-danger">No technician assigned.</div>
      ) : (
        <div className="space-y-2">
          {assigned.map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-ink">{a.technician?.first_name} {a.technician?.last_name} {a.is_primary && <span className="text-[10px] text-accent uppercase ml-1">primary</span>}</div>
                <div className="text-xs text-muted">{a.technician?.employee_code}</div>
              </div>
              {canEdit && <button onClick={() => unassign(a.technician_id)} className="text-xs text-danger hover:underline" disabled={busy}>remove</button>}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="flex gap-2 pt-1">
          <Select value={pick} onChange={(e) => setPick(e.target.value)}
            options={[{ value: "", label: "— assign technician —" }, ...availableTechs.map((t) => ({ value: t.id, label: `${t.first_name} ${t.last_name} (${t.employee_code})` }))]} />
          <Button variant="accent" onClick={() => assign(false)} disabled={!pick || busy}>Assign</Button>
        </div>
      )}

      {conflicts && (
        <div className="border border-danger/40 bg-danger/10 rounded-lg p-3 text-sm">
          <div className="text-danger font-medium mb-1">⚠ Scheduling conflict</div>
          {conflicts.map((c) => (
            <div key={c.jobId} className="text-xs text-muted">Overlaps {c.jobNumber} · {fmtDateTime(c.start)}</div>
          ))}
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={() => setConflicts(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => assign(true)} disabled={busy}>Assign anyway</Button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
  );
}
