import { SupabaseClient } from "@supabase/supabase-js";
import { listJobs } from "./jobsDb";
import { JobExpanded } from "./types";
import { startOfToday, endOfToday, startOfWeek, endOfWeek, daysAgo, daysFromNow, inRange } from "./dates";

const ACTIVE_STATUSES = ["En Route", "Checked In", "In Progress", "Waiting"];
const OPEN_STATUSES = ["Confirmed", "Scheduled", "Technician Assigned", "En Route", "Checked In", "In Progress", "Waiting", "Pending Confirmation"];

export interface OverviewData {
  cards: {
    jobsToday: number;
    jobsThisWeek: number;
    jobsInProgress: number;
    jobsCompletedWeek: number;
    needingAssignment: number;
    upcomingMaintenance: number;
    newLeads: number;
    bookedLeads: number;
    revenueWeek: number;
    activeTechnicians: number;
  };
  todaySchedule: JobExpanded[];
  unassigned: JobExpanded[];
  runningLate: JobExpanded[];
  recentCompleted: JobExpanded[];
  leadPipeline: { stage: string; count: number }[];
  maintenanceSummary: { active: number; monthlyRevenue: number; dueThisWeek: number; pastDue: number; needsScheduling: number };
  marketingSummary: { spend: number; leads: number; booked: number; revenue: number; roas: number; cpl: number };
}

function hasAssignment(j: JobExpanded): boolean {
  return (j.assignments?.length ?? 0) > 0;
}

export async function getOverview(sb: SupabaseClient): Promise<OverviewData> {
  const jobs = await listJobs(sb);
  const now = Date.now();

  const today = jobs.filter((j) => inRange(j.scheduled_start, startOfToday(), endOfToday()));
  const week = jobs.filter((j) => inRange(j.scheduled_start, startOfWeek(), endOfWeek()));
  const inProgress = jobs.filter((j) => ACTIVE_STATUSES.includes(j.status));
  const completedWeek = jobs.filter((j) => j.status === "Completed" && inRange(j.completed_at || j.scheduled_start, startOfWeek(), endOfWeek()));
  const needsAssignment = jobs.filter((j) => !hasAssignment(j) && j.scheduled_start && !["Cancelled", "Completed", "No Show", "Draft"].includes(j.status));
  const runningLate = jobs.filter(
    (j) => j.scheduled_start && new Date(j.scheduled_start).getTime() < now &&
      ["Confirmed", "Scheduled", "Technician Assigned", "En Route"].includes(j.status),
  );
  const recentCompleted = jobs
    .filter((j) => j.status === "Completed")
    .sort((a, b) => new Date(b.completed_at || b.scheduled_start || 0).getTime() - new Date(a.completed_at || a.scheduled_start || 0).getTime())
    .slice(0, 6);

  const revenueWeek = completedWeek.reduce((s, j) => s + Number(j.invoice_total || 0), 0);

  // technicians
  const { data: techs } = await sb.from("technicians").select("id, employment_status");
  const activeTechnicians = (techs ?? []).filter((t) => t.employment_status === "Active").length;

  // leads
  const { data: leads } = await sb.from("leads").select("lead_status, created_at, estimated_value");
  const leadRows = leads ?? [];
  const newLeads = leadRows.filter((l) => l.lead_status === "New" && inRange(l.created_at, daysAgo(30), daysFromNow(1))).length;
  const bookedLeads = leadRows.filter((l) => l.lead_status === "Booked").length;
  const pipelineStages = ["New", "Contacted", "Qualified", "Booked", "Lost"];
  const leadPipeline = pipelineStages.map((stage) => ({ stage, count: leadRows.filter((l) => l.lead_status === stage).length }));

  // maintenance
  const { data: maint } = await sb.from("maintenance_clients").select("status, monthly_value, next_service_date");
  const maintRows = maint ?? [];
  const active = maintRows.filter((m) => m.status === "Active").length;
  const monthlyRevenue = maintRows.filter((m) => m.status === "Active").reduce((s, m) => s + Number(m.monthly_value || 0), 0);
  const dueThisWeek = maintRows.filter((m) => inRange(m.next_service_date ? m.next_service_date + "T00:00:00" : null, startOfToday(), endOfWeek())).length;
  const pastDue = maintRows.filter((m) => m.status === "Past Due").length;
  const needsScheduling = maintRows.filter((m) => m.status === "Needs Scheduling").length;
  const upcomingMaintenance = maintRows.filter((m) => inRange(m.next_service_date ? m.next_service_date + "T00:00:00" : null, startOfToday(), daysFromNow(14))).length;

  // marketing (last 30 days)
  const { data: mktg } = await sb.from("marketing_metrics").select("ad_spend, leads, booked_jobs, revenue, metric_date").gte("metric_date", daysAgo(30).toISOString().slice(0, 10));
  const mktgRows = mktg ?? [];
  const spend = mktgRows.reduce((s, m) => s + Number(m.ad_spend || 0), 0);
  const mLeads = mktgRows.reduce((s, m) => s + Number(m.leads || 0), 0);
  const booked = mktgRows.reduce((s, m) => s + Number(m.booked_jobs || 0), 0);
  const revenue = mktgRows.reduce((s, m) => s + Number(m.revenue || 0), 0);

  return {
    cards: {
      jobsToday: today.length,
      jobsThisWeek: week.length,
      jobsInProgress: inProgress.length,
      jobsCompletedWeek: completedWeek.length,
      needingAssignment: needsAssignment.length,
      upcomingMaintenance,
      newLeads,
      bookedLeads,
      revenueWeek,
      activeTechnicians,
    },
    todaySchedule: today.sort((a, b) => new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime()),
    unassigned: needsAssignment,
    runningLate,
    recentCompleted,
    leadPipeline,
    maintenanceSummary: { active, monthlyRevenue, dueThisWeek, pastDue, needsScheduling },
    marketingSummary: {
      spend, leads: mLeads, booked, revenue,
      roas: spend > 0 ? revenue / spend : 0,
      cpl: mLeads > 0 ? spend / mLeads : 0,
    },
  };
}
