import { z } from "zod";

/** User feedback can target several anchors (Phase 1 subset; extend for tool_call / trace rows later). */
export const FeedbackTargetTypeSchema = z.enum([
  "org",
  "org_version",
  "run",
  "final_output",
  "team",
  "agent",
  "workflow_step",
  "edge",
]);

export const FeedbackPayloadSchema = z.object({
  targetType: FeedbackTargetTypeSchema,
  targetId: z.string(),
  runId: z.string().optional(),
  orgVersion: z.number().int().positive().optional(),
  orgId: z.string().optional(),
  message: z.string().min(1),
});

export type FeedbackTargetType = z.infer<typeof FeedbackTargetTypeSchema>;
export type FeedbackPayload = z.infer<typeof FeedbackPayloadSchema>;
