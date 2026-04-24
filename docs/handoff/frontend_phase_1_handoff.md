# Frontend Phase 1 Handoff

## Purpose

Use this handoff to start a fresh build chat for Phase 1. Phase 1 is the most important milestone: a fully working UI-first AgentOrg prototype with mock APIs, shadcn components, a polished canvas, org generation, runs, traces, feedback, versions, and “set main” behavior.

Do not start by integrating Ghost, TinyFish, Guild, or Chainguard. Those come later. The first build should prove the core product flow and frontend contracts.

## Product Summary

AgentOrg lets a user describe a task and watch an AI organization form around it.

Flow:

1. User lands on a ChatGPT-style prompt.
2. User enters a task.
3. Workspace opens.
4. Left side streams agent chat.
5. Right side canvas streams org design.
6. User approves org or requests changes.
7. User runs the task through the org.
8. Canvas shows the task moving through teams and agents.
9. User inspects traces by hovering/clicking agents, tools, teams, edges, and workflow steps.
10. User adds targeted feedback.
11. System creates a new org version.
12. User reruns the version and can mark one version as main.

## Phase 1 Tech Direction

- App: Next.js + TypeScript.
- UI: shadcn/ui + Tailwind.
- Canvas/diagram: start with React components and SVG edges. Add React Flow only if layout/edge interaction gets too hard.
- State: local reducer or Zustand-like store. The important part is a stable event reducer.
- Backend for Phase 1 mock: local mock API routes or in-memory mock service.
- Future backend: InsForge.
- Future main agent: Mastra using OpenAI `gpt-5.4-mini`.
- Do not use Guild in Phase 1.

## Important Existing Docs

- `docs/plans/integration_implementation_plan.md` - phased plan.
- `docs/ai_orgs_ui_ux_spec.md` - UI and mock API details.
- `docs/ai_orgs_spec_v2.md` - product vision.
- `docs/guides/main-agent-and-streaming.md` - Mastra and streaming direction.
- `docs/guides/insforge.md` - InsForge details.

## Core UX Requirements

### Landing

The landing page should feel like ChatGPT:

- centered prompt input
- examples below
- primary `Create Org` button
- minimal chrome
- no configuration form

Example prompts:

- `Research 3 AI startups and write cold outreach emails`
- `Analyze competitor pricing and summarize findings`
- `Scrape job postings and extract skills trends`

### Workspace

Single screen after landing:

- top bar:
  - app name
  - current org name
  - version selector
  - status badge
  - `Set Main`
  - `New Org`
- left panel:
  - agent chat stream
  - user can ask for changes
  - input stays available
- right panel:
  - canvas tabs:
    - `Design`
    - `Run`
    - `Traces`
    - `Agent History`

## Canvas Design Requirements

The canvas must show:

- company/org identity
- CEO/planner/coordinator node
- teams as grouped regions
- agents inside teams
- tools on agents as badges
- memory/resource scope badges
- workflow steps
- handoff edges
- active statuses
- selected detail panel

Org node types:

- `org`
- `leadership`
- `team`
- `agent`
- `tool`
- `workflowStep`
- `artifact`

Agent states:

- `idle`
- `queued`
- `running`
- `done`
- `failed`

Version states:

- `draft`
- `approved`
- `main`
- `archived`

## Mock UX Flow To Implement

### Flow 1: Generate Org

1. User enters prompt.
2. App navigates to workspace.
3. Chat messages stream on left:
   - `I am decomposing the task...`
   - `Creating a research team...`
   - `Adding writer and analyst...`
   - `Defining workflow handoffs...`
4. Canvas streams:
   - org identity
   - CEO/planner
   - teams
   - agents
   - tools
   - workflow steps
   - edges
5. Org finishes as version `v1` in `draft`.
6. User can click `Request Changes` or `Approve Org`.

### Flow 2: Approve And Run

1. User clicks `Approve Org`.
2. Version state becomes `approved`.
3. Run tab unlocks.
4. User clicks `Run Task`.
5. Run stream starts.
6. Agents animate:
   - queued pulse
   - running glow
   - done checkmark
7. Task particles/cards move across edges.
8. Final output appears in Run tab.

### Flow 3: Inspect Traces

After or during a run:

- Hover agent: compact popover with input, trace summary, output.
- Click agent: detail panel with full trace.
- Hover edge: handoff payload summary.
- Click tool badge: tool call detail.
- Click workflow step: filtered timeline.
- Each detail panel has `Add Feedback`.

### Flow 4: Feedback And New Version

1. User adds feedback to writer or output:
   - `The email hooks are too generic. Use funding events.`
2. Chat streams:
   - `Updating writer instructions...`
   - `Adding stricter research requirements...`
3. Canvas creates `Org v2`.
4. Version selector shows `v1`, `v2`.
5. User approves/runs `v2`.
6. User clicks `Set Main` on the better version.

## Mock Data Shape

Keep mock data behind stable contracts so the real backend can replace it later.

### OrgSpec

```ts
type OrgStatus = "draft" | "approved" | "main" | "archived";
type AgentStatus = "idle" | "queued" | "running" | "done" | "failed";

interface OrgSpec {
  id: string;
  name: string;
  mission: string;
  task: string;
  version: number;
  status: OrgStatus;
  leadership: LeadershipNode[];
  teams: TeamSpec[];
  agents: AgentSpec[];
  tools: ToolSpec[];
  workflow: WorkflowStep[];
  edges: OrgEdge[];
}
```

