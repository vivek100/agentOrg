import { z } from "zod";

export const OrgStatusSchema = z.enum(["draft", "approved", "main", "archived"]);
export const AgentStatusSchema = z.enum(["idle", "queued", "running", "done", "failed"]);
export const CanvasTabSchema = z.enum(["design", "run", "traces", "history"]);
export const ResourceScopeSchema = z.enum(["org", "team", "private"]);
export const SelectionKindSchema = z.enum([
  "agent",
  "team",
  "edge",
  "workflow",
  "output",
]);

export const ResourceBadgeSchema = z.object({
  id: z.string(),
  label: z.string(),
  scope: ResourceScopeSchema,
});

export const ToolSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const LeadershipNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  status: AgentStatusSchema,
});

export const TeamSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string(),
  resources: z.array(ResourceBadgeSchema),
});

export const AgentSpecSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string(),
  role: z.string(),
  status: AgentStatusSchema,
  tools: z.array(z.string()),
  resources: z.array(ResourceBadgeSchema),
  promptSummary: z.string(),
});

export const WorkflowStepSchema = z.object({
  id: z.string(),
  step: z.number(),
  label: z.string(),
  agentIds: z.array(z.string()),
  parallel: z.boolean(),
  status: z.enum(["pending", "active", "done"]),
});

export const OrgEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string(),
  payloadSummary: z.string(),
});

export const FinalEmailSchema = z.object({
  startup: z.string(),
  subject: z.string(),
  body: z.string(),
});

export const FinalOutputSchema = z.object({
  summary: z.string(),
  emails: z.array(FinalEmailSchema),
});

export const AgentTraceSchema = z.object({
  agentId: z.string(),
  input: z.string(),
  trace: z.array(z.string()),
  output: z.string(),
  feedback: z.array(z.string()),
  toolsUsed: z.array(z.string()),
});

export const RunSpecSchema = z.object({
  id: z.string(),
  status: z.enum(["idle", "running", "success"]),
  activeEdgeId: z.string().optional(),
  activeStepId: z.string().optional(),
  traces: z.array(AgentTraceSchema),
  finalOutput: FinalOutputSchema.optional(),
});

export const OrgSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  mission: z.string(),
  task: z.string(),
  version: z.number().int().nonnegative(),
  status: OrgStatusSchema,
  leadership: z.array(LeadershipNodeSchema),
  teams: z.array(TeamSpecSchema),
  agents: z.array(AgentSpecSchema),
  tools: z.array(ToolSpecSchema),
  workflow: z.array(WorkflowStepSchema),
  edges: z.array(OrgEdgeSchema),
  run: RunSpecSchema,
  createdAt: z.string(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "agent", "system"]),
  content: z.string(),
});

export const DemoStateSchema = z.object({
  task: z.string(),
  versions: z.array(OrgSpecSchema),
  currentVersion: z.number().int().positive(),
  chatMessages: z.array(ChatMessageSchema),
  activeTab: CanvasTabSchema,
  selectedId: z.string().optional(),
  selectedKind: SelectionKindSchema.optional(),
  visibleIds: z.array(z.string()),
  isGenerating: z.boolean(),
  isRunning: z.boolean(),
});

export type OrgStatus = z.infer<typeof OrgStatusSchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type CanvasTab = z.infer<typeof CanvasTabSchema>;
export type ResourceScope = z.infer<typeof ResourceScopeSchema>;
export type SelectionKind = z.infer<typeof SelectionKindSchema>;
export type ResourceBadge = z.infer<typeof ResourceBadgeSchema>;
export type ToolSpec = z.infer<typeof ToolSpecSchema>;
export type LeadershipNode = z.infer<typeof LeadershipNodeSchema>;
export type TeamSpec = z.infer<typeof TeamSpecSchema>;
export type AgentSpec = z.infer<typeof AgentSpecSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type OrgEdge = z.infer<typeof OrgEdgeSchema>;
export type FinalEmail = z.infer<typeof FinalEmailSchema>;
export type FinalOutput = z.infer<typeof FinalOutputSchema>;
export type AgentTrace = z.infer<typeof AgentTraceSchema>;
export type RunSpec = z.infer<typeof RunSpecSchema>;
export type OrgSpec = z.infer<typeof OrgSpecSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type DemoState = z.infer<typeof DemoStateSchema>;
