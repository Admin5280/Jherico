"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApiData, apiSend } from "@/lib/api";
import { MaintenanceClient } from "@/lib/types";
import { PageHeader, Kpi, Card, Button, Loading, ErrorState, Empty, Badge, Table, Col, Toast } from "@/components/ui";
import { money, fmtDate, fullName } from "@/lib/format";
import { useAuth } from "@/components/AuthProvider";

export default function MaintenancePage() {
  const router = useRouter();
  const { can } = useAuth();
  const { data, loading, error } = useApiData<{ maintenance: MaintenanceClient[] }>("/api/maintenance");
  const [toast, setToast] = useState<{ msg: string; tone: "good" | "danger" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const rows = data?.maintenance ?? [];

  const stats = useMemo(() => {
    const active = rows.filter((m) => m.status === "Active");
    const now = new Date();
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
    const dueThisWeek = rows.filter((m) => m.next_service_date && new Date(m.next_service_date) <= weekEnd && new Date(m.next_service_date) >= new Date(now.toDateString()));
    const pastDue = rows.filter((m) => m.status === "Past Due");
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cancelledThisMonth = rows.filter((m) => m.status === "Cancelled" && m.updated_at && new Date(m.updated_at) >= monthStart);
    return {
      active: active.length,
      monthlyRevenue: active.reduce((s, m) => s + Number(m.monthly_value || 0), 0),
      dueThisWeek: dueThisWeek.length,
      pastDue: pastDue.length,
      cancelledThisMonth: cancelledThisMonth.length,
    };
  }, [rows]);

  async function createVisit(m: MaintenanceClient) {
    setBusy(m.id);
    try {
      const res = await apiSend<{ job: { id: string } }>("/api/maintenance", "POST", { maintenance_id: m.id });
      setToast({ msg: "Job created from visit", tone: "good" });
      setTimeout(() => router.push(`/jobs/${res.job.id}`), 600);
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : String(e), tone: "danger" });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const cols: Col<MaintenanceClient>[] = [
    { key: "customer", label: "Customer", render: (m) => <span className="text-ink">{fullName(m.customer?.first_name, m.customer?.last_name)}</span> },
    { key: "vehicle", label: "Vehicle", render: (m) => <span className="text-muted">{m.vehicle ? `${m.vehicle.year ?? ""} ${m.vehicle.make} ${m.vehicle.model}` : "—"}</span> },
    { key: "program", label: "Program", render: (m) => <span className="text-muted">{m.program_name || "—"}</span> },
    { key: "frequency", label: "Frequency", render: (m) => <span className="text-muted">{m.frequency}</span> },
    { key: "last", label: "Last Service", render: (m) => <span className="text-muted">{fmtDate(m.last_service_date)}</span> },
    { key: "next", label: "Next Service", render: (m) => <span className="text-ink">{fmtDate(m.next_service_date)}</span> },
    { key: "tech", label: "Technician", render: (m) => <span className="text-muted">{m.technician ? `${m.technician.first_name} ${m.technician.last_name?.charAt(0)}.` : "—"}</span> },
    { key: "value", label: "Monthly", render: (m) => <span className="tabular-nums text-gold">{money(m.monthly_value)}</span> },
    { key: "status", label: "Status", render: (m) => <Badge value={m.status} /> },
    { key: "action", label: "", render: (m) => can("createJob") ? <Button variant="outline" onClick={() => createVisit(m)} disabled={busy === m.id}>{busy === m.id ? "…" : "Create job"}</Button> : null },
  ];

  return (
    <>
      <PageHeader title="Maintenance Clients" subtitle={`${rows.length} programs`} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Kpi label="Active Clients" value={String(stats.active)} tone="good" />
        <Kpi label="Monthly Revenue" value={money(stats.monthlyRevenue)} tone="warn" />
        <Kpi label="Due This Week" value={String(stats.dueThisWeek)} tone="accent" />
        <Kpi label="Past Due" value={String(stats.pastDue)} tone={stats.pastDue ? "danger" : "default"} />
        <Kpi label="Cancelled (mo)" value={String(stats.cancelledThisMonth)} />
      </div>
      {rows.length === 0 ? <Empty label="No maintenance clients yet." /> : <Table cols={cols} rows={rows} />}
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </>
  );
}
