import type { SilverRecord, GoldKPIs } from "./types";

export function runGold(silver: SilverRecord[]): GoldKPIs {
  const approved = silver.filter(r => r.status === "approved");

  const total_claims   = silver.length;
  const total_payout   = approved.reduce((s, r) => s + r.claim_amount, 0);
  const avg_claim_amount = Math.round(silver.reduce((s, r) => s + r.claim_amount, 0) / silver.length);
  const approval_rate  = Math.round((approved.length / total_claims) * 1000) / 10;
  const avg_los        = Math.round((silver.reduce((s, r) => s + r.days_in_hospital, 0) / silver.length) * 10) / 10;

  // top diagnoses
  const dx_map = new Map<string, { count: number; total: number }>();
  for (const r of silver) {
    const prev = dx_map.get(r.diagnosis) ?? { count: 0, total: 0 };
    dx_map.set(r.diagnosis, { count: prev.count + 1, total: prev.total + r.claim_amount });
  }
  const top_diagnoses = [...dx_map.entries()]
    .map(([diagnosis, v]) => ({ diagnosis, count: v.count, avg_amount: Math.round(v.total / v.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // provider performance
  const prov_map = new Map<string, { claims: number; total: number; approved: number }>();
  for (const r of silver) {
    const prev = prov_map.get(r.provider_id) ?? { claims: 0, total: 0, approved: 0 };
    prov_map.set(r.provider_id, {
      claims:   prev.claims + 1,
      total:    prev.total + r.claim_amount,
      approved: prev.approved + (r.status === "approved" ? 1 : 0),
    });
  }
  const provider_performance = [...prov_map.entries()]
    .map(([provider_id, v]) => ({
      provider_id,
      claims:       v.claims,
      avg_amount:   Math.round(v.total / v.claims),
      approval_rate: Math.round((v.approved / v.claims) * 100),
    }))
    .sort((a, b) => b.claims - a.claims);

  // monthly trend (by service_date month)
  const month_map = new Map<string, { claims: number; total: number }>();
  for (const r of silver) {
    const month = r.service_date.slice(0, 7); // YYYY-MM
    const prev = month_map.get(month) ?? { claims: 0, total: 0 };
    month_map.set(month, { claims: prev.claims + 1, total: prev.total + r.claim_amount });
  }
  const monthly_trend = [...month_map.entries()]
    .map(([month, v]) => ({ month, claims: v.claims, total: v.total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    total_claims,
    total_payout,
    avg_claim_amount,
    approval_rate,
    avg_los,
    top_diagnoses,
    provider_performance,
    monthly_trend,
  };
}
