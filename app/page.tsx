"use client";

import { useState, useCallback } from "react";
import type { BronzeRecord, SilverRecord, GoldKPIs } from "@/lib/types";
import BronzePanel  from "@/components/BronzePanel";
import SilverPanel  from "@/components/SilverPanel";
import GoldPanel    from "@/components/GoldPanel";
import StageFlow    from "@/components/StageFlow";

type StageStatus = "idle" | "running" | "done";

interface PipelineState {
  bronze: StageStatus;
  silver: StageStatus;
  gold:   StageStatus;
}

interface PipelineData {
  bronze: { records: BronzeRecord[]; total: number; issues: { duplicates: number; nulls: number; bad_codes: number } } | null;
  silver: { records: SilverRecord[]; total: number; removed: number; fixed: number; transformations: string[] } | null;
  gold:   GoldKPIs | null;
}

export default function Home() {
  const [status, setStatus]   = useState<PipelineState>({ bronze: "idle", silver: "idle", gold: "idle" });
  const [data,   setData]     = useState<PipelineData>({ bronze: null, silver: null, gold: null });
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"bronze" | "silver" | "gold">("bronze");

  const runPipeline = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setStatus({ bronze: "idle", silver: "idle", gold: "idle" });
    setData({ bronze: null, silver: null, gold: null });

    const res = await fetch("/api/pipeline");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (msg.stage === "bronze") {
          if (msg.status === "running") { setStatus(s => ({ ...s, bronze: "running" })); setActiveTab("bronze"); }
          if (msg.status === "done")    { setStatus(s => ({ ...s, bronze: "done" })); setData(d => ({ ...d, bronze: msg.data })); }
        }
        if (msg.stage === "silver") {
          if (msg.status === "running") { setStatus(s => ({ ...s, silver: "running" })); setActiveTab("silver"); }
          if (msg.status === "done")    { setStatus(s => ({ ...s, silver: "done" })); setData(d => ({ ...d, silver: msg.data })); }
        }
        if (msg.stage === "gold") {
          if (msg.status === "running") { setStatus(s => ({ ...s, gold: "running" })); setActiveTab("gold"); }
          if (msg.status === "done")    { setStatus(s => ({ ...s, gold: "done" })); setData(d => ({ ...d, gold: msg.data })); }
        }
      }
    }
    setRunning(false);
  }, [running]);

  const anyDone = status.bronze !== "idle" || status.silver !== "idle" || status.gold !== "idle";

  return (
    <main className="min-h-screen bg-bg text-slate-200">
      {/* Header */}
      <div className="border-b border-border bg-surface/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Healthcare Claims Pipeline</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Medallion Architecture · Bronze → Silver → Gold · Synthetic Data Demo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-border/60 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              60 raw records
            </span>
            <button
              onClick={runPipeline}
              disabled={running}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all
                ${running
                  ? "bg-accent/30 text-accent/60 cursor-not-allowed"
                  : "bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20"
                }
              `}
            >
              {running ? (
                <>
                  <Spinner /> Running…
                </>
              ) : anyDone ? "Run Again" : "▶ Run Pipeline"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stage flow diagram */}
        <StageFlow status={status} />

        {!anyDone && !running && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">⚙️</div>
            <p className="text-lg font-medium text-slate-400">Click <span className="text-accent">▶ Run Pipeline</span> to start</p>
            <p className="text-sm mt-2">Watch 60 synthetic healthcare claims flow through Bronze → Silver → Gold in real time.</p>
          </div>
        )}

        {anyDone && (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
              {(["bronze", "silver", "gold"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  disabled={status[tab] === "idle"}
                  className={`
                    px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
                    ${activeTab === tab
                      ? tab === "bronze" ? "bg-bronze/20 text-bronze border border-bronze/30"
                      : tab === "silver" ? "bg-silver/20 text-silver border border-silver/30"
                      : "bg-gold/20 text-gold border border-gold/30"
                      : "text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    }
                  `}
                >
                  {tab === "bronze" ? "🟤" : tab === "silver" ? "⚪" : "🟡"} {tab}
                  {status[tab] === "running" && <Spinner className="ml-2" />}
                  {status[tab] === "done" && data[tab] && (
                    <span className="ml-2 text-xs opacity-60">
                      {tab === "bronze" ? `${(data.bronze!.total)} rows` :
                       tab === "silver" ? `${(data.silver!.total)} rows` : "KPIs"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div>
              {activeTab === "bronze" && (
                <BronzePanel data={data.bronze} loading={status.bronze === "running"} />
              )}
              {activeTab === "silver" && (
                <SilverPanel data={data.silver} loading={status.silver === "running"} />
              )}
              {activeTab === "gold" && (
                <GoldPanel data={data.gold} loading={status.gold === "running"} />
              )}
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-border mt-16 py-6 text-center text-xs text-slate-600">
        Built by <a href="https://github.com/sathvikreddy-colab" className="text-accent/70 hover:text-accent" target="_blank" rel="noopener noreferrer">Sathvik Reddy Puli</a>
        {" · "}All data is synthetic — no real PHI used.
      </footer>
    </main>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} />
  );
}
