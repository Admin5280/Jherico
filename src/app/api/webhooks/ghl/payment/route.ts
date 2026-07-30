import { NextRequest } from "next/server";
import { handleGhlWebhook } from "@/lib/ghl/webhook";
import { adaptPayment } from "@/lib/ghl/adapters";
import { processPayment } from "@/lib/ghl/process";
import { RawGhlPayment } from "@/lib/ghl/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleGhlWebhook<RawGhlPayment, ReturnType<typeof adaptPayment>>(req, {
    eventType: "payment",
    adapt: adaptPayment,
    process: processPayment,
    entityId: (n) => n.externalId,
  });
}
