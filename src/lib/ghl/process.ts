// ---------------------------------------------------------------------------
// Processors: NORMALIZED object → Supabase upsert (by external GHL id).
// Never create duplicate records — always upsert on the external id. These run
// after the raw event is safely stored, so they are safe to retry.
// ---------------------------------------------------------------------------

import { SupabaseClient } from "@supabase/supabase-js";
import {
  NormalizedContact, NormalizedOpportunity, NormalizedAppointment,
  NormalizedPayment, NormalizedOrder, NormalizedSubscription,
} from "./types";

export async function processContact(sb: SupabaseClient, n: NormalizedContact): Promise<string> {
  if (!n.ghlContactId) throw new Error("missing ghlContactId");
  await sb.from("customers").upsert(
    {
      ghl_contact_id: n.ghlContactId,
      first_name: n.firstName, last_name: n.lastName, email: n.email, phone: n.phone,
      address_line_1: n.address1, city: n.city, state: n.state, postal_code: n.postalCode,
    },
    { onConflict: "ghl_contact_id" },
  );
  return `Upserted customer for contact ${n.ghlContactId}`;
}

export async function processOpportunity(sb: SupabaseClient, n: NormalizedOpportunity): Promise<string> {
  if (!n.ghlOpportunityId) throw new Error("missing ghlOpportunityId");
  // find existing lead by opportunity id
  const { data: existing } = await sb.from("leads").select("id").eq("ghl_opportunity_id", n.ghlOpportunityId).maybeSingle();
  const payload = {
    ghl_opportunity_id: n.ghlOpportunityId,
    ghl_contact_id: n.ghlContactId,
    pipeline_stage: n.pipelineStage,
    estimated_value: n.monetaryValue,
    // lead_status left to a mapping layer once GHL stage vocabulary is confirmed
  };
  if (existing) await sb.from("leads").update(payload).eq("id", existing.id);
  else await sb.from("leads").insert(payload);
  return `Upserted lead for opportunity ${n.ghlOpportunityId}`;
}

export async function processAppointment(sb: SupabaseClient, n: NormalizedAppointment): Promise<string> {
  if (!n.ghlAppointmentId) throw new Error("missing ghlAppointmentId");
  // link to an existing customer by contact id
  let customerId: string | null = null;
  if (n.ghlContactId) {
    const { data: cust } = await sb.from("customers").select("id").eq("ghl_contact_id", n.ghlContactId).maybeSingle();
    customerId = cust?.id ?? null;
  }
  const { data: existing } = await sb.from("jobs").select("id, job_number").eq("ghl_appointment_id", n.ghlAppointmentId).maybeSingle();
  const payload: Record<string, unknown> = {
    ghl_appointment_id: n.ghlAppointmentId,
    ghl_contact_id: n.ghlContactId,
    customer_id: customerId,
    scheduled_start: n.startTime,
    scheduled_end: n.endTime,
    service_address: n.address,
    customer_notes: n.notes,
    sync_status: "synced",
  };
  if (existing) {
    await sb.from("jobs").update(payload).eq("id", existing.id);
    return `Updated job ${existing.job_number} from appointment`;
  }
  // new job — generate a job number
  const { data: last } = await sb.from("jobs").select("job_number").order("created_at", { ascending: false }).limit(1);
  const lastNum = last?.[0]?.job_number as string | undefined;
  const next = lastNum && /JOB-(\d+)/.test(lastNum) ? parseInt(lastNum.replace(/\D/g, ""), 10) + 1 : 1001;
  payload.job_number = `JOB-${next}`;
  payload.status = "Confirmed";
  await sb.from("jobs").insert(payload);
  return `Created job JOB-${next} from appointment`;
}

export async function processPayment(sb: SupabaseClient, n: NormalizedPayment): Promise<string> {
  if (!n.externalId) throw new Error("missing payment id");
  // If tied to an appointment, reflect payment on the matching job.
  if (n.ghlAppointmentId) {
    const { data: job } = await sb.from("jobs").select("id, invoice_total").eq("ghl_appointment_id", n.ghlAppointmentId).maybeSingle();
    if (job) {
      const paid = n.status.toLowerCase().includes("refund") ? "Refunded" : n.amount >= Number(job.invoice_total || 0) ? "Paid" : "Partially Paid";
      await sb.from("jobs").update({ payment_status: paid, remaining_balance: Math.max(0, Number(job.invoice_total || 0) - n.amount) }).eq("id", job.id);
      return `Applied payment ${n.externalId} to job`;
    }
  }
  // TODO: confirm GHL payment→invoice linkage; for now just acknowledge (raw event already stored).
  return `Payment ${n.externalId} recorded (no job link — mapping TBD)`;
}

export async function processOrder(sb: SupabaseClient, n: NormalizedOrder): Promise<string> {
  if (!n.externalId) throw new Error("missing order id");
  // TODO: confirm GHL order schema before mapping to jobs/invoices. Raw event is stored for later replay.
  return `Order ${n.externalId} received (${n.items.length} item(s), mapping TBD)`;
}

export async function processSubscription(sb: SupabaseClient, n: NormalizedSubscription): Promise<string> {
  if (!n.ghlSubscriptionId) throw new Error("missing subscription id");
  let customerId: string | null = null;
  if (n.ghlContactId) {
    const { data: cust } = await sb.from("customers").select("id").eq("ghl_contact_id", n.ghlContactId).maybeSingle();
    customerId = cust?.id ?? null;
  }
  // map interval → frequency (confirm GHL vocabulary)
  const freq = /quarter/i.test(n.interval) ? "Quarterly" : /bi|two|2/i.test(n.interval) ? "Bi-Monthly" : "Monthly";
  const status = /cancel/i.test(n.status) ? "Cancelled" : /pause/i.test(n.status) ? "Paused" : "Active";

  const { data: existing } = await sb.from("maintenance_clients").select("id").eq("ghl_subscription_id", n.ghlSubscriptionId).maybeSingle();
  const payload: Record<string, unknown> = {
    ghl_subscription_id: n.ghlSubscriptionId,
    program_name: n.planName || "Maintenance Program",
    frequency: freq,
    status,
    monthly_value: n.amount,
  };
  if (customerId) payload.customer_id = customerId;
  if (existing) await sb.from("maintenance_clients").update(payload).eq("id", existing.id);
  else if (customerId) await sb.from("maintenance_clients").insert(payload);
  else return `Subscription ${n.ghlSubscriptionId} received but no matching customer (mapping TBD)`;
  return `Upserted maintenance client for subscription ${n.ghlSubscriptionId}`;
}
