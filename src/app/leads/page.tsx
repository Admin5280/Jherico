"use client";

import { useMemo, useState } from "react";
import { useApiData } from "@/lib/api";
import { Lead, LEAD_STATUSES, LEAD_SOURCES } from "@/lib/types";
import { computeLeadStats } from "@/lib/leadsDb";
import { PageHeader, Kpi, Card, Input, Select, Loading, ErrorState, Empty, Badge, Table, Col } from "@/components/ui";
import { money, pct, fmtDate, fullName } from "@/lib/format";

export default function LeadsPage() {
  const { data, loading, error } = useApiData<{ leads: Lead[] }>("/api/leads");
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const leads = data?.leads ?? [];

  const services = useMemo(() => Array.from(new Set(leads.map((l) => l.service_interest).filter(Boolean))), [leads]);

  const filtered = useMemo(() => leads.filter((l) => {
    if (source && l.source !== source) return false;
    if (status && l.lead_status !== status) return false;
    if (service && l.service_interest !== service) return false;
    if (q) {
      const hay = `${l.first_name} ${l.last_name} ${l.phone} ${l.email} ${l.campaign}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [leads, q, source, status, service]);

  const stats = useMemo(() => computeLeadStats(filtered), [filtered]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const cols: Col<Lead>[] = [
    { key: "name", label: "Lead", render: (l) => <span className="text-ink">{fullName(l.first_name, l.last_name) || "—"}</span> },
    { key: "phone", label: "Phone", render: (l) => <span className="text-muted">{l.phone}</span> },
    { key: "source", label: "Source", render: (l) => <span className="text-muted">{l.source}</span> },
    { key: "campaign", label: "Campaign", render: (l) => <span className="text-muted">{l.campaign || "—"}</span> },
    { key: "service", label: "Interest", render: (l) => <span className="text-muted">{l.service_interest || "—"}</span> },
    { key: "stage", label: "Stage", render: (l) => <span className="text-muted">{l.pipeline_stage || "—"}</span> },
    { key: "status", label: "Status", render: (l) => <Badge value={l.lead_status} /> },
    { key: "value", label: "Est. Value", render: (l) => <span className="tabular-nums text-gold">{money(l.estimated_value)}</span> },
    { key: "created", label: "Created", render: (l) => <span className="text-muted">{fmtDate(l.created_at)}</span> },
  ];

  return (
    <>
      <PageHeader title="Leads Report" subtitle={`${filtered.length} of ${leads.length} leads`} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <Kpi label="Total" value={String(stats.total)} />
        <Kpi label="New" value={String(stats.new)} tone="accent" />
        <Kpi label="Contacted" value={String(stats.contacted)} tone="warn" />
        <Kpi label="Qualified" value={String(stats.qualified)} tone="accent" />
        <Kpi label="Booked" value={String(stats.booked)} tone="good" />
        <Kpi label="Lost" value={String(stats.lost)} tone="danger" />
        <Kpi label="Booking Rate" value={pct(stats.bookingRate)} tone="good" />
        <Kpi label="Pipeline Value" value={money(stats.pipelineValue)} tone="warn" />
      </div>

      <Card className="p-3 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={source} onChange={(e) => setSource(e.target.value)} options={[{ value: "", label: "All sources" }, ...LEAD_SOURCES.map((s) => ({ value: s, label: s }))]} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "", label: "All statuses" }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s }))]} />
          <Select value={service} onChange={(e) => setService(e.target.value)} options={[{ value: "", label: "All services" }, ...services.map((s) => ({ value: s, label: s }))]} />
        </div>
      </Card>

      {filtered.length === 0 ? <Empty label="No leads match your filters." /> : <Table cols={cols} rows={filtered} />}
      <p className="text-[11px] text-muted mt-3">Lead data is seeded demo content; fields are prepared for GHL webhook sync.</p>
    </>
  );
}
