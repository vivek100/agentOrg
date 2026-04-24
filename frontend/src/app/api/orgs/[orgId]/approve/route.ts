import { OrgApproveBodySchema, jsonApiError } from "@/lib/contracts";
import { getDb, insforgeUnavailable, updateVersionApproved } from "@/server/insforge/agentorg-repo";

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

  const parsed = OrgApproveBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(400, "validation_error", "Invalid approve payload.", parsed.error.flatten());
  }

  const result = await updateVersionApproved(orgId, parsed.data.version);
  if (!result.ok) {
    return jsonApiError(500, "db_error", result.message);
  }

  return Response.json({ ok: true });
}
