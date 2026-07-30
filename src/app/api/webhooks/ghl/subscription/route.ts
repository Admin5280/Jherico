import { NextRequest } from "next/server";
import { handleGhlWebhook } from "@/lib/ghl/webhook";
import { adaptSubscription } from "@/lib/ghl/adapters";
import { processSubscription } from "@/lib/ghl/process";
import { RawGhlSubscription } from "@/lib/ghl/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleGhlWebhook<RawGhlSubscription, ReturnType<typeof adaptSubscription>>(req, {
    eventType: "subscription",
    adapt: adaptSubscription,
    process: processSubscription,
    entityId: (n) => n.ghlSubscriptionId,
  });
}
