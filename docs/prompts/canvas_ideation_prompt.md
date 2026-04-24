# UI Builder Prompt: AgentOrg Canvas Ideation

Use this prompt to explore multiple visual directions for the AgentOrg canvas only. The goal is not to build the whole app. The goal is to compare 4-5 different canvas concepts for showing an AI organization being created, running a task, and reviewing traces with feedback.

```text
Create 4-5 distinct UI concept prototypes for the AgentOrg canvas.

Do not build the full app. Focus only on the canvas area that visualizes an AI organization.

Context:
AgentOrg lets a user describe a task, then an AI organization is generated. The org has a CEO/planner, teams, agents, tools, workflow handoffs, runs, traces, feedback, and versions. The canvas must make this feel exciting, understandable, and alive.

The current concern:
A normal React Flow box-and-arrow flowchart may feel too boring. Explore more creative canvas styles, including 2D game-like, infographic, isometric, 3D, and hybrid approaches.

Build 4-5 canvas variants side by side or as selectable tabs:

Variant 1: Executive Office / 2D Game View
- Show the org like a small office or command center.
- CEO/planner sits in an office or central desk.
- Teams have cabins/rooms/desks.
- Agents look like small robots or avatars working at desks.
- Tools appear as objects in each agent cabin, e.g. browser terminal, database, file cabinet, search console.
- During creation, rooms/desks/agents appear one by one.
- During running, task cards move from CEO to teams to agents and back to output.
- During trace review, clicking an agent opens a dossier: input, actions, tool use, output, feedback.

Variant 2: Mission Control / Operations Map
- Show the org as a futuristic mission-control dashboard.
- Teams are zones or stations.
- Agents are operator pods.
- Tools are glowing modules attached to each pod.
- During creation, stations power on one by one.
- During running, signals/data packets move between stations.
- During trace review, a timeline scrubber replays the operation and highlights each station.

Variant 3: Company Infographic / Animated Org Poster
- Show a beautiful infographic rather than a flowchart.
- CEO at top, teams as large cards/sections, agents as illustrated role cards.
- Tools are badges and mini-icons.
- Workflow is shown as a ribbon/path that winds through teams.
- During creation, the infographic draws itself like a poster being assembled.
- During running, the ribbon lights up and carries task checkpoints.
- During trace review, each section expands into input/trace/output/feedback.

Variant 4: Factory / Assembly Line
- Show the task as a product moving through an AI factory.
- CEO/planner receives raw task material.
- Teams are factory stations.
- Agents are robot workers at stations.
- Tools are machines each agent can operate.
- During creation, factory stations are built.
- During running, the task moves along conveyors through agents.
- During trace review, each station shows what it received, what machine/tool it used, and what it produced.

Variant 5: 3D / Isometric Org World
- Explore an isometric or light 3D style.
- The org is a small 3D campus or floating command platform.
- CEO tower, team buildings, agent workstations, tool docks.
- During creation, buildings rise from the canvas.
- During running, glowing trails move between buildings.
- During trace review, camera/selection focuses on a building/agent and shows trace cards.
- This can be mocked visually with CSS/isometric SVG. Full Three.js is optional. If using Three.js, keep it lightweight.

For each variant, show the same three modes:

Mode A: Creating Org
- The org is being generated/streamed.
- Show partial state, loading/streaming animation, and what is being created now.
- Example current step labels:
  - "Creating CEO planner..."
  - "Building Research Team..."
  - "Assigning browser tool..."
  - "Connecting Analyst to Writer..."

Mode B: Running Task
- The approved org is executing a task.
- Show task movement through the org.
- Show agents changing states: idle, queued, running, done, failed.
- Show tool use visually.
- Show final output area or output station.

Mode C: Trace + Feedback
- The run is complete.
- User can inspect past run traces.
- Hover/click agent shows:
  - input received
  - trace/actions/tool calls
  - output produced
  - feedback attached
- User can add feedback at:
  - agent
  - team
  - tool call
  - handoff
  - final output
- Show version context: v1, v2, main version.

Use this sample org for every variant:

Task:
"Research 3 AI startups and write personalized cold outreach emails."

Org:
- CEO / Planner
  - role: Decompose task and coordinate execution
- Research Team
  - Researcher A: research Acme AI
  - Researcher B: research BetaWorks
  - Researcher C: research CoreML Labs
  - tools: web search, browser, company database
- Analysis Team
  - Analyst: synthesize research and identify best outreach angle
  - tools: notes database, scoring rubric
- Output Team
  - Writer: write personalized emails
  - Verifier: check specificity and factual grounding
  - tools: writing evaluator, final output store

Run trace sample:
- CEO receives task
- CEO sends target list to Research Team
- Researchers gather funding/team/product/news
- Analyst creates outreach angles
- Writer drafts emails
- Verifier flags generic phrasing
- Writer revises
- Final output: 3 cold emails

Feedback sample:
"The writer's hooks are still generic. Use specific funding or launch events in the first sentence."

Design requirements:
- Make the variants visually different, not just color changes.
- Avoid plain rectangles connected by plain arrows unless one variant intentionally explores a classic diagram.
- Use SVG/HTML/CSS creatively.
- Use smooth but simple animations.
- Include microinteractions for hover/click states.
- Prioritize readability: the user must understand who did what and where the task went.
- The canvas should feel demo-worthy for a hackathon.
- Use mock data only.
- No real API calls.

If building in React:
- Use TypeScript.
- Use Tailwind.
- shadcn/ui is allowed for panels, tabs, cards, popovers, sheets, badges, buttons, and tooltips.
- For diagrams, prefer custom SVG/HTML/CSS first.
- React Flow is optional only for one conservative comparison variant.
- Three.js is optional for the 3D/isometric concept, but keep it as a visual prototype.

Deliverables:
1. A page with 4-5 selectable canvas variants.
2. Each variant supports the three modes:
   - Creating Org
   - Running Task
   - Trace + Feedback
3. Include controls:
   - mode selector
   - play creation animation
   - play run animation
   - select version v1/v2
   - set main
4. Include hover/click inspection.
5. Include a short note under each variant explaining strengths and weaknesses.

Important:
The goal is ideation. Make bold UI choices. It is okay if some variants are less practical, as long as they help compare how AgentOrg could visualize an AI organization in a memorable way.
```
