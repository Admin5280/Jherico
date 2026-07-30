"use client";

import { useMemo, useState } from "react";
import { useApiData } from "@/lib/api";
import { JobExpanded, JOB_STATUSES } from "@/lib/types";
import { Loading, ErrorState, Empty } from "@/components/ui";
import { TechJobCard } from "@/components/TechJobCard";

export default function TechJobsPage() {
  const { data, loading, error } = useApiData<{ jobs: JobExpanded[] }>("/api/jobs");
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const jobs = data?.jobs ?? [];

  const filtered = useMemo(() => {
    const list = jobs.slice().sort((a, b) => new Date(b.scheduled_start || 0).getTime() - new Date(a.scheduled_start || 0).getTime());
    if (filter === "completed") return list.filter((j) => j.status === "Completed");
    if (filter === "active") return list.filter((j) => !["Completed", "Cancelled", "No Show"].includes(j.status));
    return list;
  }, [jobs, filter]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-head font-bold text-ink">My Jobs</h1>
      <div className="flex rounded-lg border border-line overflow-hidden text-sm">
        {(["active", "completed", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 capitalize ${filter === f ? "bg-accent text-white" : "text-muted"}`}>{f}</button>
        ))}
      </div>
      {filtered.length === 0 ? <Empty label="No jobs here." /> : (
        <div className="space-y-3">{filtered.map((j) => <TechJobCard key={j.id} job={j} showDate />)}</div>
      )}
    </div>
  );
}
