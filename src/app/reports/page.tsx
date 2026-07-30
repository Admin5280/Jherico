"use client";

import { useApiData } from "@/lib/api";
import { OperationsReport } from "@/lib/reportsDb";
import { PageHeader, Kpi, Loading, ErrorState, BarList } from "@/components/ui";
import { money, pct, fmtDuration } from "@/lib/format";

export default function ReportsPage() {
  const { data, loading, error } = useApiData<{ report: OperationsReport }>("/api/reports");
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data?.report) return null;
  const r = data.report;

  return (
    <>
      <PageHeader title="Operations Reports" subtitle="Field performance across all jobs" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi label="Jobs Completed" value={String(r.jobsCompleted)} tone="good" />
        <Kpi label="Jobs Cancelled" value={String(r.jobsCancelled)} tone="danger" />
        <Kpi label="No Shows" value={String(r.noShows)} tone="danger" />
        <Kpi label="Avg Duration" value={fmtDuration(r.avgDurationMinutes)} />
        <Kpi label="Scheduled Hrs" value={`${r.scheduledHours}h`} />
        <Kpi label="Actual Labor Hrs" value={`${r.actualLaborHours}h`} />
        <Kpi label="Utilization" value={pct(r.utilization)} tone="accent" />
        <Kpi label="Revenue / Job" value={money(r.revenuePerJob)} tone="warn" sub="placeholder" />
        <Kpi label="On-Time Arrival" value={pct(r.onTimeArrivalRate)} tone="good" />
        <Kpi label="Maint. Completion" value={pct(r.maintenanceCompletionRate)} tone="good" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-2">Jobs per Technician</h2>
          <BarList data={r.jobsPerTechnician.map((t) => ({ label: t.technician, value: t.count }))} />
        </div>
        <div>
          <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-2">Jobs by Service</h2>
          <BarList data={r.jobsByService.map((s) => ({ label: s.service, value: s.count }))} />
        </div>
        <div>
          <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-2">Jobs by City</h2>
          <BarList data={r.jobsByCity.map((c) => ({ label: c.city, value: c.count }))} />
        </div>
      </div>
    </>
  );
}
