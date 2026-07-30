"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiData, apiSend } from "@/lib/api";
import { JobExpanded, JobStatusHistory } from "@/lib/types";
import { PageHeader, Card, Section, Button, Loading, ErrorState, JobStatusBadge, Badge, Toast } from "@/components/ui";
import { JobForm } from "@/components/JobForm";
import { AssignmentPanel } from "@/components/AssignmentPanel";
import { money, fmtDateTime, fmtDuration, fullName, mapsUrl } from "@/lib/format";
import { useAuth } from "@/components/AuthProvider";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const { data, loading, error, refetch } = useApiData<{ job: JobExpanded; history: JobStatusHistory[] }>(`/api/jobs/${id}`);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data?.job) return <ErrorState message="Job not found" />;
  const j = data.job;

  async function archive() {
    if (!confirm("Archive this job? It will be hidden from lists.")) return;
    try {
      await apiSend(`/api/jobs/${id}`, "DELETE");
      router.push("/jobs");
    } catch (e) {
      setToast(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <PageHeader
        title={`${j.job_number}`}
        subtitle={`${fullName(j.customer?.first_name, j.customer?.last_name)} · ${j.city}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push("/jobs")}>← Jobs</Button>
            {can("editJob") && <Button variant="accent" onClick={() => setEditing(true)}>Edit</Button>}
            {can("deleteJob") && <Button variant="danger" onClick={archive}>Archive</Button>}
          </>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <JobStatusBadge status={j.status} />
        <Badge value={j.payment_status} />
        <span className="text-sm text-muted">{fmtDateTime(j.scheduled_start)}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Service Information">
            <Card className="p-4">
              {j.service_items?.length ? (
                <div className="divide-y divide-line">
                  {j.service_items.map((s) => (
                    <div key={s.id} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                      <div>
                        <div className="text-ink text-sm font-medium">{s.service_name_snapshot}</div>
                        <div className="text-xs text-muted">{fmtDuration(s.estimated_duration_minutes)} · {s.status}</div>
                      </div>
                      <span className="tabular-nums text-ink">{money(s.price_snapshot)}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-sm text-muted">No service line items.</div>}
            </Card>
          </Section>

          <div className="grid sm:grid-cols-2 gap-6">
            <Section title="Customer Information">
              <Card className="p-4 space-y-1.5 text-sm">
                <InfoRow label="Name" value={fullName(j.customer?.first_name, j.customer?.last_name)} />
                <InfoRow label="Phone" value={j.customer?.phone} />
                <InfoRow label="Email" value={j.customer?.email} />
                <InfoRow label="Address" value={[j.service_address, j.city, j.state, j.postal_code].filter(Boolean).join(", ")} />
                {j.access_instructions && <InfoRow label="Access" value={j.access_instructions} />}
                <a href={mapsUrl(`${j.service_address}, ${j.city}, ${j.state} ${j.postal_code}`, j.latitude, j.longitude)} target="_blank" rel="noreferrer" className="text-accent text-xs hover:underline inline-block pt-1">Open in Maps ↗</a>
              </Card>
            </Section>

            <Section title="Vehicle Information">
              <Card className="p-4 space-y-1.5 text-sm">
                <InfoRow label="Vehicle" value={j.vehicle ? `${j.vehicle.year ?? ""} ${j.vehicle.make} ${j.vehicle.model}` : "—"} />
                <InfoRow label="Trim" value={j.vehicle?.trim} />
                <InfoRow label="Color" value={j.vehicle?.color} />
                <InfoRow label="Size" value={j.vehicle?.size_category} />
                <InfoRow label="Plate" value={j.vehicle?.license_plate} />
              </Card>
            </Section>
          </div>

          <Section title="Notes">
            <div className="grid sm:grid-cols-2 gap-3">
              <Card className="p-4"><div className="text-xs text-muted mb-1">Customer notes</div><div className="text-sm text-ink whitespace-pre-wrap">{j.customer_notes || "—"}</div></Card>
              <Card className="p-4"><div className="text-xs text-muted mb-1">Internal notes</div><div className="text-sm text-ink whitespace-pre-wrap">{j.internal_notes || "—"}</div></Card>
            </div>
          </Section>

          <Section title="Activity Timeline">
            <Card className="p-4">
              {data.history.length === 0 ? <div className="text-sm text-muted">No status changes recorded.</div> : (
                <ol className="relative border-l border-line ml-2 space-y-3">
                  {data.history.map((h) => (
                    <li key={h.id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-accent" />
                      <div className="text-sm text-ink">
                        {h.previous_status ? `${h.previous_status} → ` : ""}<span className="font-medium">{h.new_status}</span>
                      </div>
                      <div className="text-xs text-muted">{fmtDateTime(h.created_at)} · {h.change_source}{h.changed_by_name ? ` · ${h.changed_by_name}` : ""}{h.note ? ` · ${h.note}` : ""}</div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </Section>
        </div>

        {/* right column */}
        <div className="space-y-6">
          <Section title="Schedule">
            <Card className="p-4 space-y-1.5 text-sm">
              <InfoRow label="Start" value={fmtDateTime(j.scheduled_start)} />
              <InfoRow label="End" value={fmtDateTime(j.scheduled_end)} />
              <InfoRow label="Duration" value={fmtDuration(j.estimated_duration_minutes)} />
              {j.arrival_window_start && <InfoRow label="Arrival" value={`${fmtDateTime(j.arrival_window_start)}`} />}
            </Card>
          </Section>

          <Section title="Technician Assignment">
            <AssignmentPanel job={j} onChanged={() => { refetch(); setToast("Assignment updated"); }} canEdit={can("assignTechnician")} />
          </Section>

          <Section title="Payment Summary">
            <Card className="p-4 space-y-1.5 text-sm">
              <InfoRow label="Status" value={<Badge value={j.payment_status} />} />
              <InfoRow label="Invoice total" value={money(j.invoice_total)} />
              <InfoRow label="Deposit" value={money(j.deposit_amount)} />
              <InfoRow label="Balance" value={money(j.remaining_balance)} />
            </Card>
          </Section>

          <Section title="GHL Sync">
            <Card className="p-4 space-y-1.5 text-sm">
              <InfoRow label="Sync status" value={<Badge value={j.sync_status} />} />
              <InfoRow label="Appointment ID" value={j.ghl_appointment_id || "—"} />
              <InfoRow label="Contact ID" value={j.ghl_contact_id || "—"} />
              <InfoRow label="Opportunity ID" value={j.ghl_opportunity_id || "—"} />
              <div className="text-[10px] text-muted pt-1">GHL integration is prepared but not yet live.</div>
            </Card>
          </Section>
        </div>
      </div>

      <JobForm open={editing} onClose={() => setEditing(false)} onSaved={() => { refetch(); setToast("Job saved"); }} job={j} />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-ink text-right">{value || "—"}</span>
    </div>
  );
}
