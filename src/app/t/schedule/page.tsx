"use client";

import { useMemo } from "react";
import { useApiData } from "@/lib/api";
import { JobExpanded } from "@/lib/types";
import { Loading, ErrorState, Empty } from "@/components/ui";
import { TechJobCard } from "@/components/TechJobCard";
import { fmtDate } from "@/lib/format";

export default function TechSchedulePage() {
  const { data, loading, error } = useApiData<{ jobs: JobExpanded[] }>("/api/jobs");
  const jobs = data?.jobs ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, JobExpanded[]>();
    jobs
      .filter((j) => j.scheduled_start && !["Cancelled", "No Show"].includes(j.status))
      .sort((a, b) => new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime())
      .forEach((j) => {
        const key = new Date(j.scheduled_start!).toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(j);
      });
    return Array.from(map.entries());
  }, [jobs]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-head font-bold text-ink">My Schedule</h1>
      {grouped.length === 0 ? <Empty label="No scheduled jobs." /> : grouped.map(([day, list]) => (
        <div key={day}>
          <h2 className="text-sm font-head font-semibold text-accent uppercase tracking-wide mb-2">{fmtDate(list[0].scheduled_start)}</h2>
          <div className="space-y-3">{list.map((j) => <TechJobCard key={j.id} job={j} />)}</div>
        </div>
      ))}
    </div>
  );
}
