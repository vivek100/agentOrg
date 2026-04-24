import { z } from "zod";
import { FinalOutputSchema } from "./org-spec";

/** Streamed during an org run (animation + traces tab). */
export const TraceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("run_started"),
    runId: z.string(),
    stepId: z.string(),
  }),
  z.object({
    type: z.literal("step_started"),
    stepId: z.string(),
  }),
  z.object({
    type: z.literal("agent_queued"),
    agentId: z.string(),
  }),
  z.object({
    type: z.literal("agent_started"),
    agentId: z.string(),
    edgeId: z.string().optional(),
  }),
  z.object({
    type: z.literal("agent_completed"),
    agentId: z.string(),
  }),
  z.object({
    type: z.literal("run_completed"),
    finalOutput: FinalOutputSchema,
  }),
]);

export type TraceEvent = z.infer<typeof TraceEventSchema>;
