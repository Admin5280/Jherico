"use client";

import { useApiData } from "@/lib/api";
import { PageHeader, Card, Section, Loading, ErrorState } from "@/components/ui";

interface Status {
  serviceRoleConfigured: boolean;
  authConfigured: boolean;
  webhookSecretSet: boolean;
  webhookEndpoints: string[];
  storageBuckets: string[];
}

export default function SettingsPage() {
  const { data, loading, error } = useApiData<Status>("/api/settings/status");
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <>
      <PageHeader title="Settings" subtitle="Environment & integration status" />

      <Section title="Environment">
        <Card className="p-4 space-y-2 text-sm">
          <StatusRow label="Supabase service role (server data)" ok={data.serviceRoleConfigured} />
          <StatusRow label="Supabase Auth (login)" ok={data.authConfigured} />
          <StatusRow label="GHL webhook secret" ok={data.webhookSecretSet} />
          {(!data.serviceRoleConfigured || !data.authConfigured) && (
            <div className="text-xs text-gold pt-1">Add the missing keys to <code>.env.local</code> and restart. See <code>docs/INTEGRATION.md</code>.</div>
          )}
        </Card>
      </Section>

      <Section title="Storage Buckets">
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {data.storageBuckets.map((b) => <span key={b} className="text-xs px-2 py-1 rounded bg-white/10 text-muted font-mono">{b}</span>)}
          </div>
        </Card>
      </Section>

      <Section title="GHL Webhook Endpoints (prepared, not live)">
        <Card className="p-4 space-y-1.5">
          {data.webhookEndpoints.map((e) => (
            <div key={e} className="flex items-center gap-2 text-sm">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold uppercase">POST</span>
              <code className="text-muted">{e}</code>
            </div>
          ))}
          <div className="text-xs text-muted pt-2">Each verifies <code>x-autodude-webhook-secret</code>, stores the raw event, dedupes, and normalizes via an adapter. Not connected to live GHL until real sample payloads are confirmed.</div>
        </Card>
      </Section>

      <Section title="Roles">
        <Card className="p-4 text-sm text-muted space-y-1">
          <div><span className="text-ink font-medium">Admin</span> — full access, settings, user management, delete/archive.</div>
          <div><span className="text-ink font-medium">Manager</span> — jobs, scheduling, assignment, customers, reports (no settings).</div>
          <div><span className="text-ink font-medium">Technician</span> — only assigned jobs + own schedule/profile (mobile app).</div>
        </Card>
      </Section>
    </>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={ok ? "text-good" : "text-gold"}>{ok ? "✓ configured" : "○ not set"}</span>
    </div>
  );
}
