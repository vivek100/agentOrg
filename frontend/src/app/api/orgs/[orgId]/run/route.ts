import { OrgRunBodySchema, RunStartResponseSchema, jsonApiError } from "@/lib/contracts";
import { getDb, insforgeUnavailable, insertRun } from "@/server/insforge/agentorg-repo";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await ctx.params;
  if (!getDb()) {
    return insforgeUnavailable();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, "invalid_json", "Request body must be JSON.");
  }

  const parsed = OrgRunBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(400, "validation_error", "Invalid run payload.", parsed.error.flatten());
  }

  const runId = `run_${crypto.randomUUID()}`;
  const inserted = await insertRun(orgId, parsed.data.version, runId);
  if (!inserted.ok) {
    return jsonApiError(500, "db_error", inserted.message);
  }

  const payload: { runId: string } = { runId };
  RunStartResponseSchema.parse(payload);
  return Response.json(payload);
}
