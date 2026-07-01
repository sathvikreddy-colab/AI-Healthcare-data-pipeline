"use client";

import type { GoldKPIs } from "@/lib/types";

interface Props {
  data: GoldKPIs | null;
  loading: boolean;
}

export default function GoldPanel({ data, loading }: Props) {
  if (loading) return <LoadingCard />;
  if (!data)   return null;

  const maxDx   = Math.max(...data.top_diagnoses.map(d => d.count));
  const maxTrend = Math.max(...data.monthly_trend.map(m => m.total));

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <KpiCard label="Total Claims" value={data.total_claims.toLocaleString()} icon="📋" />
        <KpiCard label="Total Payout" value={`$${(data.total_payout / 1000).toFixed(0)}K`} icon="💰" />
        <KpiCard label="Avg Claim" value={`$${data.avg_claim_amount.toLocaleString()}`} icon="📈" />
        <KpiCard label="Approval Rate" value={`${data.approval_rate}%`} icon="✅" color={data.approval_rate >= 60 ? "success" : "warn"} />
        <KpiCard label="Avg LOS" value={`${data.avg_los}d`} icon="🏥" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Diagnoses */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-gold uppercase tracking-wider">Top 5 Diagnoses</span>
          </div>
          <div className="p-4 space-y-3">
            {data.top_diagnoses.map((dx, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 truncate pr-2">{dx.diagnosis}</span>
                  <span className="text-slate-500 font-mono text-xs whitespace-nowrap">{dx.count} claims · avg ${dx.avg_amount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold/60 rounded-full transition-all duration-1000"
                    style={{ width: `${(dx.count / maxDx) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-gold uppercase tracking-wider">Monthly Claim Volume & Spend</span>
          </div>
          <div className="p-4 space-y-3">
            {data.monthly_trend.map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-mono">{m.month}</span>
                  <span className="text-slate-500">{m.claims} claims · ${(m.total / 1000).toFixed(0)}K</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent/60 rounded-full transition-all duration-1000"
                    style={{ width: `${(m.total / maxTrend) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provider Performance Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-gold uppercase tracking-wider">Provider Performance</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 bg-slate-900/40 text-xs">
                {["Provider ID","Total Claims","Avg Claim Amount","Approval Rate","Volume Share"].map(h => (
                  <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.provider_performance.map((p, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-gold font-semibold">{p.provider_id}</td>
                  <td className="px-4 py-3 text-slate-300">{p.claims}</td>
                  <td className="px-4 py-3 text-slate-300">${p.avg_amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      p.approval_rate >= 70 ? "bg-success/20 text-success" :
                      p.approval_rate >= 50 ? "bg-warn/20 text-warn" :
                      "bg-danger/20 text-danger"
                    }`}>{p.approval_rate}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold/50 rounded-full"
                          style={{ width: `${(p.claims / data.total_claims) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {Math.round((p.claims / data.total_claims) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture note */}
      <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 text-sm text-slate-400">
        <span className="text-gold font-semibold">Gold Layer</span> — aggregated KPI models ready for BI tools (Power BI, Tableau, Looker). Built from Silver layer clean records using SQL aggregations and window functions. In production this layer feeds executive dashboards and compliance reports.
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color === "success" ? "text-success" : color === "warn" ? "text-warn" : "text-gold"}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="border border-gold/20 bg-gold/5 rounded-xl p-8 text-center">
      <div className="flex justify-center gap-1 mb-3">
        {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <p className="text-sm text-slate-400">Aggregating Gold KPIs…</p>
    </div>
  );
}
