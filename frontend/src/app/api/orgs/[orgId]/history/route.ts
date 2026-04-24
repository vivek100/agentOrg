import { OrgHistoryResponseSchema } from "@/lib/contracts";
import { getDb, insforgeUnavailable, listFeedbackForOrg, listRunsForOrg, listVersionsForOrg } from "@/server/insforge/agentorg-repo";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await ctx.params;
  if (!getDb()) {
    return insforgeUnavailable();
  }

  const [versions, runs, feedback] = await Promise.all([
    listVersionsForOrg(orgId),
    listRunsForOrg(orgId),
    listFeedbackForOrg(orgId),
  ]);

  const body = OrgHistoryResponseSchema.parse({
    orgId,
    versions,
    runs,
    feedback,
  });

  return Response.json(body);
}
