# Phased Implementation Plan

## Planning Principle

Phase 1 is the product. The first milestone is not “integrate every tool”; it is a fully working UI and agent-builder loop where a user can describe a task, watch an org get designed on a canvas, approve it, run it, inspect traces, give feedback, generate versions, rerun, and keep one version as the main org.

Later phases add deeper runtime power:

- Phase 2 adds Ghost and TinyFish as real tool-backed capabilities.
- Phase 3 replaces simulated/local org agents with Guild AI agents.
- Phase 4 frames and proves the Chainguard story for secure agent specs and dependencies.

## Current Repo State

The repository includes a Next.js app in `frontend/` (workspace UI), Zod contracts in `frontend/src/lib/contracts/`, and an initial `POST /api/orgs/generate` SSE route. InsForge persistence is wired but optional until env vars and SQL migrations are applied; Mastra-backed generation and the rest of the Phase 1 API surface are still in progress (see `docs/handoff/phase_1_integration_handoff.md`).

Relevant docs:

- `docs/ai_orgs_spec_v2.md` - product vision and architecture.
- `docs/ai_orgs_ui_ux_spec.md` - single-workspace UX and mock API spec.
- `docs/tools.md` - integration source list.
- `docs/guides/main-agent-and-streaming.md` - Mastra and streaming direction.
- `docs/guides/insforge.md` - InsForge setup and project link.
- `docs/guides/external-tools.md` - Ghost, TinyFish, Chainguard, Guild notes.
- `docs/guides/tool-smoke-tests.md` - credentials and smoke-test matrix.

## Stack Decision For Phase 1

- Frontend and backend app: Next.js + TypeScript.
- Main agent framework: Mastra.
- Main model: OpenAI `gpt-5.4-mini`, verified before use.
- Backend platform: InsForge.
- Realtime path: app server SSE first, persisted to InsForge; InsForge realtime can be added where replay or multi-client updates need it.
- Org runtime in Phase 1: Mastra/app-server runtime with mocked or model-generated agent outputs, not Guild yet.

## Phase 1: Core UI, Agent Builder, Runs, Traces, Feedback, Versions

### Goal

Build the end-to-end AgentOrg product loop with a polished canvas UI, Mastra main agent, OpenAI model calls, and InsForge persistence.

The user should be able to:

1. Start from a ChatGPT-style landing prompt.
2. Enter a task.
3. Watch the agent chat stream on the left.
4. Watch the org design stream into the canvas on the right.
5. Approve or request changes to the org.
6. Run the task through the org.
7. See a beautiful live trace visualization.
8. Hover/click org nodes, teams, tools, edges, and tasks to inspect what happened.
9. Add targeted feedback.
10. Generate a new org version.
11. Run the version again.
12. Keep one version as the main org.

### Phase 1A: Product Contracts Before Coding

#### Purpose

Define the contracts that let frontend and backend be built together without reworking the canvas every time the runtime changes.

#### Deliverables

- `OrgSpec` schema.
- `OrgVersion` schema.
- `RunSpec` schema.
- `TraceEvent` schema.
- `FeedbackTarget` schema.
- `CanvasEvent` stream schema.
- API route contract.
- UI state contract.

#### Org Design Contract

The main agent can create:

- An org/company identity:
  - org name
  - mission
  - task
  - version
  - status: `draft`, `approved`, `main`, `archived`
- Leadership nodes:
  - CEO/planner/coordinator
  - optional manager/team leads
- Teams:
  - research team
  - analysis team
  - writing/output team
  - verifier/reviewer team
  - custom teams created from task needs
- Agents:
  - id
  - name
  - role
  - team id
  - system prompt
  - tools
  - memory scope
  - input contract
  - output contract
  - depends on
- Tools:
  - id
  - name
  - provider
  - capability
  - auth requirement
  - phase availability
- Workflow:
  - ordered steps
  - parallel groups
  - handoffs
  - required outputs
  - final output owner

#### Canvas Event Contract

The backend should stream normalized events, not raw model output:

```json
{ "type": "chat_delta", "message": "Creating a research team..." }
{ "type": "org_identity", "orgId": "org_123", "name": "Growth Research Org" }
{ "type": "team_created", "team": { "id": "team_research", "name": "Research Team" } }
{ "type": "agent_created", "agent": { "id": "agent_researcher", "teamId": "team_research", "name": "Researcher" } }
{ "type": "tool_assigned", "agentId": "agent_researcher", "tool": { "id": "web_search", "name": "Web Search" } }
{ "type": "workflow_step_created", "step": { "id": "step_research", "label": "Research targets" } }
{ "type": "edge_created", "from": "agent_researcher", "to": "agent_writer", "label": "research brief" }
{ "type": "org_complete", "orgId": "org_123", "version": 1 }
```

#### Run And Trace Contract

Runs should be trace-first. Every visual animation should come from a persisted event:

```json
{ "type": "run_started", "runId": "run_123", "orgId": "org_123", "version": 1 }
{ "type": "step_started", "stepId": "step_research" }
{ "type": "agent_queued", "agentId": "agent_researcher" }
{ "type": "agent_started", "agentId": "agent_researcher" }
{ "type": "agent_input", "agentId": "agent_researcher", "input": { "target": "Acme AI" } }
{ "type": "tool_call_started", "agentId": "agent_researcher", "toolId": "web_search", "summary": "Search funding data" }
{ "type": "tool_call_completed", "agentId": "agent_researcher", "toolId": "web_search", "resultSummary": "Found Series A funding article" }
{ "type": "agent_output", "agentId": "agent_researcher", "output": { "funding": "$12M Series A" } }
{ "type": "handoff", "from": "agent_researcher", "to": "agent_writer", "payloadSummary": "Research brief" }
{ "type": "agent_completed", "agentId": "agent_researcher" }
{ "type": "run_completed", "runId": "run_123", "finalOutput": {} }
```

#### Feedback Contract

Feedback can target:

- full org
- org version
- run
- final output
- team
- agent
- workflow step
- tool call
- handoff edge
- trace event

Example:

```json
{
  "targetType": "agent",
  "targetId": "agent_writer",
  "runId": "run_123",
  "orgVersion": 1,
  "message": "The hook is too generic. Use a specific funding event."
}
```

#### API Contract

Phase 1 routes:

- `POST /api/orgs/generate`
  - streams chat and org design events
- `POST /api/orgs/:orgId/approve`
  - marks a version approved
- `POST /api/orgs/:orgId/versions/:version/main`
  - marks one version as main
- `POST /api/orgs/:orgId/run`
  - starts a run
- `GET /api/runs/:runId/stream`
  - streams run and trace events
- `GET /api/runs/:runId`
  - returns run, trace events, final output, feedback
- `POST /api/feedback`
  - attaches feedback and can trigger version generation
- `GET /api/orgs/:orgId/history`
  - returns versions, runs, feedback, and agent history summaries

#### Done When

- Contracts are written in docs and represented as TypeScript types.
- Frontend can be built from fixtures before backend is complete.
- Backend can stream events without knowing canvas implementation details.

### Phase 1B: Frontend Shell And Canvas Design

#### Purpose

Build the polished UI shell that makes the product feel real before every integration is live.

#### UI Structure

- Landing prompt:
  - one large task input
  - example prompts
  - `Create Org`
- Workspace:
  - left chat stream
  - right canvas
  - top bar with org name, current version, `New Org`, `Set Main`
  - canvas tabs: `Design`, `Run`, `Traces`, `Agent History`

#### Canvas Design Requirements

The canvas must render:

- company/org identity at the top
- CEO/planner node
- teams as grouped regions
- agents inside teams
- tool badges on agents
- memory/resource scope badges
- workflow steps
- handoff edges
- live statuses
- selected detail panel

#### Visual Behavior

- During org generation, nodes stream in one by one.
- Teams appear before their agents.
- Edges draw after both endpoints exist.
- Tool badges appear as assignments stream.
- During run, work moves through the org as animated particles or task cards.
- Completed agents remain inspectable after the run.
- Hovering an agent shows compact input/trace/output preview.
- Clicking an agent opens full details.

