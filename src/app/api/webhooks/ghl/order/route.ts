import { NextRequest } from "next/server";
import { handleGhlWebhook } from "@/lib/ghl/webhook";
import { adaptOrder } from "@/lib/ghl/adapters";
import { processOrder } from "@/lib/ghl/process";
import { RawGhlOrder } from "@/lib/ghl/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleGhlWebhook<RawGhlOrder, ReturnType<typeof adaptOrder>>(req, {
    eventType: "order",
    adapt: adaptOrder,
    process: processOrder,
    entityId: (n) => n.externalId,
  });
}
