import { NextRequest } from "next/server";
import { handleGhlWebhook } from "@/lib/ghl/webhook";
import { adaptContact } from "@/lib/ghl/adapters";
import { processContact } from "@/lib/ghl/process";
import { RawGhlContact } from "@/lib/ghl/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleGhlWebhook<RawGhlContact, ReturnType<typeof adaptContact>>(req, {
    eventType: "contact",
    adapt: adaptContact,
    process: processContact,
    entityId: (n) => n.ghlContactId,
  });
}