#### Done When

- UI works from mocked `CanvasEvent` fixtures.
- User can see a complete org form in the canvas.
- User can switch between tabs without losing state.
- User can select agents, teams, tools, edges, and workflow steps.

#### Tests

- Component tests for landing, workspace shell, canvas node, team group, detail panel, tabs.
- Reducer tests for canvas events.
- User validation checkpoint for visual quality of the canvas.

### Phase 1C: Mastra Main Agent And Streaming

#### Purpose

Connect the landing prompt to a real main agent that generates org designs and streams events to the frontend.

#### Responsibilities

- Use Mastra with OpenAI `gpt-5.4-mini`.
- Verify model access before implementation relies on it.
- Generate valid org specs.
- Stream chat deltas and canvas events.
- Support user-requested changes before approval.
- Keep Guild out of Phase 1 runtime.

#### Done When

- A real task produces a streamed org design.
- Invalid agent output is rejected or repaired server-side before it reaches the canvas.
- The UI never blocks waiting for the full final JSON before rendering.

#### Tests

- Contract tests for model output parsing.
- SSE streaming test.
- One opt-in real OpenAI smoke test.

### Phase 1D: InsForge Persistence

#### Purpose

Persist every important artifact in InsForge so runs and traces can be replayed.

#### Data To Persist

- orgs
- org versions
- approved/main version status
- runs
- trace events
- feedback
- final outputs
- agent history summaries

#### Current Link Command

```powershell
npx @insforge/cli link --project-id f0292312-e52c-4f71-9ec2-78768a630740
```

#### Done When

- InsForge CLI is linked.
- Migrations create the Phase 1 tables.
- Org generation writes org/version data.
- Run writes trace events append-only.
- Feedback writes to the correct target.
- Main version can be set and retrieved.

#### Tests

- Migration smoke test.
- Repository tests for create/read orgs, versions, runs, traces, feedback.
- API tests against a test InsForge project.

### Phase 1E: Run Runtime And Fancy Trace UI

#### Purpose

Make run execution and trace visualization feel like the core magic of the product.

#### Runtime Behavior

For Phase 1, org agents can be simulated or Mastra-driven local agents. They should still emit real trace events through the same contract later used by Ghost/TinyFish/Guild.

Run flow:

1. User clicks `Run Task`.
2. Run starts for selected org version.
3. Workflow step highlights.
4. Agents queue and run.
5. Task cards or particles move through edges.
6. Inputs, tool calls, outputs, and handoffs are persisted.
7. Final output appears in the `Run` tab.
8. `Traces` tab can replay the run.

#### Trace UI Requirements

The trace UI should support:

- live mode during execution
- replay mode after completion
- hover agent: input, trace summary, output
- click agent: full detail panel
- hover edge: payload/handoff summary
- click tool badge: tool call list
- click workflow step: all events in that step
- feedback button at every inspectable level

#### Done When

- A run can complete end to end.
- The trace is visually understandable without reading raw logs.
- Every animation can be traced back to persisted events.
- User can inspect what each agent received, did, and produced.

#### Tests

- Runtime state-machine tests.
- Trace event replay tests.
- Component tests for hover/click detail states.
- User validation checkpoint for whether the trace UI feels “fancy” and understandable.

### Phase 1F: Feedback, Versioning, And Main Org Selection

#### Purpose

Close the loop from run inspection to improved org.

#### Behavior

- User adds feedback from:
  - final output
  - agent detail panel
  - tool call
  - handoff edge
  - workflow step
  - full run
- Main agent receives:
  - current org version
  - relevant trace evidence
  - feedback
  - final output
- Main agent streams an updated org version.
- User approves or asks for changes.
- User runs the new version.
- User can mark a version as main.

#### Version States

- `draft`: generated but not approved
- `approved`: can be run
- `main`: selected best/current org
- `archived`: kept for history but not active

#### Done When

