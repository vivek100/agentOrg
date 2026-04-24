# AI Orgs — UI/UX Design & Mock API Specification

---

## Design Philosophy

**Simple first:** The product should feel like starting a ChatGPT conversation, not configuring infrastructure. The user only needs to say what task they want done. Everything else unfolds in the workspace.

**One persistent workspace:** After the landing prompt, the app moves into a single canvas mode. The left side is the agent chat stream. The right side is the canvas where the org is designed, approved, run, inspected, and iterated.

**Aesthetic direction:** Clean, focused, and alive. Keep the chrome minimal so the org, task flow, traces, and feedback moments are the main experience.

---

## Product Flow Overview

```
[ 1. Landing Prompt ]
           ↓
[ 2. Single Workspace ]
           ↓
[ Chat streams on left while canvas builds Org v1 on right ]
           ↓
[ User approves org ]
           ↓
[ Same canvas switches between Run, Traces, and Agent History tabs ]
           ↓
[ User adds feedback at org, agent, trace, or output level ]
           ↓
[ System creates the next org iteration and reruns the test ]
```

---

## Landing Prompt

### Layout
ChatGPT-style landing page. Full-screen, centered, minimal. One large prompt box, one primary action, optional task examples.

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│          What should your AI org do?                   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Describe your task...                            │  │
│  │                                                  │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [ Create Org → ]                                      │
│                                                        │
│  Examples:                                             │
│  · Research 3 AI startups and write cold emails        │
│  · Analyze competitor pricing and summarize findings   │
│  · Scrape job postings and extract skills trends       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Interactions
- Typing activates the primary action and optional suggestions.
- Clicking an example fills the prompt box.
- `Create Org` transitions into the single workspace.
- `New Org` from the workspace returns to this same prompt state.

---

## Single Workspace

This is the core product surface. It is not a sequence of separate screens. The chat remains on the left while the canvas on the right changes modes.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ AI Orgs                                      [ New Org ] [ Org v1 ▼ ]    │
├──────────────────────────────┬───────────────────────────────────────────┤
│ Agent Chat                   │ Canvas                                    │
│                              │                                           │
│ User: Research 3 startups... │  Tabs: [ Design ] [ Run ] [ Traces ]      │
│                              │        [ Agent History ]                  │
│ Agent: I am designing...     │                                           │
│ Agent: Creating research...  │  Current canvas mode renders here.        │
│ Agent: Adding writer...      │                                           │
│                              │                                           │
│ ┌──────────────────────────┐ │                                           │
│ │ Ask for changes...       │ │                                           │
│ └──────────────────────────┘ │                                           │
└──────────────────────────────┴───────────────────────────────────────────┘
```

### Left Chat Panel
- Streams the agent's reasoning and status in plain language.
- Lets the user request changes before approval, such as "add a verifier" or "make this cheaper."
- After approval, becomes the place to start runs, ask follow-up questions, and request the next iteration.
- The chat should never feel like a log dump. Detailed logs belong in traces and agent history.

---

## Canvas Tab: Design

The design tab is shown immediately after the landing prompt. The org is streamed and built on the canvas as the chat explains what is being created.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Design                                                       │
│ Task: Research 3 AI startups and write cold outreach emails  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                 [ Planner ]                                  │
│                /           \                                 │
│       [ Research Team ]   [ Output Team ]                    │
│        /      |      \        /        \                      │
│     [ R-A ] [ R-B ] [ R-C ] [ Analyst ] [ Writer ]           │
│                                                              │
│  Building org... Defining Writer... Assigning tools...       │
│                                                              │
│  [ Request Changes ]                         [ Approve Org ] │
└──────────────────────────────────────────────────────────────┘
```

### Streaming Behavior
- Nodes appear as the org schema streams in.
- Edges draw after both connected nodes exist.
- The build status names the exact thing being created, such as "Adding Researcher B" or "Assigning browser tool."
- The org is not runnable until the user approves it.
- If the user asks for design changes, the canvas updates in place and keeps the current version history.

### Org Chart Node Design

