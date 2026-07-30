import { NextRequest } from "next/server";
import { handleGhlWebhook } from "@/lib/ghl/webhook";
import { adaptOpportunity } from "@/lib/ghl/adapters";
import { processOpportunity } from "@/lib/ghl/process";
import { RawGhlOpportunity } from "@/lib/ghl/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleGhlWebhook<RawGhlOpportunity, ReturnType<typeof adaptOpportunity>>(req, {
    eventType: "opportunity",
    adapt: adaptOpportunity,
    process: processOpportunity,
    entityId: (n) => n.ghlOpportunityId,
  });
}
