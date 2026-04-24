import { FeedbackSubmitBodySchema, jsonApiError } from "@/lib/contracts";
import { getDb, insforgeUnavailable, insertFeedbackRow } from "@/server/insforge/agentorg-repo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!getDb()) {
    return insforgeUnavailable();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, "invalid_json", "Request body must be JSON.");
  }

  const parsed = FeedbackSubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(400, "validation_error", "Invalid feedback payload.", parsed.error.flatten());
  }

  const result = await insertFeedbackRow(parsed.data);
  if (!result.ok) {
    return jsonApiError(500, "db_error", result.message);
  }

  return Response.json({ ok: true });
}
