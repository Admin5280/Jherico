// ---------------------------------------------------------------------------
// Adapters: RAW GHL payload → NORMALIZED internal object.
// This is the ONLY place that touches raw GHL field names. When real webhook
// samples are available, update the field mappings here — nothing else changes.
// Each adapter is defensive: missing fields become "" / null, never throw.
// ---------------------------------------------------------------------------

import {
  RawGhlContact, RawGhlOpportunity, RawGhlAppointment, RawGhlPayment, RawGhlOrder, RawGhlSubscription,
  NormalizedContact, NormalizedOpportunity, NormalizedAppointment, NormalizedPayment, NormalizedOrder, NormalizedSubscription,
} from "./types";

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown): number => (typeof v === "number" ? v : v == null ? 0 : Number(v) || 0);
const iso = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export function adaptContact(raw: RawGhlContact): NormalizedContact {
  return {
    ghlContactId: str(raw.contactId || raw.id), // CONFIRM which field carries the contact id
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    email: str(raw.email),
    phone: str(raw.phone),
    address1: str(raw.address1),
    city: str(raw.city),
    state: str(raw.state) || "TX",
    postalCode: str(raw.postalCode),
    source: str(raw.source),
  };
}

export function adaptOpportunity(raw: RawGhlOpportunity): NormalizedOpportunity {
  return {
    ghlOpportunityId: str(raw.opportunityId || raw.id),
    ghlContactId: str(raw.contactId),
    name: str(raw.name),
    pipelineStage: str(raw.stage || raw.pipelineStageId), // CONFIRM: prefer human stage name
    status: str(raw.status),
    monetaryValue: num(raw.monetaryValue),
    source: str(raw.source),
  };
}

export function adaptAppointment(raw: RawGhlAppointment): NormalizedAppointment {
  return {
    ghlAppointmentId: str(raw.appointmentId || raw.id),
    ghlContactId: str(raw.contactId),
    title: str(raw.title),
    startTime: iso(raw.startTime),
    endTime: iso(raw.endTime),
    address: str(raw.address),
    status: str(raw.appointmentStatus), // CONFIRM status vocabulary
    notes: str(raw.notes),
  };
}

export function adaptPayment(raw: RawGhlPayment): NormalizedPayment {
  return {
    externalId: str(raw.paymentId || raw.id),
    ghlContactId: str(raw.contactId),
    ghlAppointmentId: str(raw.appointmentId),
    amount: num(raw.amount),
    status: str(raw.status),
  };
}

export function adaptOrder(raw: RawGhlOrder): NormalizedOrder {
  return {
    externalId: str(raw.orderId || raw.id),
    ghlContactId: str(raw.contactId),
    total: num(raw.total),
    items: (raw.items ?? []).map((i) => ({ name: str(i.name), price: num(i.price), qty: num(i.qty) || 1 })),
    status: str(raw.status),
  };
}

export function adaptSubscription(raw: RawGhlSubscription): NormalizedSubscription {
  return {
    ghlSubscriptionId: str(raw.subscriptionId || raw.id),
    ghlContactId: str(raw.contactId),
    planName: str(raw.planName),
    amount: num(raw.amount),
    interval: str(raw.interval), // CONFIRM: map to Monthly | Bi-Monthly | Quarterly
    status: str(raw.status),
  };
}

/** Pull a dedupe id out of any raw envelope (prefers event id, falls back to entity id). */
export function extractEventId(raw: Record<string, unknown>): string | null {
  const candidate = raw.id ?? raw.webhookId ?? raw.eventId;
  return candidate ? String(candidate) : null;
}
