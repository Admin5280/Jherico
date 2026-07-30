// ---------------------------------------------------------------------------
// Shared GHL webhook handler: verify secret → store raw event (dedupe) →
// adapt → process → return clear status codes. Every endpoint delegates here.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { GhlEventType } from "./types";
import { extractEventId } from "./adapters";

const SECRET_HEADER = "x-autodude-webhook-secret";

export interface HandlerConfig<Raw, Norm> {
  eventType: GhlEventType;
  adapt: (raw: Raw) => Norm;
  process: (sb: SupabaseClient, n: Norm) => Promise<string>;
  /** derive the external dedupe/entity id from the normalized object as a fallback */
  entityId: (n: Norm) => string;
}

export async function handleGhlWebhook<Raw extends Record<string, unknown>, Norm>(
  req: NextRequest,
  config: HandlerConfig<Raw, Norm>,
): Promise<NextResponse> {
  const sb = supabaseAdmin();

  // 1) verify shared secret
  const expected = process.env.GHL_WEBHOOK_SECRET;
  const provided = req.headers.get(SECRET_HEADER);
  if (!expected) {
    return NextResponse.json({ error: "Webhook secret not configured on server" }, { status: 501 });
  }
  if (!provided || provided !== expected) {
    if (sb) await sb.from("webhook_events").insert({ source: "ghl", event_type: config.eventType, processing_status: "unauthorized", error_message: "Invalid secret" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // 2) parse body
  let raw: Raw;
  try {
    raw = (await req.json()) as Raw;
  } catch {
    await sb.from("webhook_events").insert({ source: "ghl", event_type: config.eventType, processing_status: "invalid", error_message: "Invalid JSON" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3) adapt + derive dedupe id
  const normalized = config.adapt(raw);
  const externalId = extractEventId(raw) ?? config.entityId(normalized) ?? null;

  // 4) store raw event with dedupe on (source, external_event_id)
  const { data: inserted, error: insErr } = await sb
    .from("webhook_events")
    .insert({
      source: "ghl",
      event_type: config.eventType,
      external_event_id: externalId,
      payload: raw as unknown,
      processing_status: "received",
    })
    .select("id")
    .single();

  if (insErr) {
    // unique violation → duplicate delivery, acknowledge idempotently
    if ((insErr as { code?: string }).code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to store event", detail: insErr.message }, { status: 500 });
  }
  const eventRowId = inserted.id as string;

  // 5) validate + process
  try {
    if (!config.entityId(normalized)) {
      await sb.from("webhook_events").update({ processing_status: "invalid", error_message: "Missing external id", processed_at: new Date().toISOString() }).eq("id", eventRowId);
      return NextResponse.json({ error: "Missing external id in payload" }, { status: 422 });
    }
    const message = await config.process(sb, normalized);
    await sb.from("webhook_events").update({ processing_status: "processed", processed_at: new Date().toISOString(), error_message: message }).eq("id", eventRowId);
    return NextResponse.json({ ok: true, message });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sb.from("webhook_events").update({ processing_status: "error", error_message: msg, processed_at: new Date().toISOString() }).eq("id", eventRowId);
    return NextResponse.json({ error: "Processing failed", detail: msg }, { status: 500 });
  }
}
