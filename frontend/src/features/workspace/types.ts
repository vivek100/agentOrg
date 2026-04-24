/** UI + stream types and schemas (single source: `lib/contracts`). */
export type {
  AgentSpec,
  AgentStatus,
  AgentTrace,
  CanvasTab,
  ChatMessage,
  DemoState,
  FinalEmail,
  FinalOutput,
  LeadershipNode,
  OrgEdge,
  OrgSpec,
  OrgStatus,
  ResourceBadge,
  ResourceScope,
  RunSpec,
  SelectionKind,
  TeamSpec,
  ToolSpec,
  WorkflowStep,
} from "@/lib/contracts";

export type { CanvasEvent, TraceEvent } from "@/lib/contracts";

export {
  AgentSpecSchema,
  CanvasEventSchema,
  ChatMessageSchema,
  DemoStateSchema,
  FinalOutputSchema,
  OrgSpecSchema,
  RunSpecSchema,
  TraceEventSchema,
} from "@/lib/contracts";
