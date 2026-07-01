import { runBronze } from "@/lib/bronze";
import { runSilver } from "@/lib/silver";
import { runGold }   from "@/lib/gold";

export const runtime = "nodejs";

function enc(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + "\n");
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stage 1 — Bronze
        controller.enqueue(enc({ stage: "bronze", status: "running" }));
        await sleep(800);
        const bronze = runBronze();
        controller.enqueue(enc({ stage: "bronze", status: "done", data: bronze }));
        await sleep(600);

        // Stage 2 — Silver
        controller.enqueue(enc({ stage: "silver", status: "running" }));
        await sleep(1000);
        const silver = runSilver(bronze.records);
        controller.enqueue(enc({ stage: "silver", status: "done", data: silver }));
        await sleep(600);

        // Stage 3 — Gold
        controller.enqueue(enc({ stage: "gold", status: "running" }));
        await sleep(900);
        const gold = runGold(silver.records);
        controller.enqueue(enc({ stage: "gold", status: "done", data: gold }));

        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