Each agent node shows:
```
┌──────────────────────┐
│  🔵  Researcher A    │  ← status dot (color = state)
│  ─────────────────   │
│  🌐 tinyfish_browser │  ← tools
│  🗄  ghost_r1 (priv) │  ← DB scope badge
│  📁 /agents/r1       │  ← storage
│                      │
│  [ idle / running / done ] ← state chip
└──────────────────────┘
```

### Approval Behavior
- `Approve Org` freezes the current design as an approved org version.
- The canvas keeps the org visible and enables the `Run`, `Traces`, and `Agent History` tabs.
- The primary next action becomes `Run Task`.

### Team Grouping
Agents within a team are visually enclosed in a soft rounded rectangle (the "team boundary"). The team label floats above. Teams have their own shared resource badges.

```
  ╔═════════════════════════════╗
  ║  Research Team              ║
  ║  🗄 ghost_team_research      ║
  ║  🌐 tinyfish_search (shared) ║
  ║                             ║
  ║  [R-A]    [R-B]    [R-C]   ║
  ╚═════════════════════════════╝
```

### Resource Scope Visualization
Use color-coded badge rings on nodes:
- 🔴 Red ring = org-scope resource
- 🟡 Yellow ring = team-scope resource
- 🔵 Blue ring = private resource

---

## Canvas Tab: Run

The run tab is where the approved org executes the task and shows the final answer. It should still feel like one workspace, not a modal.

```
┌──────────────────────────────────────────────────────────────┐
│ Run                                                          │
│ Org v1 · Growth Research Team                 [ Run Task ]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Live org execution view                                     │
│  Agents light up as the task moves through the org.          │
│                                                              │
│  Final Output                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Appears here after completion.                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Feedback                                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ What went right or wrong?                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [ Create Next Iteration ]                                  │
└──────────────────────────────────────────────────────────────┘
```

### Run Behavior
- `Run Task` starts a new run against the approved org version.
- The canvas animates the task moving through teams and agents.
- Final output appears in the run tab when the run completes.
- The user can submit feedback against the final output, the full run, or a selected agent.
- `Create Next Iteration` generates the next org version from feedback and opens the design tab with the updated org streaming in.

---

## Canvas Tab: Traces

### Agent State Colors
- `idle`: gray, dimmed, no animation.
- `queued`: amber, soft pulse.
- `running`: electric blue, bright glow, animated border.
- `done`: green, checkmark badge.
- `failed`: red, error badge and shake once on transition.

### Data Flow Animations
When one agent completes and passes data to the next:
- An animated particle/dot travels along the edge connecting the two nodes
- The receiving agent transitions from `queued` → `running` as the particle arrives
- Multiple parallel agents can have simultaneous particles flowing

### Workflow Step Bar (Bottom)
The step bar at the bottom highlights the active step. Completed steps show a checkmark. The active step pulses.

```
  ✓ Decompose  →  ◉ Research (running 2/3)  →  ○ Synthesize  →  ○ Write
```

### Trace Inspection
The traces tab shows the org as the central object and overlays task movement through it. During and after a run, users can hover or click any agent, edge, team, or workflow step to inspect what happened there.

After a run, hovering an agent should reveal:
- Input received by that agent.
- Trace of tool calls, messages, and intermediate decisions.
- Output produced by that agent.
- Feedback attached to that agent or trace segment.

Clicking opens a persistent detail panel:

