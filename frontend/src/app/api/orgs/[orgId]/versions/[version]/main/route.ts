import { jsonApiError } from "@/lib/contracts";
import { getDb, insforgeUnavailable, setMainVersion } from "@/server/insforge/agentorg-repo";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ orgId: string; version: string }> }) {
  const { orgId, version: versionStr } = await ctx.params;
  const version = Number.parseInt(versionStr, 10);
  if (!Number.isFinite(version) || version < 1) {
    return jsonApiError(400, "invalid_version", "Version must be a positive integer.");
  }

  if (!getDb()) {
    return insforgeUnavailable();
  }

  const result = await setMainVersion(orgId, version);
  if (!result.ok) {
    return jsonApiError(500, "db_error", result.message);
  }

  return Response.json({ ok: true });
}
