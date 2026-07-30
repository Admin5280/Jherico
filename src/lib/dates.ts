/** Date-range helpers used by dashboards. All in the server's local timezone. */

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}

/** Monday 00:00 of the current week. */
export function startOfWeek(): Date {
  const d = startOfToday();
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d;
}

/** Monday 00:00 of next week (exclusive end). */
export function endOfWeek(): Date {
  const d = startOfWeek();
  d.setDate(d.getDate() + 7);
  return d;
}

export function daysAgo(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

export function daysFromNow(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + n);
  return d;
}

export function inRange(iso: string | null | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

export function isToday(iso: string | null | undefined): boolean {
  return inRange(iso, startOfToday(), endOfToday());
}
