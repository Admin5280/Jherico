"use client";

import { useMemo } from "react";
import { useApiData } from "@/lib/api";
import { JobExpanded } from "@/lib/types";
import { Loading, ErrorState, Empty } from "@/components/ui";
import { TechJobCard } from "@/components/TechJobCard";
import { isToday, inRange, startOfToday, daysFromNow } from "@/lib/dates";

export default function TechTodayPage() {
  const { data, loading, error } = useApiData<{ jobs: JobExpanded[] }>("/api/jobs");
  const jobs = data?.jobs ?? [];

  const today = useMemo(
    () => jobs.filter((j) => isToday(j.scheduled_start) && !["Cancelled", "No Show"].includes(j.status))
      .sort((a, b) => new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime()),
    [jobs],
  );
  const upcoming = useMemo(
    () => jobs.filter((j) => inRange(j.scheduled_start, daysFromNow(1), daysFromNow(8)) && !["Cancelled", "No Show", "Completed"].includes(j.status))
      .sort((a, b) => new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime()),
    [jobs],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-head font-bold text-ink mb-1">Today</h1>
        <p className="text-sm text-muted">{today.length} job{today.length === 1 ? "" : "s"} scheduled</p>
      </div>

      {today.length === 0 ? <Empty label="No jobs today. Enjoy the day. 🚗" /> : (
        <div className="space-y-3">{today.map((j) => <TechJobCard key={j.id} job={j} />)}</div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-head font-semibold text-ink uppercase tracking-wide mb-2">Upcoming</h2>
          <div className="space-y-3">{upcoming.map((j) => <TechJobCard key={j.id} job={j} showDate />)}</div>
        </div>
      )}
    </div>
  );
}
