import { createTraceEvents } from "@/features/workspace/mock-data";
import { jsonApiError } from "@/lib/contracts";
import {
  completeRunRow,
  getDb,
  getRunRow,
  insforgeUnavailable,
  insertTraceRow,
  listTraceEvents,
} from "@/server/insforge/agentorg-repo";
import { sseEncode } from "@/server/sse";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;

  if (!getDb()) {
    return insforgeUnavailable();
  }

  const row = await getRunRow(runId);
  if (!row) {
    return jsonApiError(404, "not_found", "Run not found.");
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let events = await listTraceEvents(runId);
        let generated = false;

        if (events.length === 0) {
          events = createTraceEvents();
          let seq = 0;
          for (const ev of events) {
            await insertTraceRow(runId, seq, ev);
            seq += 1;
          }
          generated = true;
        }

        for (const ev of events) {
          controller.enqueue(encoder.encode(sseEncode(ev)));
          await new Promise((r) => setTimeout(r, 35));
        }

        if (generated) {
          const last = events[events.length - 1];
          if (last?.type === "run_completed") {
            await completeRunRow(runId, last.finalOutput);
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
