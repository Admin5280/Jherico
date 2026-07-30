import { SupabaseClient } from "@supabase/supabase-js";
import { MarketingMetric } from "./types";

export interface PlatformSummary {
  platform: string;
  ad_spend: number;
  leads: number;
  booked_jobs: number;
  revenue: number;
  impressions: number;
  clicks: number;
  cpl: number;      // cost per lead
  cpbj: number;     // cost per booked job
  roas: number;     // revenue / spend
  bookingRate: number; // %
}

export interface MarketingData {
  rows: MarketingMetric[];
  totals: Omit<PlatformSummary, "platform">;
  byPlatform: PlatformSummary[];
  trend: { date: string; spend: number; leads: number; revenue: number }[];
}

function summarize(rows: MarketingMetric[], platform: string): PlatformSummary {
  const spend = rows.reduce((s, r) => s + Number(r.ad_spend || 0), 0);
  const leads = rows.reduce((s, r) => s + Number(r.leads || 0), 0);
  const booked = rows.reduce((s, r) => s + Number(r.booked_jobs || 0), 0);
  const revenue = rows.reduce((s, r) => s + Number(r.revenue || 0), 0);
  const impressions = rows.reduce((s, r) => s + Number(r.impressions || 0), 0);
  const clicks = rows.reduce((s, r) => s + Number(r.clicks || 0), 0);
  return {
    platform, ad_spend: spend, leads, booked_jobs: booked, revenue, impressions, clicks,
    cpl: leads ? spend / leads : 0,
    cpbj: booked ? spend / booked : 0,
    roas: spend ? revenue / spend : 0,
    bookingRate: leads ? (booked / leads) * 100 : 0,
  };
}

export async function getMarketing(sb: SupabaseClient, fromIso?: string, toIso?: string): Promise<MarketingData> {
  let q = sb.from("marketing_metrics").select("*").order("metric_date", { ascending: true });
  if (fromIso) q = q.gte("metric_date", fromIso);
  if (toIso) q = q.lte("metric_date", toIso);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as MarketingMetric[];

  const platforms = Array.from(new Set(rows.map((r) => r.platform)));
  const byPlatform = platforms.map((p) => summarize(rows.filter((r) => r.platform === p), p)).sort((a, b) => b.revenue - a.revenue);

  // daily trend
  const dayMap = new Map<string, { spend: number; leads: number; revenue: number }>();
  for (const r of rows) {
    const key = r.metric_date;
    const cur = dayMap.get(key) ?? { spend: 0, leads: 0, revenue: 0 };
    cur.spend += Number(r.ad_spend || 0);
    cur.leads += Number(r.leads || 0);
    cur.revenue += Number(r.revenue || 0);
    dayMap.set(key, cur);
  }
  const trend = Array.from(dayMap.entries()).map(([date, v]) => ({ date: date.slice(5), ...v }));

  const totals = summarize(rows, "All");
  return { rows, totals, byPlatform, trend };
}
