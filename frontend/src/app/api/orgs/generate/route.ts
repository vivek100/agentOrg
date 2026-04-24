import { OrgGenerateRequestSchema, jsonApiError } from "@/lib/contracts";
import { createGenerationEvents, createOrgFixture } from "@/features/workspace/mock-data";
import { persistOrgVersionIfConfigured } from "@/server/insforge/persist-org-version";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, "invalid_json", "Request body must be JSON.");
  }

  const parsed = OrgGenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(400, "validation_error", "Invalid generate payload.", parsed.error.flatten());
  }

  const { task, version } = parsed.data;
  const events = createGenerationEvents(task, version);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const event of events) {
          if (req.signal.aborted) {
            break;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          await new Promise((r) => setTimeout(r, 45));
        }

        if (!req.signal.aborted) {
          const fullOrg = createOrgFixture(task, version);
          await persistOrgVersionIfConfigured(fullOrg);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "chat_delta", message: `[server] ${message}` })}\n\n`),
        );
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
