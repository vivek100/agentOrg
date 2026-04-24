# UI Builder Prompt: AgentOrg Mock Frontend

Use this prompt with a UI builder or frontend coding agent to create a mock AgentOrg frontend. The result should use mock APIs and fixtures, but the UX should feel complete.

```text
Build a polished mock frontend for an app called AgentOrg.

Tech requirements:
- Use Next.js with TypeScript.
- Use Tailwind CSS.
- Use shadcn/ui components.
- Use mock APIs or local async generators only. Do not integrate real OpenAI, Mastra, InsForge, Ghost, TinyFish, Guild, or Chainguard yet.
- Keep all mock data behind stable TypeScript contracts so real backend APIs can replace the mock layer later.

Product concept:
AgentOrg lets a user describe a task and watch an AI organization form around it. The user starts from a ChatGPT-style landing page, enters a task, then moves into a single workspace. The left panel streams agent chat. The right panel is a canvas where the org is designed, approved, run, traced, improved, versioned, and marked as main.

Build the complete mock UX flow:

1. Landing prompt
- Full-screen, centered, minimal ChatGPT-style prompt.
- Title: "What should your AI org do?"
- Large textarea.
- Primary button: "Create Org".
- Example prompts:
  - "Research 3 AI startups and write cold outreach emails"
  - "Analyze competitor pricing and summarize findings"
  - "Scrape job postings and extract skills trends"
- Clicking an example fills the textarea.
- Clicking "Create Org" opens the workspace.

2. Workspace shell
- Single screen, no multi-page wizard.
- Top bar:
  - app name: AgentOrg
  - current org name
  - version selector with v1/v2
  - status badge: draft/approved/main/archived
  - "Set Main" button
  - "New Org" button
- Main layout:
  - left panel: Agent Chat
  - right panel: Canvas workspace
- Canvas tabs:
  - Design
  - Run
  - Traces
  - Agent History

3. Agent chat panel
- Show user task.
- Stream mock assistant messages while generating:
  - "I am decomposing the task..."
  - "Creating the leadership node..."
  - "Adding the research team..."
  - "Adding analyst and writer agents..."
  - "Defining workflow handoffs..."
- Include an input at the bottom for "Ask for changes..."
- Before approval, user can type changes like "add a verifier"; mock this by adding a verifier node or showing a changed state.

4. Design canvas
- This is the most important part. Make it visually impressive.
- Render the org as a living company/org chart, not a plain table.
- Include:
  - org/company identity header
  - CEO/planner/coordinator leadership node
  - team groups as rounded containers
  - agents inside team groups
  - tool badges on agents
  - memory/resource scope badges
  - workflow rail or step bar
  - handoff edges between agents
  - selected detail panel
- Stream the org onto the canvas node by node:
  - org identity
  - CEO/planner
  - Research Team
  - Researcher A/B/C
  - Analysis Team
  - Analyst
  - Output Team
  - Writer
  - optional Verifier
  - tool badges
  - workflow steps
  - edges
- Use animation:
  - fade/slide nodes in
  - draw edges after nodes exist
  - glow current created node
  - subtle pulsing while generating
- Buttons:
  - "Request Changes"
  - "Approve Org"
- Org cannot be run until approved.

5. Run tab
- After "Approve Org", unlock Run tab.
- Show selected org version and "Run Task" button.
- On "Run Task", animate a mock run:
  - workflow step highlights
  - agents go queued -> running -> done
  - task particles or small cards move across edges
  - active nodes glow blue
  - completed nodes turn green
- Show final output after completion:
  - three sample cold emails
  - output quality summary
  - cost/time/steps summary
- Add a feedback box under final output.

6. Traces tab
- Show the same org canvas, but in trace inspection mode.
- Include replay controls:
  - play/pause
  - scrubber/timeline
  - event count
- Hover interactions:
  - hover agent: compact popover with input, trace summary, output
  - hover edge: handoff payload summary
  - hover tool badge: tool call summary
- Click interactions:
  - click agent: open right-side detail panel
  - click workflow step: filter trace timeline to that step
  - click tool badge: show tool call details
- Detail panel must show:
  - agent name and role
  - input received
  - trace events
  - tool calls
  - output produced
  - feedback button
- Make traces feel visual and inspectable, not like raw logs.

7. Feedback and versioning
- Feedback can target:
  - final output
  - full run
  - agent
  - team
  - workflow step
  - tool call
  - handoff edge
  - trace event
- When user submits feedback, mock a new version:
  - chat says "Updating writer instructions..."
  - Design tab shows Org v2
  - v2 has visible differences:
    - Writer prompt badge says "specific funding hook"
    - Research agents have stricter output requirements
    - optional Verifier node added
- Version selector shows v1 and v2.
- User can run v2.
- User can click "Set Main" to mark v2 as main.

8. Agent History tab
- Show version/run history by agent.
- Example:
  - Researcher A
    - v1: missed LinkedIn/funding data
    - feedback: "always find funding when available"
    - v2: found funding source
  - Writer
    - v1: generic opening
    - feedback: "open with company-specific event"
    - v2: stronger hook
- Include filters for version, run, and agent.

TypeScript contracts:
Create types for:
- OrgSpec
- OrgVersion
- TeamSpec
- AgentSpec
- ToolSpec
- WorkflowStep
- OrgEdge
- CanvasEvent
- Run
- TraceEvent
- Feedback

Use these statuses:
- Org status: "draft" | "approved" | "main" | "archived"
- Agent status: "idle" | "queued" | "running" | "done" | "failed"
- Run status: "idle" | "running" | "success" | "failed"

Mock API behavior:
- Implement mock async functions or mock Next.js API routes:
  - generateOrg(task): streams chat and canvas events
  - approveOrg(orgId, version)
  - runOrg(orgId, version): streams trace events
  - submitFeedback(target, message): creates v2
  - setMainVersion(orgId, version)
  - getHistory(orgId)
- Use delays to simulate streaming.
- Frontend components should consume event streams through a reducer, not hardcoded final objects.

Suggested shadcn/ui components:
- Button
- Textarea
- Card
- Badge
- Tabs
- ScrollArea
- Popover
- Sheet
- Dialog
- Tooltip
- Separator
- DropdownMenu
- Command
- Progress
- Skeleton

Visual style:
- Dark, technical, polished.
- Minimal landing page.
- Canvas should feel alive with subtle motion.
- Use blue for running, green for done, amber for queued, red for failed, gray for idle.
- Use rounded team containers and clear hierarchy.
- Avoid clutter. Hide deep details until hover/click.
- Do not show raw JSON as the main UI.

Suggested file structure:
src/
  app/
    page.tsx
    workspace/[orgId]/page.tsx
  components/ui/
  features/
    landing/
    workspace/
    chat/
    canvas/
    run/
    traces/
    feedback/
    history/
  lib/
    fixtures/
    mock-api/

Acceptance criteria:
- User can complete task -> org generation -> approval -> run -> trace inspection -> feedback -> v2 -> run v2 -> set main.
- Works fully with mock data and mock APIs.
- UI looks good enough for a hackathon demo.
- Contracts are clean enough to replace mock APIs with real Mastra/InsForge APIs later.
- No real secrets or external API calls.
```
