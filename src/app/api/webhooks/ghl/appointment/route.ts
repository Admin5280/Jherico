import { NextRequest } from "next/server";
import { handleGhlWebhook } from "@/lib/ghl/webhook";
import { adaptAppointment } from "@/lib/ghl/adapters";
import { processAppointment } from "@/lib/ghl/process";
import { RawGhlAppointment } from "@/lib/ghl/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleGhlWebhook<RawGhlAppointment, ReturnType<typeof adaptAppointment>>(req, {
    eventType: "appointment",
    adapt: adaptAppointment,
    process: processAppointment,
    entityId: (n) => n.ghlAppointmentId,
  });
}
