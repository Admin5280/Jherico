"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApiData } from "@/lib/api";
import { JobExpanded, JOB_STATUSES, JobStatus, SERVICE_AREAS } from "@/lib/types";
import { PageHeader, Card, Button, Input, Select, Loading, ErrorState, Empty, JobStatusBadge, Badge, Table, Col } from "@/components/ui";
import { JobForm } from "@/components/JobForm";
import { money, fmtDateTime, fmtDuration, fullName, isoDate } from "@/lib/format";
import { useAuth } from "@/components/AuthProvider";

export default function JobsPage() {
  const router = useRouter();
  const { can } = useAuth();
  const { data, loading, error, refetch } = useApiData<{ jobs: JobExpanded[] }>("/api/jobs");
  const [view, setView] = useState<"table" | "cards">("table");
  const [showForm, setShowForm] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [tech, setTech] = useState("");
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const jobs = data?.jobs ?? [];

  const techOptions = useMemo(() => {
    const set = new Map<string, string>();
    jobs.forEach((j) => j.primary_technician && set.set(j.primary_technician.id, fullName(j.primary_technician.first_name, j.primary_technician.last_name)));
    return Array.from(set.entries());
  }, [jobs]);

  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.service_items?.forEach((s) => s.service_name_snapshot && set.add(s.service_name_snapshot)));
    return Array.from(set);
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (status && j.status !== status) return false;
      if (tech && j.primary_technician?.id !== tech) return false;
      if (service && !j.service_items?.some((s) => s.service_name_snapshot === service)) return false;
      if (city && j.city !== city) return false;
      if (from && (!j.scheduled_start || isoDate(new Date(j.scheduled_start)) < from)) return false;
      if (to && (!j.scheduled_start || isoDate(new Date(j.scheduled_start)) > to)) return false;
      if (q) {
        const hay = `${j.job_number} ${j.customer?.first_name} ${j.customer?.last_name} ${j.city} ${j.service_items?.map((s) => s.service_name_snapshot).join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [jobs, q, status, tech, service, city, from, to]);

  function clearFilters() {
    setQ(""); setStatus(""); setTech(""); setService(""); setCity(""); setFrom(""); setTo("");
  }

  const cols: Col<JobExpanded>[] = [
    { key: "job_number", label: "Job", render: (j) => <span className="font-mono text-xs text-muted">{j.job_number}</span> },
    { key: "customer", label: "Customer", render: (j) => <span className="text-ink">{fullName(j.customer?.first_name, j.customer?.last_name) || "—"}</span> },
    { key: "vehicle", label: "Vehicle", render: (j) => <span className="text-muted">{j.vehicle ? `${j.vehicle.year ?? ""} ${j.vehicle.make} ${j.vehicle.model}` : "—"}</span> },
    { key: "service", label: "Service", render: (j) => <span className="text-muted">{j.service_items?.map((s) => s.service_name_snapshot).join(", ") || "—"}</span> },
    { key: "city", label: "City", render: (j) => <span className="text-muted">{j.city || "—"}</span> },
    { key: "schedule", label: "Scheduled", render: (j) => <span className="text-muted">{fmtDateTime(j.scheduled_start)}</span> },
    { key: "tech", label: "Technician", render: (j) => <span className="text-muted">{j.primary_technician ? `${j.primary_technician.first_name} ${j.primary_technician.last_name?.charAt(0)}.` : <span className="text-danger">unassigned</span>}</span> },
    { key: "status", label: "Status", render: (j) => <JobStatusBadge status={j.status} /> },
    { key: "pay", label: "Payment", render: (j) => <Badge value={j.payment_status} /> },
    { key: "total", label: "Total", render: (j) => <span className="tabular-nums text-ink">{money(j.invoice_total)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle={`${filtered.length} of ${jobs.length} jobs`}
        actions={
          <>
            <div className="flex rounded-lg border border-line overflow-hidden">
              <button onClick={() => setView("table")} className={`px-3 py-1.5 text-sm ${view === "table" ? "bg-accent text-white" : "text-muted"}`}>Table</button>
              <button onClick={() => setView("cards")} className={`px-3 py-1.5 text-sm ${view === "cards" ? "bg-accent text-white" : "text-muted"}`}>Cards</button>
            </div>
            {can("createJob") && <Button variant="accent" onClick={() => setShowForm(true)}>+ New Job</Button>}
          </>
        }
      />

      {/* filters */}
      <Card className="p-3 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "", label: "All statuses" }, ...JOB_STATUSES.map((s) => ({ value: s, label: s }))]} />
          <Select value={tech} onChange={(e) => setTech(e.target.value)} options={[{ value: "", label: "All techs" }, ...techOptions.map(([id, name]) => ({ value: id, label: name }))]} />
          <Select value={service} onChange={(e) => setService(e.target.value)} options={[{ value: "", label: "All services" }, ...serviceOptions.map((s) => ({ value: s, label: s }))]} />
          <Select value={city} onChange={(e) => setCity(e.target.value)} options={[{ value: "", label: "All cities" }, ...SERVICE_AREAS.map((s) => ({ value: s, label: s }))]} />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(q || status || tech || service || city || from || to) && (
          <button onClick={clearFilters} className="text-xs text-muted hover:text-ink mt-2">clear filters</button>
        )}
      </Card>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : filtered.length === 0 ? <Empty label="No jobs match your filters." /> : view === "table" ? (
        <Table cols={cols} rows={filtered} onRowClick={(j) => router.push(`/jobs/${j.id}`)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((j) => (
            <Card key={j.id} className="p-4 hover:border-accent transition-colors cursor-pointer" >
              <div onClick={() => router.push(`/jobs/${j.id}`)}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{j.job_number}</span>
                  <JobStatusBadge status={j.status} />
                </div>
                <div className="mt-2 text-ink font-semibold">{fullName(j.customer?.first_name, j.customer?.last_name) || "—"}</div>
                <div className="text-sm text-muted">{j.vehicle ? `${j.vehicle.year ?? ""} ${j.vehicle.make} ${j.vehicle.model}` : "—"}</div>
                <div className="text-sm text-ink mt-1">{j.service_items?.map((s) => s.service_name_snapshot).join(", ") || "—"}</div>
                <div className="text-xs text-muted mt-2 flex items-center justify-between">
                  <span>{j.city} · {fmtDuration(j.estimated_duration_minutes)}</span>
                  <span>{money(j.invoice_total)}</span>
                </div>
                <div className="text-xs text-muted mt-1">{fmtDateTime(j.scheduled_start)}</div>
                <div className="text-xs mt-1">{j.primary_technician ? <span className="text-muted">{j.primary_technician.first_name} {j.primary_technician.last_name?.charAt(0)}.</span> : <span className="text-danger">unassigned</span>}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <JobForm open={showForm} onClose={() => setShowForm(false)} onSaved={() => refetch()} />
    </>
  );
}
