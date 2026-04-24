# AgentOrg 3D Visual Model

## Core Idea

The 3D canvas should show an AI organization as a small explorable operating floor.

The user should immediately understand:

- This is one org.
- The org has a CEO/planner.
- The org has teams.
- Each team has individual agents.
- Agents have tools.
- Resources can be scoped to the org, a team, or a single agent.
- Work moves through the org.
- Traces and feedback attach to concrete places in the world.

## World Layers

### 1. Org Layer

The org is the whole building, campus, or operations floor.

Visual elements:

- Main floor/base plate with org name.
- CEO/planner command office at the top or center.
- Org-level shared resource area.
- Final output station.
- Version marker, e.g. `v1 draft`, `v2 main`.

Org-level resources should be visible as shared infrastructure:

| Resource | Visual |
|---|---|
| Ghost org DB | Shared database/server room or glowing DB tower |
| InsForge file storage | Archive wall, file vault, or storage shelves |
| Shared tools | Tool dock near CEO or central utility wall |
| Final output | Delivery table, printer, or output terminal |

Interaction:

- Click org base or org label: opens org summary.
- Click Ghost DB tower: opens org-level DB resource details.
- Click file storage vault: opens stored artifacts/files.
- Click output station: opens final output and feedback composer.

### 2. CEO / Planner Layer

The CEO/planner is the coordination hub.

Visual elements:

- Command desk or glass office.
- Large planning monitor.
- Handoff map or mini control board.
- Work packets originate here during run mode.

Interaction:

- Click CEO/planner: show task decomposition, routing decisions, and high-level trace.
- Feedback target: planner instructions, workflow design, decomposition quality.

Creation mode:

- CEO office appears first.
- Planning monitor boots up with task text.
- First work packets or team blueprints appear on desk.

Run mode:

- Task packet starts at CEO office.
- CEO sends target list to Research Team.

Trace mode:

- CEO office shows trace markers for decomposition and handoff decisions.

### 3. Team Layer

Teams should feel like rooms or zones, not cards.

Visual elements:

- Team floor zone, room, or pod.
- Team name on the floor or wall.
- Team shared tool shelf.
- Team shared Ghost DB or file cabinet if team-scoped resources exist.
- Agents arranged as desks/stations inside the zone.

Team examples:

- Research Team: desks with web/browser terminals, evidence board, team DB.
- Analysis Team: strategy table, scoring rubric board, notes database.
- Output Team: writing desk, verifier desk, final output store.

Interaction:

- Click team floor/room: show team purpose, agents, shared resources, team traces.
- Feedback target: team structure, team instructions, team handoffs, shared resource use.

Creation mode:

- Team room/floor zone rises or fades in.
- Shared team resources appear after the room exists.
- Agents appear inside the room one by one.

Run mode:

- Active team zone glows.
- Team shared DB/file cabinet lights up when used.

Trace mode:

- Team zone displays small event pins for all team trace events.
- Clicking a pin filters trace panel to that team.

### 4. Agent Layer

Agents are individual workers at stations.

Visual elements:

- Small stylized worker/robot/avatar.
- Desk or workstation.
- Monitor displaying current state.
- Status light above or beside desk:
  - gray = idle
  - amber = queued
  - cyan/blue = running
  - green = done
  - red = failed
- Personal/private resources around the desk.

Interaction:

- Click agent: show agent dossier.
- Hover agent: compact popover with current input/action/output summary.
- Double click agent: camera focuses on that desk.

Agent dossier should show:

- Role.
- System prompt summary.
- Input received.
- Trace/actions.
- Tool calls.
- Output produced.
- Feedback already attached.
- Feedback composer targeting this agent.

Creation mode:

- Desk appears first.
- Avatar appears.
- Monitor boots up.
- Tool objects appear around the desk.

Run mode:

- Agent state changes from queued to running to done.
- Worker animation plays while running.
- Monitor and tool objects pulse during activity.

Trace mode:

- Agent has persistent trace badge.
- Tool-call markers appear on the exact tools used.
- Feedback marker appears if feedback is attached.

### 5. Tool Layer

Tools should be visible as usable objects, not only text badges.

Tool visuals:

| Tool | Agent-level visual |
|---|---|
| TinyFish Search | Search console or radar screen |
| TinyFish Browser | Browser terminal with mini page window |
| Company database | Small database cylinder or cabinet |
| Notes database | Notebook stack or DB terminal |
| Scoring rubric | Evaluation board/checklist |
| Writing evaluator | QA meter or checker terminal |
| Final output store | Delivery terminal, file stack, or printer |

Interaction:

- Click tool object: show tool capability, scope, auth requirement, and trace calls.
- Feedback target: tool call quality, missing sources, bad extraction, bad evaluator behavior.

Run mode:

