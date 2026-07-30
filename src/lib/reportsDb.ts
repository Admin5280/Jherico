import { SupabaseClient } from "@supabase/supabase-js";
import { listJobs } from "./jobsDb";

export interface OperationsReport {
  jobsCompleted: number;
  jobsCancelled: number;
  noShows: number;
  avgDurationMinutes: number;
  scheduledHours: number;
  actualLaborHours: number;
  utilization: number;      // %
  revenuePerJob: number;
  jobsPerTechnician: { technician: string; count: number }[];
  jobsByService: { service: string; count: number }[];
  jobsByCity: { city: string; count: number }[];
  onTimeArrivalRate: number; // %
  maintenanceCompletionRate: number; // %
}

export async function getOperationsReport(sb: SupabaseClient): Promise<OperationsReport> {
  const jobs = await listJobs(sb);
  const completed = jobs.filter((j) => j.status === "Completed");
  const cancelled = jobs.filter((j) => j.status === "Cancelled");
  const noShows = jobs.filter((j) => j.status === "No Show");

  const totalDuration = completed.reduce((s, j) => s + Number(j.estimated_duration_minutes || 0), 0);
  const avgDuration = completed.length ? totalDuration / completed.length : 0;
  const scheduledHours = jobs.reduce((s, j) => s + Number(j.estimated_duration_minutes || 0), 0) / 60;
  const actualLaborHours = totalDuration / 60; // proxy: completed jobs' planned duration

  const revenue = completed.reduce((s, j) => s + Number(j.invoice_total || 0), 0);
  const revenuePerJob = completed.length ? revenue / completed.length : 0;

  // jobs per technician (primary)
  const techMap = new Map<string, number>();
  jobs.forEach((j) => {
    const t = j.primary_technician;
    if (t) {
      const name = `${t.first_name} ${t.last_name}`.trim();
      techMap.set(name, (techMap.get(name) ?? 0) + 1);
    }
  });
  const jobsPerTechnician = Array.from(techMap.entries()).map(([technician, count]) => ({ technician, count })).sort((a, b) => b.count - a.count);

  // by service
  const svcMap = new Map<string, number>();
  jobs.forEach((j) => j.service_items?.forEach((s) => svcMap.set(s.service_name_snapshot, (svcMap.get(s.service_name_snapshot) ?? 0) + 1)));
  const jobsByService = Array.from(svcMap.entries()).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count);

  // by city
  const cityMap = new Map<string, number>();
  jobs.forEach((j) => { if (j.city) cityMap.set(j.city, (cityMap.get(j.city) ?? 0) + 1); });
  const jobsByCity = Array.from(cityMap.entries()).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);

  // on-time arrival: check_in time vs scheduled_start (from time entries)
  const { data: checkIns } = await sb.from("job_time_entries").select("job_id, started_at").eq("entry_type", "check_in");
  let onTime = 0;
  let arrivals = 0;
  for (const ci of checkIns ?? []) {
    const job = jobs.find((j) => j.id === ci.job_id);
    if (!job?.scheduled_start || !ci.started_at) continue;
    arrivals++;
    const late = new Date(ci.started_at).getTime() - new Date(job.scheduled_start).getTime();
    if (late <= 15 * 60000) onTime++; // within 15 min grace
  }
  const onTimeArrivalRate = arrivals ? (onTime / arrivals) * 100 : 0;

  // maintenance completion rate
  const { data: maint } = await sb.from("maintenance_clients").select("status");
  const maintRows = maint ?? [];
  const maintActive = maintRows.filter((m) => ["Active", "Past Due", "Needs Scheduling"].includes(m.status)).length;
  const maintOk = maintRows.filter((m) => m.status === "Active").length;
  const maintenanceCompletionRate = maintActive ? (maintOk / maintActive) * 100 : 0;

  // utilization: actual labor vs scheduled capacity (rough): completed duration / scheduled duration
  const utilization = scheduledHours ? (actualLaborHours / scheduledHours) * 100 : 0;

  return {
    jobsCompleted: completed.length,
    jobsCancelled: cancelled.length,
    noShows: noShows.length,
    avgDurationMinutes: Math.round(avgDuration),
    scheduledHours: Math.round(scheduledHours * 10) / 10,
    actualLaborHours: Math.round(actualLaborHours * 10) / 10,
    utilization: Math.round(utilization),
    revenuePerJob,
    jobsPerTechnician,
    jobsByService,
    jobsByCity,
    onTimeArrivalRate: Math.round(onTimeArrivalRate),
    maintenanceCompletionRate: Math.round(maintenanceCompletionRate),
  };
}