### Canvas Events

```ts
type CanvasEvent =
  | { type: "chat_delta"; message: string }
  | { type: "org_identity"; orgId: string; name: string; mission: string }
  | { type: "leadership_created"; node: LeadershipNode }
  | { type: "team_created"; team: TeamSpec }
  | { type: "agent_created"; agent: AgentSpec }
  | { type: "tool_assigned"; agentId: string; tool: ToolSpec }
  | { type: "workflow_step_created"; step: WorkflowStep }
  | { type: "edge_created"; edge: OrgEdge }
  | { type: "org_complete"; orgId: string; version: number };
```

### Trace Events

```ts
type TraceEvent =
  | { type: "run_started"; runId: string; orgId: string; version: number; timestamp: string }
  | { type: "step_started"; runId: string; stepId: string; timestamp: string }
  | { type: "agent_queued"; runId: string; agentId: string; timestamp: string }
  | { type: "agent_started"; runId: string; agentId: string; timestamp: string }
  | { type: "agent_input"; runId: string; agentId: string; input: unknown; timestamp: string }
  | { type: "tool_call_started"; runId: string; agentId: string; toolId: string; summary: string; timestamp: string }
  | { type: "tool_call_completed"; runId: string; agentId: string; toolId: string; resultSummary: string; timestamp: string }
  | { type: "agent_output"; runId: string; agentId: string; output: unknown; timestamp: string }
  | { type: "handoff"; runId: string; from: string; to: string; payloadSummary: string; timestamp: string }
  | { type: "agent_completed"; runId: string; agentId: string; timestamp: string }
  | { type: "run_completed"; runId: string; finalOutput: unknown; timestamp: string };
```

## Mock API Routes

Implement as mock API routes or local async generators:

- `POST /api/mock/orgs/generate`
  - streams or simulates `CanvasEvent`s.
- `POST /api/mock/orgs/:orgId/approve`
  - returns approved version.
- `POST /api/mock/orgs/:orgId/versions/:version/main`
  - marks selected version main.
- `POST /api/mock/orgs/:orgId/run`
  - starts a mock run.
- `GET /api/mock/runs/:runId/stream`
  - streams `TraceEvent`s.
- `GET /api/mock/runs/:runId`
  - returns full run and trace.
- `POST /api/mock/feedback`
  - creates feedback and returns generated `v2` mock stream.
- `GET /api/mock/orgs/:orgId/history`
  - returns versions, runs, and feedback.

## Suggested Component Structure

```text
src/
  app/
    page.tsx
    workspace/[orgId]/page.tsx
    api/mock/...
  components/ui/
    shadcn components
  features/
    landing/
      LandingPrompt.tsx
      ExamplePrompts.tsx
    workspace/
      WorkspaceShell.tsx
      WorkspaceTopBar.tsx
      WorkspaceTabs.tsx
      workspace-store.ts
      event-reducer.ts
      types.ts
    chat/
      AgentChatPanel.tsx
      ChatMessage.tsx
    canvas/
      OrgCanvas.tsx
      OrgNode.tsx
      TeamGroup.tsx
      AgentNode.tsx
      ToolBadge.tsx
      HandoffEdge.tsx
      WorkflowRail.tsx
      DetailPanel.tsx
    run/
      RunTab.tsx
      FinalOutputPanel.tsx
      RunControls.tsx
    traces/
      TracesTab.tsx
      TraceTimeline.tsx
      TracePopover.tsx
      TraceReplayControls.tsx
    feedback/
      FeedbackComposer.tsx
      FeedbackTargetBadge.tsx
    history/
      AgentHistoryTab.tsx
      VersionSelector.tsx
  lib/
    mock-api/
    fixtures/
```

## shadcn Components To Use

- `button`
- `textarea`
- `card`
- `badge`
- `tabs`
- `scroll-area`
- `popover`
- `sheet`
- `dialog`
- `tooltip`
- `separator`
- `dropdown-menu`
- `command`
- `progress`
- `skeleton`

## Visual Direction

- Dark technical workspace.
- Minimal landing page.
- Canvas should feel alive, not like a static admin dashboard.
- Use subtle glows, animated borders, particles/task cards, and status colors.
- Keep raw logs out of the main chat; logs belong in trace details.
- Make the org feel like a company/team with leadership and teams, not just a graph.

## Build Order

1. Create Next.js app with shadcn and Tailwind.
2. Build landing page.
3. Build workspace shell.
4. Define TypeScript contracts and fixtures.
5. Build event reducer.
6. Build design canvas from fixtures.
7. Add mock streaming org generation.
8. Add approve/run controls.
9. Add mock trace stream and animation.
10. Add trace hover/click details.
11. Add feedback composer.
12. Add version generation and `Set Main`.
13. Add tests for reducers and key components.

## Done For First Frontend Prototype

- Full mock UX flow works without real APIs.
- Canvas is visually polished enough to demo.
- All tabs are functional.
- Trace details are inspectable.
- Feedback creates a new version.
- One version can be marked main.
- Mock API contracts match the planned real backend contracts.
