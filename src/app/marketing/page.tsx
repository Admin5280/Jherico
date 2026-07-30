"use client";

import { useState } from "react";
import { useApiData } from "@/lib/api";
import { MarketingData } from "@/lib/marketingDb";
import { PageHeader, Kpi, Card, Input, Loading, ErrorState, Empty, Table, Col } from "@/components/ui";
import { TrendLine, BarChartSimple } from "@/components/charts";
import { money, pct } from "@/lib/format";
import { PlatformSummary } from "@/lib/marketingDb";

export default function MarketingPage() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, loading, error } = useApiData<MarketingData>(`/api/marketing?from=${from}&to=${to}`);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data?.totals) return <Empty label="Connect Supabase to load marketing data (see docs/INTEGRATION.md)." />;

  const t = data.totals;
  const cols: Col<PlatformSummary & { id: string }>[] = [
    { key: "platform", label: "Platform", render: (r) => <span className="text-ink">{r.platform}</span> },
    { key: "ad_spend", label: "Spend", render: (r) => <span className="tabular-nums">{money(r.ad_spend)}</span> },
    { key: "leads", label: "Leads", render: (r) => <span className="tabular-nums">{r.leads}</span> },
    { key: "cpl", label: "CPL", render: (r) => <span className="tabular-nums">{money(r.cpl)}</span> },
    { key: "booked", label: "Booked", render: (r) => <span className="tabular-nums">{r.booked_jobs}</span> },
    { key: "cpbj", label: "Cost/Booked", render: (r) => <span className="tabular-nums">{money(r.cpbj)}</span> },
    { key: "revenue", label: "Revenue", render: (r) => <span className="tabular-nums text-gold">{money(r.revenue)}</span> },
    { key: "roas", label: "ROAS", render: (r) => <span className="tabular-nums text-good">{r.roas.toFixed(1)}x</span> },
    { key: "rate", label: "Book Rate", render: (r) => <span className="tabular-nums">{pct(r.bookingRate)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Marketing Report"
        subtitle="Ad performance by platform"
        actions={
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-muted">→</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <Kpi label="Ad Spend" value={money(t.ad_spend)} />
        <Kpi label="Leads" value={String(t.leads)} tone="accent" />
        <Kpi label="Cost / Lead" value={money(t.cpl)} />
        <Kpi label="Booked Jobs" value={String(t.booked_jobs)} tone="good" />
        <Kpi label="Cost / Booked" value={money(t.cpbj)} />
        <Kpi label="Revenue" value={money(t.revenue)} tone="warn" />
        <Kpi label="ROAS" value={`${t.roas.toFixed(1)}x`} tone="good" />
        <Kpi label="Book Rate" value={pct(t.bookingRate)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-2">Spend vs Revenue Trend</h2>
          <TrendLine data={data.trend} xKey="date" lines={[{ key: "spend", label: "Spend" }, { key: "revenue", label: "Revenue", color: "#F5C542" }]} />
        </div>
        <div>
          <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-2">Revenue by Platform</h2>
          <BarChartSimple data={data.byPlatform as unknown as Record<string, unknown>[]} xKey="platform" bars={[{ key: "revenue", label: "Revenue", color: "#F5C542" }, { key: "ad_spend", label: "Spend" }]} />
        </div>
      </div>

      <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-2">Source Comparison</h2>
      <Table cols={cols} rows={data.byPlatform.map((p) => ({ ...p, id: p.platform }))} />
      <p className="text-[11px] text-muted mt-3">Marketing data is seeded demo content until GHL and ad platforms are connected.</p>
    </>
  );
}
