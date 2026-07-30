// ---------------------------------------------------------------------------
// GoHighLevel webhook types — RAW (inbound) + NORMALIZED (internal).
//
// ⚠ THE RAW SHAPES BELOW ARE PLACEHOLDERS. GHL's real webhook payloads must be
//    confirmed against actual samples from a test sub-account before going live.
//    Every field marked  // CONFIRM  is a guess based on common GHL structures.
//    The rest of the app depends ONLY on the Normalized* types, so when the real
//    payloads arrive you only touch the adapters (adapters.ts), not the app.
// ---------------------------------------------------------------------------

export type GhlEventType = "contact" | "opportunity" | "appointment" | "payment" | "order" | "subscription";

/* ============================ RAW (unconfirmed) ============================ */
export interface RawGhlEnvelope {
  type?: string;          // CONFIRM: GHL event type discriminator
  id?: string;            // CONFIRM: unique event/webhook id (for dedupe)
  webhookId?: string;     // CONFIRM: alternative event id
  locationId?: string;    // CONFIRM: GHL sub-account id
  timestamp?: string;     // CONFIRM
  [key: string]: unknown;
}

export interface RawGhlContact extends RawGhlEnvelope {
  contactId?: string;     // CONFIRM
  id?: string;            // CONFIRM: sometimes the contact id is the top-level id
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;      // CONFIRM
  city?: string;
  state?: string;
  postalCode?: string;    // CONFIRM
  source?: string;
  tags?: string[];
}

export interface RawGhlOpportunity extends RawGhlEnvelope {
  opportunityId?: string; // CONFIRM
  contactId?: string;
  name?: string;
  pipelineId?: string;    // CONFIRM
  pipelineStageId?: string; // CONFIRM
  stage?: string;         // CONFIRM: human stage name
  status?: string;        // CONFIRM: open | won | lost | abandoned
  monetaryValue?: number; // CONFIRM
  source?: string;
}

export interface RawGhlAppointment extends RawGhlEnvelope {
  appointmentId?: string; // CONFIRM
  contactId?: string;
  calendarId?: string;    // CONFIRM
  title?: string;
  startTime?: string;     // CONFIRM: ISO
  endTime?: string;       // CONFIRM: ISO
  address?: string;       // CONFIRM
  appointmentStatus?: string; // CONFIRM: confirmed | cancelled | showed | noshow
  notes?: string;
}

export interface RawGhlPayment extends RawGhlEnvelope {
  paymentId?: string;     // CONFIRM
  contactId?: string;
  appointmentId?: string; // CONFIRM
  amount?: number;        // CONFIRM
  currency?: string;
  status?: string;        // CONFIRM: succeeded | pending | refunded
}

export interface RawGhlOrder extends RawGhlEnvelope {
  orderId?: string;       // CONFIRM
  contactId?: string;
  total?: number;         // CONFIRM
  items?: { name?: string; price?: number; qty?: number }[]; // CONFIRM
  status?: string;
}

export interface RawGhlSubscription extends RawGhlEnvelope {
  subscriptionId?: string; // CONFIRM
  contactId?: string;
  planName?: string;      // CONFIRM
  amount?: number;        // CONFIRM
  interval?: string;      // CONFIRM: month | quarter
  status?: string;        // CONFIRM: active | paused | cancelled
}

/* ============================ NORMALIZED (internal) ============================ */
export interface NormalizedContact {
  ghlContactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  source: string;
}

export interface NormalizedOpportunity {
  ghlOpportunityId: string;
  ghlContactId: string;
  name: string;
  pipelineStage: string;
  status: string;
  monetaryValue: number;
  source: string;
}

export interface NormalizedAppointment {
  ghlAppointmentId: string;
  ghlContactId: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  address: string;
  status: string;
  notes: string;
}

export interface NormalizedPayment {
  externalId: string;
  ghlContactId: string;
  ghlAppointmentId: string;
  amount: number;
  status: string;
}

export interface NormalizedOrder {
  externalId: string;
  ghlContactId: string;
  total: number;
  items: { name: string; price: number; qty: number }[];
  status: string;
}

export interface NormalizedSubscription {
  ghlSubscriptionId: string;
  ghlContactId: string;
  planName: string;
  amount: number;
  interval: string;
  status: string;
}