```
┌────────────────────────────┐
│  Researcher A              │
│  Status: Running           │
│  Started: 10:23:41         │
│                            │
│  Tools used:               │
│  · tinyfish_browser        │
│    └ 3 steps ($0.045)      │
│                            │
│  Input:                    │
│  "Find funding data for    │
│   Acme AI..."              │
│                            │
│  Trace:                    │
│  · searched web            │
│  · opened source           │
│  · extracted funding       │
│                            │
│  Output:                   │
│  ┌──────────────────────┐  │
│  │ startup: Acme AI     │  │
│  │ funding: $12M Ser... │  │
│  └──────────────────────┘  │
│                            │
│  Feedback:                 │
│  ┌──────────────────────┐  │
│  │ Missed LinkedIn data │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

---

## Canvas Tab: Agent History

Agent history is a timeline of every agent's behavior across runs and org versions. This helps the user see whether feedback improved the org.

```
┌────────────────────────────────────────────────────────┐
│ Agent History                                           │
├────────────────────────────────────────────────────────┤
│ Researcher A                                            │
│ v1 run: missed LinkedIn profile                         │
│ feedback: "always find LinkedIn when available"         │
│ v2 run: found LinkedIn and funding source               │
│                                                         │
│ Writer                                                  │
│ v1 run: generic opening                                 │
│ feedback: "open with a specific company event"          │
│ v2 run: stronger personalized hook                      │
└────────────────────────────────────────────────────────┘
```

### History Behavior
- Filter by agent, run, org version, or feedback item.
- Show the before/after behavior that resulted from feedback.
- Let users add feedback from a history item and create another org iteration.
- Keep full comparison lightweight for MVP. Version comparison can be represented as history plus run summaries instead of a separate screen.

---

## Navigation & Persistent UI Elements

### Top Navigation Bar
```
  AI Orgs   |   [Current Org Name]   [ Org v1 ▼ ]   [ New Org ]
```
- Version selector switches the canvas to a prior org version.
- `New Org` starts a new task from the landing prompt.
- Keep navigation sparse. The tabs inside the canvas carry the workflow.

### Canvas Tabs
```
[ Design ] [ Run ] [ Traces ] [ Agent History ]
```
- `Design`: streamed org creation, approval, and org iteration.
- `Run`: current run, final output, and run-level feedback.
- `Traces`: animated execution replay and per-agent trace inspection.
- `Agent History`: behavior across runs and versions.

---

## Interaction States Summary

- Agent node: hover shows input, trace summary, output, and feedback count; click opens detail panel.
- Team boundary: hover highlights all agents in the team; click opens team-level resources and feedback.
- Edge or connection: hover shows payload moving between agents; click opens handoff trace.
- Run button: disabled until org approval; loading state says `Running...`.
- Version selector: switches between org versions without leaving the workspace.
- Feedback control: available on final output, agent details, trace steps, and history items.

---

## Mock API Specification

These endpoints are what the frontend calls. Backend (InsForge) implements them. Start with these mocked so UI can be built independently.

---

### POST /api/orgs/generate
Generate a new org schema from a task and stream the design into the canvas.

**Request:**
```json
{
  "task": "Research 3 AI startups and write personalized outreach emails",
  "context": {}
}
```

**Response (streaming, SSE):**
```
event: chat_delta
data: { "message": "I am creating a research team and output team..." }

event: org_node
data: { "type": "agent", "id": "agent_researcher_1", "name": "Researcher A", "team": "team_research" }

event: org_node
data: { "type": "agent", "id": "agent_researcher_2", "name": "Researcher B", "team": "team_research" }

event: org_complete
data: { "org_id": "org_abc123", "version": 1, "schema": { ...full schema... } }
```

---

### POST /api/orgs/:orgId/approve
Approve the current org design so it can be run.

**Request:**
```json
{
  "org_id": "org_abc123",
  "version": 1
}
```

**Response:**
```json
{
  "org_id": "org_abc123",
  "version": 1,
  "status": "approved"
}
```

---

### POST /api/orgs/:orgId/run
Start a run of the org.

**Request:**
```json
{
  "org_id": "org_abc123",
  "version": 1
}
```

**Response:**
```json
{
  "run_id": "run_xyz789",
  "status": "started",
  "started_at": "2026-04-24T10:23:00Z"
}
```

---

### GET /api/runs/:runId/stream
SSE stream of execution events. Frontend subscribes to this to drive the animated org in the run and traces tabs.

**Events:**
```
event: agent_status
data: { "agent_id": "agent_researcher_1", "status": "running", "started_at": "..." }

event: agent_log
data: { "agent_id": "agent_researcher_1", "message": "Navigating to Acme AI website...", "tool": "tinyfish_browser" }

event: agent_input
data: { "agent_id": "agent_researcher_1", "input": { "target": "Acme AI", "required_fields": ["funding", "team_size"] } }

event: agent_output
data: { "agent_id": "agent_researcher_1", "output": { "startup_name": "Acme AI", "funding": "$12M" } }

event: agent_status
data: { "agent_id": "agent_researcher_1", "status": "done", "completed_at": "..." }

