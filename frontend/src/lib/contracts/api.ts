import { z } from "zod";
import { FeedbackPayloadSchema } from "./feedback";
import { TraceEventSchema } from "./trace-events";

export const OrgGenerateRequestSchema = z.object({
  task: z.string().min(1).max(32_000),
  version: z.number().int().positive().optional().default(1),
});

export type OrgGenerateRequest = z.infer<typeof OrgGenerateRequestSchema>;

export const OrgApproveBodySchema = z.object({
  version: z.number().int().positive(),
});

export type OrgApproveBody = z.infer<typeof OrgApproveBodySchema>;

export const OrgRunBodySchema = z.object({
  version: z.number().int().positive(),
});

export type OrgRunBody = z.infer<typeof OrgRunBodySchema>;

export const RunStartResponseSchema = z.object({
  runId: z.string().min(1),
});

export type RunStartResponse = z.infer<typeof RunStartResponseSchema>;

/** Feedback POST: orgId required at top level for routing/persistence. */
export const FeedbackSubmitBodySchema = FeedbackPayloadSchema.extend({
  orgId: z.string().min(1),
});

export type FeedbackSubmitBody = z.infer<typeof FeedbackSubmitBodySchema>;

export const OrgHistoryVersionSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  status: z.string(),
  created_at: z.string(),
});

export const OrgHistoryRunSchema = z.object({
  id: z.string(),
  org_version: z.number().int().positive(),
  status: z.string(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

export const OrgHistoryFeedbackSchema = z.object({
  id: z.string(),
  org_version: z.number().nullable(),
  run_id: z.string().nullable(),
  target_type: z.string(),
  target_id: z.string(),
  message: z.string(),
  created_at: z.string(),
});

export const OrgHistoryResponseSchema = z.object({
  orgId: z.string(),
  versions: z.array(OrgHistoryVersionSchema),
  runs: z.array(OrgHistoryRunSchema),
  feedback: z.array(OrgHistoryFeedbackSchema),
});

export type OrgHistoryResponse = z.infer<typeof OrgHistoryResponseSchema>;

export const RunDetailResponseSchema = z.object({
  run: z.object({
    id: z.string(),
    org_id: z.string(),
    org_version: z.number().int().positive(),
    status: z.string(),
    final_output: z.unknown().nullable(),
  }),
  traceEvents: z.array(TraceEventSchema),
  feedback: z.array(OrgHistoryFeedbackSchema),
});

export type RunDetailResponse = z.infer<typeof RunDetailResponseSchema>;

export const ApiErrorBodySchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export function jsonApiError(
  status: number,
  error: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiErrorBody = { error, message, ...(details !== undefined ? { details } : {}) };
  return Response.json(body, { status });
}
