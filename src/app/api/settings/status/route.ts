import { NextResponse } from "next/server";
import { requireRole, isGuardError, authEnvConfigured } from "@/lib/authServer";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(["Admin"]);
  if (isGuardError(gate)) return NextResponse.json({ error: gate.error }, { status: gate.status });
  return NextResponse.json({
    serviceRoleConfigured: supabaseConfigured(),
    authConfigured: authEnvConfigured(),
    webhookSecretSet: !!process.env.GHL_WEBHOOK_SECRET,
    webhookEndpoints: [
      "/api/webhooks/ghl/contact",
      "/api/webhooks/ghl/opportunity",
      "/api/webhooks/ghl/appointment",
      "/api/webhooks/ghl/payment",
      "/api/webhooks/ghl/order",
      "/api/webhooks/ghl/subscription",
    ],
    storageBuckets: ["job-before-photos", "job-after-photos", "job-damage-photos", "profile-photos"],
  });
}
