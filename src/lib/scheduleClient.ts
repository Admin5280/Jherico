"use client";

import { JobExpanded } from "@/lib/types";
import { ConflictInfo } from "@/lib/assignmentsDb";

export interface MoveArgs {
  job_id: string;
  scheduled_start?: string;
  technician_id?: string;
  force?: boolean;
}

export interface MoveResult {
  ok?: boolean;
  conflicts?: ConflictInfo[];
  scheduled_start?: string;
  error?: string;
}

/** Calls the move endpoint; surfaces 409 conflicts distinctly. */
export async function moveJob(args: MoveArgs): Promise<MoveResult> {
  const res = await fetch("/api/schedule/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 409) return { conflicts: json.conflicts };
  if (!res.ok) return { error: json.error || "Move failed" };
  return json;
}

/** Same day-of-week/time preserved, moved to a new date (yyyy-mm-dd). */
export function rescheduleToDate(job: JobExpanded, dateIso: string): string {
  const base = job.scheduled_start ? new Date(job.scheduled_start) : new Date(`${dateIso}T09:00:00`);
  const [y, m, d] = dateIso.split("-").map(Number);
  const next = new Date(base);
  next.setFullYear(y, m - 1, d);
  return next.toISOString();
}