- Feedback creates version 2.
- Versions are visible in the workspace.
- Runs are associated with versions.
- User can compare enough through history and traces to choose a main version.
- `Set Main` persists to InsForge.

#### Tests

- Feedback target validation tests.
- Version state transition tests.
- End-to-end test: generate v1, run, feedback, generate v2, run, set v2 main.

### Phase 1 Acceptance Criteria

- The app can be demoed without Ghost, TinyFish, Guild, or Chainguard.
- The UI feels like the intended product, not a backend admin tool.
- A user can complete the full loop: task → org → approve → run → trace → feedback → new version → run → set main.
- InsForge persists the full loop.
- Mastra and OpenAI drive org generation.
- Trace events are the shared source of truth for live animation and replay.
- API contracts are stable enough for Phase 2 tools to plug in without redesigning the canvas.

## Phase 2: Add Ghost And TinyFish

### Goal

Make org agents genuinely useful by giving them external web automation and isolated database workspaces.

### Ghost

Use Ghost for ephemeral agent databases:

- per-agent private DBs
- team DBs
- org-level shared DBs
- forks for experiments
- disposable DBs for test runs

Setup path:

```powershell
ghost login
ghost api-key create --name "agentorg-dev" --env
```

Store:

```text
GHOST_API_KEY=<generated key>
```

### TinyFish

Use TinyFish for browser automation and web extraction:

- research agents
- competitor analysis
- scraping structured public data
- web verification steps

Store:

```text
TINYFISH_API_KEY=<key>
```

### Phase 2 Integration Work

- Add server-side `ghost` adapter.
- Add server-side `tinyfish` adapter.
- Add tool capability declarations to org schema.
- Add real tool call trace events.
- Show TinyFish browser calls in the trace UI.
- Show Ghost DB create/fork/query events in the trace UI.
- Add cleanup rules for disposable Ghost DBs.

### Phase 2 Acceptance Criteria

- An agent can use TinyFish during a run.
- An agent can create/fork/use a Ghost DB during a run.
- Tool calls appear in traces.
- Tool outputs feed downstream agents.
- Failures are visible in the same trace UI.
- No API keys are exposed to frontend code.

## Phase 3: Replace Org Agents With Guild AI Agents

### Goal

Move from local/simulated org agents to Guild-managed agents where it improves versioning, governance, hosted sessions, credentials, or observability.

### Scope

- Keep Mastra as the main org-builder unless we intentionally change that later.
- Replace execution agents behind the runtime adapter with Guild agents.
- Preserve the existing canvas, API contracts, trace contracts, and InsForge persistence.

### Work

- Install/authenticate Guild CLI.
- Build one Guild agent from an AgentOrg agent spec.
- Map AgentOrg agent fields to Guild agent configuration.
- Start Guild sessions from AgentOrg runs.
- Convert Guild events/logs into AgentOrg `TraceEvent`s.
- Persist Guild session IDs on run/agent trace records.

### Acceptance Criteria

- At least one org agent runs as a Guild agent.
- Guild output appears in the existing trace UI.
- The user cannot tell from the canvas whether an agent was local or Guild-managed except through optional metadata.
- Guild can be rolled back without changing frontend components.

## Phase 4: Chainguard Libraries Story For Agent Specs

### Goal

Create the hackathon/security story that AgentOrg produces safer agent specs and uses Chainguard for hardened dependencies.

### Story

AgentOrg does not just generate prompts. It generates inspectable agent specs with explicit tools, dependencies, resources, and runtime requirements. Chainguard strengthens that story by making agent dependency choices safer and auditable.

### Work

- Use Chainguard public container images for Node/Python runtime examples where relevant.
- Set up free Chainguard Libraries account/org and pull token for package registry access.
- Document how an agent spec declares package requirements.
- Add a dependency/security section to generated org specs.
- Show “secured by Chainguard Libraries” metadata in the org/tool details panel.
- Create one demo agent spec that uses Chainguard-backed package installation.

### Acceptance Criteria

