"use client";

import type { BronzeRecord } from "@/lib/types";

interface Props {
  data: {
    records: BronzeRecord[];
    total: number;
    issues: { duplicates: number; nulls: number; bad_codes: number };
  } | null;
  loading: boolean;
}

const VALID_ICD = new Set(["J18.9","I21.9","E11.9","J44.1","N18.3","I50.9","M54.5","Z00.00","K92.1","F32.1"]);

export default function BronzePanel({ data, loading }: Props) {
  if (loading) return <LoadingCard color="bronze" label="Ingesting raw claims feed…" />;
  if (!data)   return null;

  const { records, total, issues } = data;
  const preview = records.slice(0, 12);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Records Ingested" value={total} color="bronze" />
        <StatCard label="Duplicate Claim IDs" value={issues.duplicates} color="warn" badge="issue" />
        <StatCard label="Null Values" value={issues.nulls} color="warn" badge="issue" />
        <StatCard label="Bad ICD Codes" value={issues.bad_codes} color="danger" badge="issue" />
      </div>

      {/* Description */}
      <div className="bg-bronze/5 border border-bronze/20 rounded-xl p-4 text-sm text-slate-300">
        <span className="text-bronze font-semibold">Bronze Layer</span> — raw source fidelity preserved. Every record is stamped with ingestion timestamp and source system identifier. Issues are <em>flagged but not fixed</em> at this layer.
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-bronze uppercase tracking-wider">Raw Claims Feed (first 12 of {total})</span>
          <span className="text-xs text-slate-500 font-mono">source: claims_feed_v2</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 bg-slate-900/40">
                {["Row","Claim ID","Member","Provider","Date","ICD Code","CPT","Amount","Status","LOS"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {preview.map((r, i) => {
                const badIcd = !VALID_ICD.has(r.icd_code);
                const nullAmt = r.claim_amount === null;
                const nullLos = r.days_in_hospital === null;
                // naive dupe check within preview
                const isDupe = preview.findIndex(x => x.claim_id === r.claim_id) < i;
                return (
                  <tr key={i} className={`transition-colors hover:bg-white/5 ${isDupe ? "bg-warn/5" : ""}`}>
                    <td className="px-3 py-2 text-slate-600 font-mono">{r._row}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">
                      {isDupe ? <span className="text-warn">{r.claim_id} <Badge color="warn">DUPE</Badge></span> : r.claim_id}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-400">{r.member_id}</td>
                    <td className="px-3 py-2 font-mono text-slate-400">{r.provider_id}</td>
                    <td className="px-3 py-2 font-mono text-slate-400">{r.service_date}</td>
                    <td className="px-3 py-2 font-mono">
                      {badIcd
                        ? <span className="text-danger">{r.icd_code} <Badge color="danger">INVALID</Badge></span>
                        : <span className="text-success">{r.icd_code}</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-400">{r.cpt_code}</td>
                    <td className="px-3 py-2 font-mono">
                      {nullAmt ? <Badge color="warn">NULL</Badge> : <span className="text-slate-300">${Number(r.claim_amount).toLocaleString()}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {nullLos ? <Badge color="warn">NULL</Badge> : <span className="text-slate-400">{r.days_in_hospital}d</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > 12 && (
          <div className="px-4 py-2 border-t border-border text-xs text-slate-500 text-center">
            + {total - 12} more records · {issues.duplicates + issues.nulls + issues.bad_codes} total issues to fix in Silver
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: "warn" | "danger" | "success" }) {
  const c = { warn: "bg-warn/20 text-warn", danger: "bg-danger/20 text-danger", success: "bg-success/20 text-success" };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${c[color]}`}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/20 text-success",
    denied:   "bg-danger/20 text-danger",
    pending:  "bg-warn/20 text-warn",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${map[status] ?? "text-slate-500"}`}>{status}</span>;
}

function StatCard({ label, value, color, badge }: { label: string; value: number; color: string; badge?: string }) {
  const colorMap: Record<string, string> = {
    bronze: "border-bronze/30 text-bronze",
    warn:   "border-warn/30 text-warn",
    danger: "border-danger/30 text-danger",
  };
  return (
    <div className={`bg-surface border rounded-xl p-4 ${colorMap[color]}`}>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {badge === "issue" && value > 0 && <div className="text-[10px] mt-2 text-current opacity-60">⚠ needs fixing</div>}
    </div>
  );
}

function LoadingCard({ color, label }: { color: string; label: string }) {
  return (
    <div className={`border border-${color}/30 bg-${color}/5 rounded-xl p-8 text-center`}>
      <div className="flex justify-center gap-1 mb-3">
        {[0,1,2].map(i => <span key={i} className={`w-2 h-2 rounded-full bg-${color} animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
