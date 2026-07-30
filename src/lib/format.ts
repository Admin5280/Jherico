export function money(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function money2(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function pct(n: number | null | undefined, digits = 0): string {
  return `${Number(n ?? 0).toFixed(digits)}%`;
}

/** "Mon, Jul 30" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "2:30 PM" */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Mon, Jul 30 · 2:30 PM" */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${fmtDate(iso)} · ${fmtTime(iso)}`;
}

/** "2:30–4:00 PM" style window from two ISO strings. */
export function fmtWindow(startIso: string | null | undefined, endIso: string | null | undefined): string {
  if (!startIso) return "—";
  const s = fmtTime(startIso);
  const e = endIso ? fmtTime(endIso) : "";
  return e ? `${s} – ${e}` : s;
}

export function fmtDuration(minutes: number | null | undefined): string {
  const m = Math.max(0, Math.round(Number(minutes ?? 0)));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h && rem) return `${h}h ${rem}m`;
  if (h) return `${h}h`;
  return `${rem}m`;
}

/** Technician-safe customer label: "Sarah M." */
export function shortName(first: string | null | undefined, last: string | null | undefined): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  return l ? `${f} ${l.charAt(0)}.` : f;
}

export function fullName(first: string | null | undefined, last: string | null | undefined): string {
  return `${first ?? ""} ${last ?? ""}`.trim();
}

/** yyyy-mm-dd for <input type=date> */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return isoDate(new Date());
}

/** Maps.apple / google navigation link from an address string. */
export function mapsUrl(address: string, lat?: number | null, lng?: number | null): string {
  if (lat != null && lng != null) return `https://maps.google.com/?q=${lat},${lng}`;
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}