- We can explain why Chainguard matters in the demo.
- At least one agent spec includes explicit dependency/runtime metadata.
- Docs show the exact setup path for free individual developer access.
- The UI can display dependency/security metadata without cluttering the main canvas.

## Overall Build Order

1. Phase 1A: contracts.
2. Phase 1B: frontend shell and canvas from fixtures.
3. Phase 1C: Mastra streaming org builder.
4. Phase 1D: InsForge persistence.
5. Phase 1E: run runtime and fancy traces.
6. Phase 1F: feedback, versions, set main.
7. Phase 2: Ghost and TinyFish.
8. Phase 3: Guild execution agents.
9. Phase 4: Chainguard story.

## Immediate Next Step

Before coding, finish Phase 1A by creating TypeScript-level contracts for:

- `OrgSpec`
- `OrgVersion`
- `CanvasEvent`
- `Run`
- `TraceEvent`
- `Feedback`
- API request/response and SSE event payloads

Then build the frontend against fixtures generated from those contracts.
# Integration Implementation Plan

## Current Code Review

Documentation remains the source of truth for product intent; the runnable app lives in `frontend/`. The active product docs are:

- `docs/ai_orgs_spec_v2.md`: product vision, architecture, MVP scope, and demo script.
- `docs/ai_orgs_ui_ux_spec.md`: single workspace UI/UX and mock API contract.
- `docs/tools.md`: source list for InsForge, Mastra/Guild, Chainguard, Ghost, and TinyFish.
- `references/`: cloned upstream repos for InsForge, InsForge skills, Chainguard setup, and TinyFish skills.

The app composition root is `frontend/` (Next.js). Automated tests for contracts and APIs are not yet wired. The plan below still defines stable modules as additional routes and Mastra integration land.

## Implementation Boundary

This effort should build the UI-first product loop before deeply integrating every external tool.

Changes included:

- Create the app shell and single workspace UI.
- Build the main agent and event-stream contract.
- Persist orgs, versions, runs, traces, and feedback in InsForge.
- Add targeted integrations for OpenAI, TinyFish, Ghost, and optional Chainguard/Guild support.
- Add smoke tests for each external dependency before relying on it.

Changes preserved:

- The product remains a single-screen workspace after the landing prompt.
- The org schema remains the core artifact.
- External tools are invoked through server-side adapters, never directly from canvas components.

Deferred:

- Full production auth and billing.
- Full side-by-side org comparison screen.
- Guild as the primary runtime unless we explicitly choose it after UI and schema contracts stabilize.
- Chainguard Libraries unless we introduce a build pipeline that benefits from it.

Assumed but pending:

- App framework. Recommended default is Next.js with TypeScript because it can host the landing page, workspace UI, server routes, and SSE endpoints in one project.
- Main agent framework. Decision for MVP: Mastra with OpenAI `gpt-5.4-mini`, verified after install. Guild is deferred as an optional later execution/governance layer.
- InsForge project. Either create a trial through the agent signup flow or link an existing project.
- Local `.env` may contain `OPENAI_API_KEY` and `TINYFISH_API_KEY`; implementation should load and validate presence without printing values.
- Ghost should be integrated through CLI/API key setup, not through a frontend flow.

## Module Implementation Plan

### Module 1: App Composition Root

#### Purpose

Create the base application structure that owns routing, environment loading, and the single product shell.

#### Responsibilities

- Choose and initialize the app framework.
- Define landing route and workspace route.
- Add environment variable validation.
- Add basic styling foundation and layout primitives.
- Keep framework concerns out of agent/tool adapters.

#### Primary Files

- `package.json`
- `src/app/*` or equivalent app routes.
- `src/config/env.ts`
- `src/styles/*`

#### Depends On

- Framework decision.

#### Done When

- App starts locally.
- Landing page renders.
- Workspace shell renders with left chat panel and right canvas panel.
- Missing required server env vars fail loudly on server startup or route execution.

#### Test Requirements

- Unit test env parsing.
- Component test landing prompt and workspace shell.
- User validation checkpoint for layout proportions and first impression.

### Module 2: Workspace UI State Model

#### Purpose