event: run_complete
data: { "run_id": "run_xyz789", "final_output": { ... }, "status": "success" }
```

---

### POST /api/orgs/:orgId/feedback
Submit feedback from the run, output, agent, trace segment, or history item to generate the next version.

**Request:**
```json
{
  "org_id": "org_abc123",
  "run_id": "run_xyz789",
  "target_type": "agent",
  "target_id": "agent_researcher_1",
  "feedback": "Emails are too generic. Researchers missed LinkedIn data. Writer needs a stronger opening hook.",
  "reviewer": "human"
}
```

**Response (streaming, SSE):**
```
event: diff_item
data: { "agent_id": "agent_researcher_1", "field": "system_prompt", "before": "...", "after": "..." }

event: diff_item
data: { "type": "tool_added", "agent_id": "agent_researcher_1", "tool": "linkedin_scraper" }

event: version_complete
data: { "org_id": "org_abc123", "version": 2, "schema": { ...updated schema... } }
```

---

### GET /api/orgs/:orgId/versions
List all versions of an org.

**Response:**
```json
{
  "org_id": "org_abc123",
  "versions": [
    {
      "version": 1,
      "created_at": "2026-04-24T10:00:00Z",
      "run_count": 1,
      "last_run_status": "success"
    },
    {
      "version": 2,
      "created_at": "2026-04-24T10:45:00Z",
      "run_count": 1,
      "last_run_status": "success"
    }
  ]
}
```

---

### GET /api/orgs/:orgId/compare
Get lightweight comparison data across versions for the version selector, run summaries, and agent history.

**Response:**
```json
{
  "org_id": "org_abc123",
  "comparison": [
    {
      "version": 1,
      "run_id": "run_xyz789",
      "agent_count": 4,
      "tool_count": 2,
      "total_cost_usd": 0.12,
      "total_steps": 14,
      "output_preview": "Subject: Quick question about your Series A..."
    },
    {
      "version": 2,
      "run_id": "run_def456",
      "agent_count": 4,
      "tool_count": 3,
      "total_cost_usd": 0.18,
      "total_steps": 19,
      "output_preview": "Subject: Saw your $12M round — here's why..."
    }
  ]
}
```

---

### GET /api/runs/:runId
Get full run details including trace, agent inputs, agent outputs, and attached feedback.

**Response:**
```json
{
  "run_id": "run_xyz789",
  "org_id": "org_abc123",
  "version": 1,
  "status": "success",
  "started_at": "...",
  "completed_at": "...",
  "agents": [
    {
      "agent_id": "agent_researcher_1",
      "status": "done",
      "started_at": "...",
      "completed_at": "...",
      "tools_used": [
        { "tool": "tinyfish_browser", "steps": 3, "cost_usd": 0.045 }
      ],
      "input": { "target": "Acme AI" },
      "trace": [
        { "type": "tool_call", "tool": "tinyfish_browser", "summary": "Opened Acme AI funding article" }
      ],
      "output": { "startup_name": "Acme AI", "funding": "$12M" },
      "feedback": [
        { "feedback_id": "fb_123", "message": "Missed LinkedIn profile", "created_at": "..." }
      ]
    }
  ],
  "final_output": {
    "emails": [
      { "startup": "Acme AI", "subject": "...", "body": "..." }
    ]
  }
}
```

---

## Frontend Build Order (Recommended)

Build features in this order so you always have something demo-able:

1. **Landing prompt + single workspace shell** — task input, left chat panel, right canvas, and tabs.
2. **Design tab streaming** — hardcode or mock SSE events that build an org node by node.
3. **Approval + run tab** — approve the org, run it with mock events, and show final output.
4. **Traces tab** — animate task movement through the org and support hover/click inspection.
5. **Feedback loop** — attach feedback to output, agents, and trace steps, then generate v2.
6. **Agent history tab** — show how agents changed across runs and versions.
7. **New org flow** — return to the landing prompt and start a new task cleanly.

This keeps the demo centered on one simple experience: describe a task, watch the org form, approve it, run it, inspect what happened, give feedback, and run the next iteration.

---

*End of UI/UX & API Spec*
