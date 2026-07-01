"use client";

type Status = "idle" | "running" | "done";

interface Props {
  status: { bronze: Status; silver: Status; gold: Status };
}

const stages = [
  { key: "bronze" as const, label: "Bronze", sub: "Raw Ingestion", color: "bronze", icon: "📥" },
  { key: "silver" as const, label: "Silver", sub: "Clean & Enrich",  color: "silver", icon: "🔧" },
  { key: "gold"   as const, label: "Gold",   sub: "Analytics KPIs",  color: "gold",   icon: "📊" },
];

const colorMap: Record<string, Record<Status, string>> = {
  bronze: { idle: "border-slate-700 text-slate-600", running: "border-bronze text-bronze bg-bronze/10 shadow-lg shadow-bronze/20", done: "border-bronze/60 text-bronze bg-bronze/10" },
  silver: { idle: "border-slate-700 text-slate-600", running: "border-silver text-silver bg-silver/10 shadow-lg shadow-silver/20", done: "border-silver/60 text-silver bg-silver/10" },
  gold:   { idle: "border-slate-700 text-slate-600", running: "border-gold text-gold bg-gold/10 shadow-lg shadow-gold/20",   done: "border-gold/60 text-gold bg-gold/10"   },
};

export default function StageFlow({ status }: Props) {
  return (
    <div className="flex items-center gap-0 bg-surface border border-border rounded-2xl p-6">
      {stages.map((stage, i) => (
        <div key={stage.key} className="flex items-center flex-1">
          <div className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-500 ${colorMap[stage.color][status[stage.key]]}`}>
            <div className="text-3xl">{stage.icon}</div>
            <div className="text-sm font-bold">{stage.label}</div>
            <div className="text-xs opacity-70">{stage.sub}</div>
            {status[stage.key] === "running" && (
              <div className="flex gap-1 mt-1">
                {[0,1,2].map(j => (
                  <span key={j} className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                ))}
              </div>
            )}
            {status[stage.key] === "done" && (
              <span className="text-xs bg-current/20 px-2 py-0.5 rounded-full">✓ Done</span>
            )}
          </div>
          {i < stages.length - 1 && (
            <div className="flex flex-col items-center gap-1 px-2">
              <div className={`h-0.5 w-8 transition-all duration-700 ${
                status[stages[i + 1].key] !== "idle" ? "bg-accent" : "bg-slate-700"
              }`} />
              <span className={`text-xs transition-all ${status[stages[i + 1].key] !== "idle" ? "text-accent" : "text-slate-700"}`}>→</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
