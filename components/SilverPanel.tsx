"use client";

import type { SilverRecord } from "@/lib/types";

interface Props {
  data: {
    records: SilverRecord[];
    total: number;
    removed: number;
    fixed: number;
    transformations: string[];
  } | null;
  loading: boolean;
}

export default function SilverPanel({ data, loading }: Props) {
  if (loading) return <LoadingCard />;
  if (!data)   return null;

  const { records, total, removed, fixed, transformations } = data;
  const preview = records.slice(0, 12);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Clean Records" value={total} color="success" />
        <StatCard label="Records Removed" value={removed} note="deduped / unparseable" color="slate" />
        <StatCard label="Fields Fixed" value={fixed} note="repaired / imputed" color="silver" />
        <StatCard label="Quality Rate" value={`${Math.round((total/(total+removed))*100)}%`} color="success" />
      </div>

      {/* Transformations log */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-silver uppercase tracking-wider">Transformation Log</span>
        </div>
        <div className="p-4 space-y-2">
          {transformations.map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-success mt-0.5">✓</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-silver uppercase tracking-wider">Clean Claims (first 12 of {total})</span>
          <span className="text-xs text-slate-500">deduped · normalized · validated</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 bg-slate-900/40">
                {["Claim ID","Member","Provider","Date","ICD Code","Amount","Status","LOS","Flags"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {preview.map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 font-mono text-slate-300">{r.claim_id}</td>
                  <td className="px-3 py-2 font-mono text-slate-400">{r.member_id}</td>
                  <td className="px-3 py-2 font-mono text-slate-400">{r.provider_id}</td>
                  <td className="px-3 py-2 font-mono text-success">{r.service_date}</td>
                  <td className="px-3 py-2 font-mono text-success">{r.icd_code}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">${r.claim_amount.toLocaleString()}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 font-mono text-slate-400">{r.days_in_hospital}d</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r._quality_flags.map(f => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-silver/10 text-silver/70 font-mono">{f}</span>
                      ))}
                      {r._quality_flags.length === 0 && <span className="text-[9px] text-success">clean</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 12 && (
          <div className="px-4 py-2 border-t border-border text-xs text-slate-500 text-center">
            + {total - 12} more clean records
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/20 text-success",
    denied:   "bg-danger/20 text-danger",
    pending:  "bg-warn/20 text-warn",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${map[status] ?? "text-slate-500"}`}>{status}</span>;
}

function StatCard({ label, value, color, note }: { label: string; value: string | number; color: string; note?: string }) {
  const colorMap: Record<string, string> = {
    success: "border-success/30 text-success",
    silver:  "border-silver/30 text-silver",
    slate:   "border-slate-600/30 text-slate-400",
  };
  return (
    <div className={`bg-surface border rounded-xl p-4 ${colorMap[color]}`}>
      <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {note && <div className="text-[10px] mt-1 text-current opacity-50">{note}</div>}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="border border-silver/20 bg-silver/5 rounded-xl p-8 text-center">
      <div className="flex justify-center gap-1 mb-3">
        {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <p className="text-sm text-slate-400">Cleaning and normalizing records…</p>
    </div>
  );
}