Own client-side state for the single workspace without coupling UI components to raw backend events.

#### Responsibilities

- Represent current org, selected version, selected tab, selected node, active run, and event stream status.
- Normalize incoming stream events into view models.
- Support switching between `Design`, `Run`, `Traces`, and `Agent History`.
- Keep placeholder/mock data behind the same interface used by real streams.

#### Primary Files

- `src/features/workspace/workspace-store.ts`
- `src/features/workspace/types.ts`
- `src/features/workspace/event-reducer.ts`

#### Depends On

- Module 1.

#### Done When

- Mock event fixtures can build an org incrementally.
- Tab switching preserves selected org/run context.
- Components do not parse raw SSE strings.

#### Test Requirements

- Unit tests for event reducer.
- Component test for tab state and selected agent state.
- User validation checkpoint for tab naming and workflow clarity.

### Module 3: Canvas Design Surface

#### Purpose

Render streamed org design as the central visual artifact.

#### Responsibilities

- Render teams, agents, edges, status badges, resource scopes, and approval controls.
- Animate streamed node/edge creation.
- Show approval state and request-changes path.
- Expose selected node/team/edge details to the workspace state model.

#### Primary Files

- `src/features/canvas/OrgCanvas.tsx`
- `src/features/canvas/AgentNode.tsx`
- `src/features/canvas/TeamGroup.tsx`
- `src/features/canvas/CanvasDetailsPanel.tsx`

#### Depends On

- Module 2.

#### Done When

- A hardcoded event stream builds a visible org.
- `Approve Org` changes version state and enables run-related tabs.
- Selecting an agent shows details without leaving the workspace.

#### Test Requirements

- Component tests for node, team, edge, and details panel rendering.
- Integration test from mock events to rendered org.
- User validation checkpoint for canvas readability and animation pacing.

### Module 4: Main Agent Streaming Adapter

#### Purpose

Provide the server boundary between frontend SSE and the main agent that generates org designs and iterations.

#### Responsibilities

- Accept a user task or feedback request.
- Call the Mastra agent using OpenAI `gpt-5.4-mini` after model verification.
- Emit normalized stream events.
- Persist generated org versions to InsForge.
- Keep model/provider details out of frontend code.

#### Primary Files

- `src/server/agents/main-agent.ts`
- `src/server/streaming/event-stream.ts`
- `src/server/routes/org-generate.ts`
- `src/server/routes/org-feedback.ts`

#### Depends On

- Module 1.
- Module 2 event contract.
- `OPENAI_API_KEY`.
- Mastra install and provider verification.

#### Done When

- One endpoint streams chat deltas and org events from a real model.
- Frontend can build the design canvas from the stream.
- Generated schema is persisted as `org_versions`.
- Guild is not required for the MVP main-agent flow.

#### Test Requirements

- Unit tests for stream event serialization.
- Contract test for event payload schemas.
- Integration smoke test with real OpenAI key behind an opt-in flag.

### Module 5: InsForge Persistence Adapter

#### Purpose

Own all durable data access for orgs, versions, runs, trace events, feedback, and artifacts.

#### Responsibilities

- Link project using `npx @insforge/cli`.
- Create migrations for initial tables.
- Provide typed repository functions for app/server modules.
- Store run and trace events append-only.
- Keep admin keys server-only.

#### Primary Files

- `src/server/insforge/client.ts`
- `src/server/insforge/repositories/*`
- `insforge/migrations/*` or project migration location.
- `.env.example`

#### Depends On

- InsForge project or trial.
- Module 4 persistence needs.

#### Done When

- `npx @insforge/cli metadata --json` works.
- App can create an org, create a version, create a run, append trace events, and attach feedback.
- `.env.example` documents required variables without secrets.

#### Test Requirements

- Unit tests for repository payload validation.
- Integration test against a test InsForge project.
- Migration smoke test in a disposable project.

### Module 6: Run And Trace Runtime Adapter

#### Purpose

Execute approved org versions through a runtime interface and produce traceable events.

#### Responsibilities

