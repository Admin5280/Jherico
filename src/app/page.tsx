"use client";

import Link from "next/link";
import { useApiData } from "@/lib/api";
import { OverviewData } from "@/lib/overviewDb";
import { PageHeader, Kpi, Section, Card, Loading, ErrorState, JobStatusBadge, Empty } from "@/components/ui";
import { money, fmtTime, fmtDate, shortName, fmtDuration } from "@/lib/format";
import { JobExpanded } from "@/lib/types";

export default function OverviewPage() {
  const { data, loading, error } = useApiData<{ configured: boolean } & OverviewData>("/api/overview");

  if (loading) return <Loading label="Loading command center…" />;
  if (error) return <ErrorState message={error} />;
  if (!data?.cards) return <Empty label="Connect Supabase to load dashboard data — run supabase/schema.sql + seed.sql and set your env vars (see docs/INTEGRATION.md)." />;

  const c = data.cards;

  return (
    <>
      <PageHeader title="Command Center" subtitle="Auto Dude Mobile Detailing · New Braunfels, TX" />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <Kpi label="Jobs Today" value={String(c.jobsToday)} tone="accent" icon="◧" href="/schedule" />
        <Kpi label="Jobs This Week" value={String(c.jobsThisWeek)} icon="▦" href="/jobs" />
        <Kpi label="In Progress" value={String(c.jobsInProgress)} tone="accent" icon="⚙" />
        <Kpi label="Completed (wk)" value={String(c.jobsCompletedWeek)} tone="good" icon="✓" />
        <Kpi label="Needs Assignment" value={String(c.needingAssignment)} tone={c.needingAssignment ? "danger" : "good"} icon="!" href="/schedule" />
        <Kpi label="Maint. Due (14d)" value={String(c.upcomingMaintenance)} tone="warn" icon="✦" href="/maintenance" />
        <Kpi label="New Leads" value={String(c.newLeads)} icon="◎" href="/leads" />
        <Kpi label="Booked Leads" value={String(c.bookedLeads)} tone="good" icon="◎" href="/leads" />
        <Kpi label="Revenue (wk)" value={money(c.revenueWeek)} tone="warn" sub="completed jobs · placeholder" />
        <Kpi label="Active Techs" value={String(c.activeTechnicians)} icon="⛭" href="/technicians" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Today's Schedule">
          {data.todaySchedule.length === 0 ? <Empty label="No jobs scheduled today." /> : (
            <div className="space-y-2">{data.todaySchedule.map((j) => <JobRow key={j.id} job={j} showTech />)}</div>
          )}
        </Section>

        <Section title={`Unassigned Jobs (${data.unassigned.length})`}>
          {data.unassigned.length === 0 ? <Empty label="Everything is assigned. 🎉" /> : (
            <div className="space-y-2">{data.unassigned.map((j) => <JobRow key={j.id} job={j} />)}</div>
          )}
        </Section>

        <Section title={`Jobs Running Late (${data.runningLate.length})`}>
          {data.runningLate.length === 0 ? <Empty label="Nothing running late." /> : (
            <div className="space-y-2">{data.runningLate.map((j) => <JobRow key={j.id} job={j} showTech late />)}</div>
          )}
        </Section>

        <Section title="Recent Completed Jobs">
          {data.recentCompleted.length === 0 ? <Empty label="No completed jobs yet." /> : (
            <div className="space-y-2">{data.recentCompleted.map((j) => <JobRow key={j.id} job={j} showTech />)}</div>
          )}
        </Section>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-2">
        <Section title="Lead Pipeline">
          <Card className="p-4 space-y-2">
            {data.leadPipeline.map((s) => (
              <div key={s.stage} className="flex items-center justify-between text-sm">
                <span className="text-muted">{s.stage}</span>
                <span className="text-ink font-semibold tabular-nums">{s.count}</span>
              </div>
            ))}
            <Link href="/leads" className="text-accent text-xs hover:underline block pt-1">View leads report →</Link>
          </Card>
        </Section>

        <Section title="Maintenance Clients">
          <Card className="p-4 space-y-2 text-sm">
            <Row label="Active" value={String(data.maintenanceSummary.active)} />
            <Row label="Monthly Revenue" value={money(data.maintenanceSummary.monthlyRevenue)} tone="gold" />
            <Row label="Due This Week" value={String(data.maintenanceSummary.dueThisWeek)} />
            <Row label="Past Due" value={String(data.maintenanceSummary.pastDue)} tone={data.maintenanceSummary.pastDue ? "danger" : undefined} />
            <Row label="Needs Scheduling" value={String(data.maintenanceSummary.needsScheduling)} />
            <Link href="/maintenance" className="text-accent text-xs hover:underline block pt-1">View maintenance →</Link>
          </Card>
        </Section>

        <Section title="Marketing (30d)">
          <Card className="p-4 space-y-2 text-sm">
            <Row label="Ad Spend" value={money(data.marketingSummary.spend)} />
            <Row label="Leads" value={String(data.marketingSummary.leads)} />
            <Row label="Cost / Lead" value={money(data.marketingSummary.cpl)} />
            <Row label="Booked Jobs" value={String(data.marketingSummary.booked)} />
            <Row label="Revenue" value={money(data.marketingSummary.revenue)} tone="gold" />
            <Row label="ROAS" value={`${data.marketingSummary.roas.toFixed(1)}x`} tone="good" />
            <Link href="/marketing" className="text-accent text-xs hover:underline block pt-1">View marketing →</Link>
          </Card>
        </Section>
      </div>
    </>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "gold" | "good" | "danger" }) {
  const cls = tone === "gold" ? "text-gold" : tone === "good" ? "text-good" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

function JobRow({ job, showTech, late }: { job: JobExpanded; showTech?: boolean; late?: boolean }) {
  const svc = job.service_items?.[0]?.service_name_snapshot ?? "—";
  const tech = job.primary_technician;
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className={`p-3 hover:border-accent transition-colors ${late ? "border-danger/40" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">
                {job.scheduled_start ? fmtTime(job.scheduled_start) : "Unscheduled"}
              </span>
              <JobStatusBadge status={job.status} />
            </div>
            <div className="text-sm text-ink mt-0.5 truncate">
              {shortName(job.customer?.first_name, job.customer?.last_name)} · {svc}
            </div>
            <div className="text-xs text-muted truncate">
              {job.city} · {fmtDuration(job.estimated_duration_minutes)}
              {job.scheduled_start && ` · ${fmtDate(job.scheduled_start)}`}
            </div>
          </div>
          <div className="text-right shrink-0">
            {showTech && tech && (
              <div className="text-xs text-muted">{tech.first_name} {tech.last_name?.charAt(0)}.</div>
            )}
            {!tech && <span className="text-[10px] text-danger uppercase tracking-wide">unassigned</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
