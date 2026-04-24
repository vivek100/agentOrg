import { RunDetailResponseSchema, jsonApiError } from "@/lib/contracts";
import { getDb, getRunRow, insforgeUnavailable, listFeedbackForOrg, listTraceEvents } from "@/server/insforge/agentorg-repo";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;

  if (!getDb()) {
    return insforgeUnavailable();
  }

  const run = await getRunRow(runId);
  if (!run) {
    return jsonApiError(404, "not_found", "Run not found.");
  }

  const [traceEvents, allFeedback] = await Promise.all([listTraceEvents(runId), listFeedbackForOrg(run.org_id)]);

  const feedback = allFeedback.filter((f) => f.run_id === runId);

  const body = RunDetailResponseSchema.parse({
    run: {
      id: run.id,
      org_id: run.org_id,
      org_version: run.org_version,
      status: run.status,
      final_output: run.final_output,
    },
    traceEvents,
    feedback,
  });

  return Response.json(body);
}