- Start a run for an approved org version.
- Emit agent status, input, trace, output, handoff, and final output events.
- Support a mock runtime first, then real tool-backed agents.
- Persist events through the InsForge adapter.

#### Primary Files

- `src/server/runtime/run-org.ts`
- `src/server/runtime/runtime-adapter.ts`
- `src/server/runtime/mock-runtime.ts`
- `src/server/routes/run-start.ts`
- `src/server/routes/run-stream.ts`

#### Depends On

- Module 4 event streaming.
- Module 5 persistence.

#### Done When

- Approved org can run with mock agent outputs.
- Run tab streams live status.
- Traces tab can replay the same events after completion.

#### Test Requirements

- Unit tests for runtime state transitions.
- Integration test for run start to run complete.
- User validation checkpoint for trace hover/click usefulness.

### Module 7: Feedback And Iteration Adapter

#### Purpose

Turn targeted user feedback into the next org version.

#### Responsibilities

- Attach feedback to output, org, agent, edge, workflow step, or trace event.
- Call the main agent with current schema, run summary, trace evidence, and feedback.
- Stream updated org design into the design tab.
- Preserve version history.

#### Primary Files

- `src/features/feedback/*`
- `src/server/agents/iteration-agent.ts`
- `src/server/routes/feedback.ts`

#### Depends On

- Module 4.
- Module 5.
- Module 6.

#### Done When

- Feedback from an agent detail panel creates version 2.
- Version selector shows both versions.
- Agent history reflects behavior changes across runs.

#### Test Requirements

- Unit tests for feedback target validation.
- Integration test for feedback to new version creation.
- User validation checkpoint for whether feedback entry points feel obvious.

### Module 8: External Tool Adapters

#### Purpose

Add TinyFish, Ghost, Chainguard, and optional Guild behind stable server-side interfaces.

#### Responsibilities

- TinyFish adapter for web automation calls.
- Ghost adapter for ephemeral DB create, fork, connect, and cleanup using CLI-generated `GHOST_API_KEY`.
- Chainguard build/runtime documentation and optional container support.
- Guild proof-of-concept only if selected later as execution governance layer.
- Record every external tool call as trace events.

#### Primary Files

- `src/server/tools/tinyfish.ts`
- `src/server/tools/ghost.ts`
- `src/server/tools/chainguard.md` or build config.
- `src/server/tools/guild.ts` if needed.

#### Depends On

- Module 6 runtime adapter.
- Tool credentials.
- Ghost CLI login and `ghost api-key create --env` for non-interactive Ghost tests.

#### Done When

- TinyFish can run one extraction and persist trace result.
- Ghost can generate an API key via CLI and create/delete a disposable DB in a controlled smoke test.
- Chainguard path is documented or containerized build exists. Chainguard Libraries are free for individual developers but are only used after free account/org and pull token setup.
- Guild remains deferred unless we explicitly promote it into the execution layer.

#### Test Requirements

- Opt-in integration tests for each credentialed service.
- Unit tests for adapter request/response normalization.
- No paid or destructive test runs by default.

## Module Order

1. App Composition Root.
2. Workspace UI State Model.
3. Canvas Design Surface.
4. Main Agent Streaming Adapter.
5. InsForge Persistence Adapter.
6. Run And Trace Runtime Adapter.
7. Feedback And Iteration Adapter.
8. External Tool Adapters.

Modules 2 and 3 can use mock events while Modules 4 and 5 are being built. Module 8 should wait until the trace contract is stable so every tool call has a consistent place in the UI.

## Acceptance Criteria

- User can start from a landing prompt and enter one task.
- Chat streams on the left while the canvas builds Org v1 on the right.
- User can approve the org.
- User can run the task through the org.
- Run tab shows final output.
- Traces tab shows task movement through the org.
- Hovering or clicking an agent shows input, trace, output, and feedback.
- User can add feedback and generate Org v2.
- InsForge persists orgs, versions, runs, trace events, and feedback.
- OpenAI model access is verified before production use.
- Tool integrations have documented credentials and smoke tests.
- No secret values are committed.