- Tool object pulses when a `tool_call_started` event occurs.
- Tool object turns green when completed.
- Tool object turns red on failure.

Trace mode:

- Tool call history is attached directly to the object.

### 6. Resource Scope Layer

The scope model is a key product differentiator. The world should make resource scope obvious.

Scopes:

- Org scope: shared by all teams/agents.
- Team scope: visible inside one team zone.
- Private scope: attached to one agent desk.

Visual language:

| Scope | Placement | Color / Shape |
|---|---|---|
| Org | Central/shared infrastructure | Blue or cyan tower |
| Team | Inside team zone, shared shelf/DB | Amber shared cabinet |
| Private | Beside one desk | Small purple lockbox |

Examples:

- Org Ghost DB: central server room.
- Research Team Ghost DB: cabinet inside Research Team zone.
- Agent private Ghost DB: small lockbox next to Researcher A desk.
- Org file storage: central archive.
- Team output file store: shelf in Output Team zone.

Interaction:

- Clicking a scoped resource opens:
  - resource type
  - provider
  - scope
  - owner: org/team/agent
  - trace usage
  - feedback target

## Mode Design

### Mode A: Creating Org

Purpose:

Show the organization being generated from a task.

World behavior:

1. Empty floor appears.
2. Org name and mission appear.
3. CEO office builds.
4. Org-level resources appear.
5. Team zones appear.
6. Team resources appear.
7. Agent desks appear one by one.
8. Agent avatars appear.
9. Tools appear around desks.
10. Handoff paths draw between stations.

Good current step examples:

- `Creating CEO planner...`
- `Building Research Team...`
- `Adding team Ghost DB...`
- `Assigning TinyFish Browser to Researcher A...`
- `Connecting Analyst to Writer...`

### Mode B: Running Task

Purpose:

Show execution as a live operation.

World behavior:

- A work packet starts at CEO.
- It moves along visible paths.
- Team zones glow when active.
- Agents change status.
- Tools pulse during use.
- Handoffs move as packets between desks.
- Output station fills when final output is produced.

Trace event mapping:

| Trace event | Visual |
|---|---|
| `run_started` | Floor lights up, CEO monitor starts |
| `step_started` | Workflow path segment highlights |
| `agent_queued` | Agent desk amber |
| `agent_started` | Agent desk cyan, worker animation |
| `agent_input` | Packet arrives at desk |
| `tool_call_started` | Tool object pulses |
| `tool_call_completed` | Tool object turns green briefly |
| `agent_output` | Output packet appears |
| `handoff` | Packet moves to next station |
| `agent_completed` | Agent desk green |
| `run_completed` | Output station opens/fills |

### Mode C: Trace + Feedback

Purpose:

Make the past run inspectable and editable.

World behavior:

- Run is frozen/replayable.
- Agents and tools have trace pins.
- Handoff paths are clickable.
- Timeline scrubber can replay steps.
- Clicking any object opens the inspector.

Feedback targets:

- Org.
- CEO/planner.
- Team.
- Agent.
- Tool.
- Tool call.
- Handoff edge.
- Workflow step.
- Final output.

Feedback examples:

- Agent: `The writer's hooks are still generic. Use specific funding or launch events in the first sentence.`
- Tool call: `Search should include LinkedIn hiring signals.`
- Team: `Research Team should always return sourced funding evidence when available.`
- Handoff: `Analyst handoff to Writer needs ranked hooks, not just summaries.`
- Final output: `Emails need stronger company-specific opening lines.`

## Camera And Exploration

Required controls:

- Wheel: zoom in/out.
- Drag: orbit or pan.
- Right-drag or modifier-drag: pan.
- Click: select object.
- Double-click: focus selected object.
- Reset view: return to whole org.
- Optional minimap: show where the camera is in the org.

Recommended first camera:

- Perspective camera.
- Slightly top-down angle.
- Limited vertical orbit so the user cannot go under the floor.
- Zoom bounds to prevent clipping through desks.

## Information Density Rules

Default view:

- Show team names.
- Show agent names.
- Show agent status.
- Show major scoped resources.
- Hide full prompts and trace text.

On hover:

- Show role summary.
- Show current status.
- Show latest input/output snippet.

On click:

- Open full details in side panel.

Do not put long text inside the 3D world. Use the 3D scene for orientation and the React panel for detail.

## First 3D Prototype Acceptance

The first real Three.js prototype is good enough when:

- The user can zoom and pan around the org.
- The user can click each team.
- The user can click each agent.
- The user can click at least one tool object per agent.
- The user can click org-level Ghost DB and file storage.
- The user can see team-level and private resources in different places.
- Running mode animates packets and statuses.
- Trace mode shows pins and opens a feedback panel.
- The scene feels more like a small game world than a diagram.

