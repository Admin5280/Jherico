"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Field, Input, Textarea, Select, Button } from "./ui";
import { apiGet, apiSend } from "@/lib/api";
import { Job, JobExpanded, JobStatus, JOB_STATUSES, Service, SERVICE_AREAS } from "@/lib/types";
import { CustomerWithVehicles } from "@/lib/customersDb";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (job: JobExpanded) => void;
  job?: JobExpanded | null; // editing when provided
}

/** For <input type=datetime-local> we need local "YYYY-MM-DDTHH:mm". */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

export function JobForm({ open, onClose, onSaved, job }: Props) {
  const editing = !!job;
  const [customers, setCustomers] = useState<CustomerWithVehicles[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [customerId, setCustomerId] = useState(job?.customer_id ?? "");
  const [vehicleId, setVehicleId] = useState(job?.vehicle_id ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>(job?.service_items?.map((s) => s.service_id ?? "").filter(Boolean) ?? []);
  const [address, setAddress] = useState(job?.service_address ?? "");
  const [city, setCity] = useState(job?.city ?? "");
  const [postal, setPostal] = useState(job?.postal_code ?? "");
  const [start, setStart] = useState(toLocalInput(job?.scheduled_start));
  const [duration, setDuration] = useState(job?.estimated_duration_minutes ?? 120);
  const [status, setStatus] = useState<JobStatus>(job?.status ?? "Draft");
  const [invoiceTotal, setInvoiceTotal] = useState(job?.invoice_total ?? 0);
  const [customerNotes, setCustomerNotes] = useState(job?.customer_notes ?? "");
  const [internalNotes, setInternalNotes] = useState(job?.internal_notes ?? "");
  const [access, setAccess] = useState(job?.access_instructions ?? "");

  useEffect(() => {
    if (!open) return;
    apiGet<{ customers: CustomerWithVehicles[] }>("/api/customers").then((r) => setCustomers(r.customers)).catch(() => {});
    apiGet<{ services: Service[] }>("/api/services").then((r) => setServices(r.services)).catch(() => {});
  }, [open]);

  const selectedCustomer = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);

  // auto-fill address from the selected customer when creating
  useEffect(() => {
    if (!editing && selectedCustomer) {
      setAddress(selectedCustomer.address_line_1 || "");
      setCity(selectedCustomer.city || "");
      setPostal(selectedCustomer.postal_code || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // sum service prices → suggested invoice total (create only)
  useEffect(() => {
    if (editing) return;
    const total = serviceIds.reduce((s, id) => s + Number(services.find((sv) => sv.id === id)?.base_price ?? 0), 0);
    if (total) setInvoiceTotal(total);
    const dur = serviceIds.reduce((s, id) => s + Number(services.find((sv) => sv.id === id)?.default_duration_minutes ?? 0), 0);
    if (dur) setDuration(dur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIds, services]);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setErr("");
    if (!customerId) { setErr("Choose a customer."); return; }
    setSaving(true);
    const startIso = fromLocalInput(start);
    const endIso = startIso ? new Date(new Date(startIso).getTime() + duration * 60000).toISOString() : null;
    const payload: Partial<Job> & { service_ids?: string[] } = {
      customer_id: customerId,
      vehicle_id: vehicleId || null,
      service_address: address, city, postal_code: postal,
      scheduled_start: startIso, scheduled_end: endIso,
      estimated_duration_minutes: Number(duration),
      status,
      invoice_total: Number(invoiceTotal),
      remaining_balance: Number(invoiceTotal) - Number(job?.deposit_amount ?? 0),
      customer_notes: customerNotes, internal_notes: internalNotes, access_instructions: access,
    };
    if (!editing) payload.service_ids = serviceIds;
    try {
      const res = editing
        ? await apiSend<{ job: JobExpanded }>(`/api/jobs/${job!.id}`, "PATCH", payload)
        : await apiSend<{ job: JobExpanded }>("/api/jobs", "POST", payload);
      onSaved(res.job);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${job?.job_number}` : "New Job"} wide>
      {err && <div className="mb-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{err}</div>}
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Customer">
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
            options={[{ value: "", label: "— select customer —" }, ...customers.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))]} />
        </Field>
        <Field label="Vehicle">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}
            options={[{ value: "", label: "— select vehicle —" }, ...((selectedCustomer?.vehicles ?? []).map((v) => ({ value: v.id, label: `${v.year ?? ""} ${v.make} ${v.model} (${v.color})` })))]} />
        </Field>
      </div>

      {!editing && (
        <div className="mt-3">
          <span className="text-xs text-muted">Services</span>
          <div className="mt-1 grid sm:grid-cols-2 gap-1.5">
            {services.map((s) => (
              <label key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${serviceIds.includes(s.id) ? "border-accent bg-accent/10 text-ink" : "border-line text-muted hover:border-muted"}`}>
                <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} className="accent-[#E11A22]" />
                <span className="flex-1">{s.name}</span>
                <span className="text-xs tabular-nums">${s.base_price}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3 mt-3">
        <Field label="Service address"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        <Field label="City">
          <Select value={city} onChange={(e) => setCity(e.target.value)} options={["", ...SERVICE_AREAS]} />
        </Field>
        <Field label="ZIP"><Input value={postal} onChange={(e) => setPostal(e.target.value)} /></Field>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-3">
        <Field label="Scheduled start"><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Duration (min)"><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} options={JOB_STATUSES as unknown as string[]} />
        </Field>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-3">
        <Field label="Invoice total ($)"><Input type="number" value={invoiceTotal} onChange={(e) => setInvoiceTotal(Number(e.target.value))} /></Field>
        <Field label="Access instructions"><Input value={access} onChange={(e) => setAccess(e.target.value)} /></Field>
        <div />
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-3">
        <Field label="Customer notes"><Textarea rows={2} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} /></Field>
        <Field label="Internal notes"><Textarea rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} /></Field>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="accent" onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create job"}</Button>
      </div>
    </Modal>
  );
}
