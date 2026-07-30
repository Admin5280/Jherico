"use client";

import { ReactNode, useEffect } from "react";
import { money } from "@/lib/format";
import { JobStatus, STATUS_TONE, StatusTone } from "@/lib/types";

/* ---------- layout ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-head font-semibold text-ink tracking-wide">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-surface border border-line rounded-xl shadow-card ${className}`}>{children}</div>;
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wide font-head">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

/* ---------- KPI ---------- */
export function Kpi({ label, value, sub, tone = "default", icon, href }: {
  label: string; value: string; sub?: string;
  tone?: "default" | "good" | "warn" | "accent" | "danger"; icon?: ReactNode; href?: string;
}) {
  const toneCls = { default: "text-ink", good: "text-good", warn: "text-gold", accent: "text-accent", danger: "text-danger" }[tone];
  const ring = tone === "accent" ? "border-accent/30" : tone === "danger" ? "border-danger/30" : tone === "good" ? "border-good/25" : "border-line";
  const inner = (
    <Card className={`p-4 border ${ring} ${href ? "hover:border-accent transition-colors" : ""}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">{icon && <span className="text-accent">{icon}</span>}{label}</div>
      <div className={`text-3xl font-head font-bold mt-1 ${toneCls}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </Card>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

/* ---------- buttons / inputs ---------- */
export function Button({ children, onClick, variant = "default", type = "button", className = "", disabled }: {
  children: ReactNode; onClick?: () => void; variant?: "default" | "accent" | "ghost" | "danger" | "outline";
  type?: "button" | "submit"; className?: string; disabled?: boolean;
}) {
  const v = {
    default: "bg-surface2 text-ink border border-line hover:border-muted",
    accent: "bg-accent text-white hover:bg-accent2 border border-transparent",
    ghost: "bg-transparent text-muted hover:text-ink border border-transparent",
    danger: "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/40",
    outline: "bg-transparent text-ink border border-line hover:border-accent",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${v} ${className}`}>
      {children}
    </button>
  );
}

const fieldCls = "w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-[10px] text-muted mt-0.5 block">{hint}</span>}
    </label>
  );
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}
export function Select({ options, ...props }: { options: (string | { value: string; label: string })[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldCls} ${props.className ?? ""}`}>
      {options.map((o) => {
        const value = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return <option key={value} value={value}>{label}</option>;
      })}
    </select>
  );
}

/* ---------- status pills ---------- */
const TONE_CLS: Record<StatusTone, string> = {
  neutral: "bg-white/10 text-muted",
  info: "bg-accent/15 text-accent",
  warn: "bg-gold/15 text-gold",
  active: "bg-redglow/15 text-redglow",
  good: "bg-good/15 text-good",
  danger: "bg-danger/15 text-danger",
};

export function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${TONE_CLS[tone]}`}>{label}</span>;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <StatusPill label={status} tone={STATUS_TONE[status] ?? "neutral"} />;
}

const GENERIC_BADGE: Record<string, StatusTone> = {
  // payment
  Paid: "good", "Deposit Paid": "info", "Partially Paid": "warn", Unpaid: "danger", Refunded: "neutral",
  // maintenance / lead
  Active: "good", Paused: "warn", "Past Due": "danger", Cancelled: "danger", "Needs Scheduling": "info",
  New: "info", Contacted: "warn", Qualified: "info", Booked: "good", Lost: "danger",
};
export function Badge({ value }: { value: string }) {
  if (!value) return <span className="text-muted">—</span>;
  return <StatusPill label={value} tone={GENERIC_BADGE[value] ?? "neutral"} />;
}

export function LinkOut({ href, label = "open" }: { href: string; label?: string }) {
  if (!href) return <span className="text-muted">—</span>;
  return <a href={href} target="_blank" rel="noreferrer" className="text-accent hover:underline whitespace-nowrap">{label} ↗</a>;
}

/* ---------- table ---------- */
export interface Col<T> { key: string; label: string; render?: (row: T) => ReactNode; className?: string; }
export function Table<T extends { id: string }>({ cols, rows, empty = "No records yet.", onRowClick }: {
  cols: Col<T>[]; rows: T[]; empty?: string; onRowClick?: (row: T) => void;
}) {
  if (!rows.length) return <Card className="p-8 text-center text-sm text-muted">{empty}</Card>;
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            {cols.map((c) => (
              <th key={c.key} className="text-left font-medium text-muted px-3 py-2.5 whitespace-nowrap text-xs uppercase tracking-wide">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onRowClick?.(r)}
              className={`border-b border-line/60 hover:bg-surface2/50 ${onRowClick ? "cursor-pointer" : ""}`}>
              {cols.map((c) => (
                <td key={c.key} className={`px-3 py-2 whitespace-nowrap ${c.className ?? ""}`}>
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ---------- horizontal bar list ---------- */
export function BarList({ data, money: isMoney = false }: { data: { label: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <Card className="p-6 text-center text-sm text-muted">No data.</Card>;
  return (
    <Card className="p-4 space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(90px,150px)_1fr_auto] items-center gap-3">
          <span className="text-xs text-muted truncate" title={d.label}>{d.label}</span>
          <div className="h-2.5 bg-base rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="text-xs tabular-nums text-ink w-16 text-right">{isMoney ? money(d.value) : d.value.toLocaleString()}</span>
        </div>
      ))}
    </Card>
  );
}

/* ---------- modal ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto" onClick={onClose}>
      <div className={`bg-surface border border-line rounded-2xl shadow-card w-full ${wide ? "max-w-4xl" : "max-w-2xl"} my-8`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-line sticky top-0 bg-surface rounded-t-2xl">
          <h3 className="font-head font-semibold text-ink text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- toast (lightweight, self-dismissing) ---------- */
export function Toast({ message, tone = "good", onDone }: { message: string; tone?: "good" | "danger"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  const cls = tone === "good" ? "bg-good/15 text-good border-good/40" : "bg-danger/15 text-danger border-danger/40";
  return (
    <div className={`fixed bottom-4 right-4 z-[60] px-4 py-2.5 rounded-lg border text-sm shadow-card ${cls}`}>{message}</div>
  );
}

/* ---------- states ---------- */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="text-muted text-sm animate-pulse py-16 text-center">{label}</div>;
}
export function ErrorState({ message }: { message: string }) {
  return <Card className="p-6 text-sm text-danger border-danger/30">⚠ {message}</Card>;
}
export function Empty({ label = "Nothing here yet." }: { label?: string }) {
  return <Card className="p-8 text-center text-sm text-muted">{label}</Card>;
}
