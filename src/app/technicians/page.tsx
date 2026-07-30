"use client";

import { useState } from "react";
import { useApiData, apiGet, apiSend } from "@/lib/api";
import { Technician, TechnicianAvailability } from "@/lib/types";
import { PageHeader, Card, Button, Loading, ErrorState, Empty, Badge, Toast } from "@/components/ui";
import { fullName } from "@/lib/format";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TechniciansPage() {
  const { data, loading, error } = useApiData<{ technicians: Technician[] }>("/api/technicians");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  const techs = data?.technicians ?? [];

  return (
    <>
      <PageHeader title="Technicians" subtitle={`${techs.length} technicians`} />
      {techs.length === 0 ? <Empty label="No technicians yet." /> : (
        <div className="space-y-3">
          {techs.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-ink font-semibold">{fullName(t.first_name, t.last_name)}</div>
                  <div className="text-xs text-muted">{t.employee_code} · {t.phone || "no phone"}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(t.skills ?? []).map((s) => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted">{s}</span>)}
                  </div>
                  <div className="text-xs text-muted mt-2">Areas: {(t.service_areas ?? []).join(", ") || "—"}</div>
                </div>
                <div className="text-right shrink-0">
                  <Badge value={t.employment_status} />
                  <div className="text-xs text-muted mt-2">${t.hourly_rate}/hr · {Math.round((t.commission_rate ?? 0) * 100)}%</div>
                  <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="text-xs text-accent hover:underline mt-2">
                    {expanded === t.id ? "hide availability" : "edit availability"}
                  </button>
                </div>
              </div>
              {expanded === t.id && <AvailabilityEditor techId={t.id} onSaved={() => setToast("Availability saved")} />}
            </Card>
          ))}
        </div>
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

function AvailabilityEditor({ techId, onSaved }: { techId: string; onSaved: () => void }) {
  const [rows, setRows] = useState<Record<number, { start: string; end: string; on: boolean }>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!loaded) {
    apiGet<{ availability: TechnicianAvailability[] }>(`/api/technicians/${techId}/availability`).then((r) => {
      const map: Record<number, { start: string; end: string; on: boolean }> = {};
      for (let d = 0; d < 7; d++) {
        const found = r.availability.find((a) => a.day_of_week === d);
        map[d] = found ? { start: found.available_start, end: found.available_end, on: found.is_available } : { start: "08:00", end: "18:00", on: d >= 1 && d <= 6 };
      }
      setRows(map);
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return <div className="text-xs text-muted mt-3">Loading availability…</div>;
  }

  async function save() {
    setSaving(true);
    try {
      await apiSend(`/api/technicians/${techId}/availability`, "PUT", {
        rows: Object.entries(rows).map(([d, v]) => ({ day_of_week: Number(d), available_start: v.start, available_end: v.end, is_available: v.on })),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DAYS.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-1.5 w-20">
              <input type="checkbox" checked={rows[i]?.on ?? false} onChange={(e) => setRows((r) => ({ ...r, [i]: { ...r[i], on: e.target.checked } }))} className="accent-[#E11A22]" />
              <span className={rows[i]?.on ? "text-ink" : "text-muted"}>{d}</span>
            </label>
            <input type="time" value={rows[i]?.start ?? "08:00"} disabled={!rows[i]?.on}
              onChange={(e) => setRows((r) => ({ ...r, [i]: { ...r[i], start: e.target.value } }))}
              className="bg-base border border-line rounded px-2 py-1 text-xs disabled:opacity-40" />
            <span className="text-muted">–</span>
            <input type="time" value={rows[i]?.end ?? "18:00"} disabled={!rows[i]?.on}
              onChange={(e) => setRows((r) => ({ ...r, [i]: { ...r[i], end: e.target.value } }))}
              className="bg-base border border-line rounded px-2 py-1 text-xs disabled:opacity-40" />
          </div>
        ))}
      </div>
      <div className="mt-3"><Button variant="accent" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save availability"}</Button></div>
    </div>
  );
}
