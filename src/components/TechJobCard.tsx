"use client";

import Link from "next/link";
import { JobExpanded } from "@/lib/types";
import { JobStatusBadge } from "./ui";
import { fmtTime, fmtDate, fmtDuration, shortName, mapsUrl } from "@/lib/format";

/** A job is "within the service window" (contact details revealed) when it's
 *  scheduled today or actively in progress. */
export function withinServiceWindow(job: JobExpanded): boolean {
  const active = ["En Route", "Checked In", "In Progress", "Waiting"].includes(job.status);
  if (active) return true;
  if (!job.scheduled_start) return false;
  const d = new Date(job.scheduled_start);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function TechJobCard({ job, showDate }: { job: JobExpanded; showDate?: boolean }) {
  const svc = job.service_items?.map((s) => s.service_name_snapshot).join(", ") || "—";
  const reveal = withinServiceWindow(job);
  const phone = job.customer?.phone ?? "";
  const address = `${job.service_address}, ${job.city}, ${job.state} ${job.postal_code}`;

  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-head font-bold text-ink">
          {job.scheduled_start ? fmtTime(job.scheduled_start) : "Unscheduled"}
          {showDate && job.scheduled_start && <span className="text-xs text-muted font-sans font-normal ml-2">{fmtDate(job.scheduled_start)}</span>}
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <div className="mt-2">
        <div className="text-base font-semibold text-ink">{reveal ? `${job.customer?.first_name ?? ""} ${job.customer?.last_name ?? ""}`.trim() : shortName(job.customer?.first_name, job.customer?.last_name)}</div>
        <div className="text-sm text-muted">{job.vehicle ? `${job.vehicle.year ?? ""} ${job.vehicle.make} ${job.vehicle.model} · ${job.vehicle.color}` : "—"}</div>
        <div className="text-sm text-ink mt-1">{svc}</div>
        <div className="text-xs text-muted mt-1">{job.city} · {fmtDuration(job.estimated_duration_minutes)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Link href={`/t/jobs/${job.id}`} className="col-span-2 text-center bg-accent text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-accent2">
          Open Job
        </Link>
        <a href={mapsUrl(address, job.latitude, job.longitude)} target="_blank" rel="noreferrer"
          className="text-center border border-line rounded-lg py-2 text-sm text-ink hover:border-accent">🧭 Maps</a>
        {reveal && phone ? (
          <a href={`tel:${phone}`} className="text-center border border-line rounded-lg py-2 text-sm text-ink hover:border-accent">📞 Call</a>
        ) : (
          <span className="text-center border border-line/50 rounded-lg py-2 text-sm text-muted">Contact hidden</span>
        )}
      </div>
    </div>
  );
}
