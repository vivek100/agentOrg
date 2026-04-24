import { z } from "zod";
import {
  AgentSpecSchema,
  LeadershipNodeSchema,
  OrgEdgeSchema,
  TeamSpecSchema,
  ToolSpecSchema,
  WorkflowStepSchema,
} from "./org-spec";

/** Streamed while designing an org (chat + incremental canvas). */
export const CanvasEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat_delta"),
    message: z.string(),
  }),
  z.object({
    type: z.literal("org_identity"),
    orgId: z.string(),
    name: z.string(),
    mission: z.string(),
    tools: z.array(ToolSpecSchema).optional(),
  }),
  z.object({
    type: z.literal("leadership_created"),
    node: LeadershipNodeSchema,
  }),
  z.object({
    type: z.literal("team_created"),
    team: TeamSpecSchema,
  }),
  z.object({
    type: z.literal("agent_created"),
    agent: AgentSpecSchema,
  }),
  z.object({
    type: z.literal("workflow_step_created"),
    step: WorkflowStepSchema,
  }),
  z.object({
    type: z.literal("edge_created"),
    edge: OrgEdgeSchema,
  }),
  z.object({
    type: z.literal("org_complete"),
    orgId: z.string(),
    version: z.number().int().positive(),
  }),
]);

export type CanvasEvent = z.infer<typeof CanvasEventSchema>;
