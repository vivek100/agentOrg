# AI Orgs — Hackathon Project Specification (v2)

> **"Describe a task. Watch an AI org form around it. Run, inspect, and improve it."**

---

## 🚀 Core Idea

The user starts from a simple ChatGPT-style prompt: describe the task they want done. The app then opens a single workspace where agent chat streams on the left and a canvas on the right builds a structured **AI Org** — a team of specialized agents with defined roles, tools, and memory scopes encoded in a single JSON schema.

Once the user approves the org, the same canvas becomes the run, trace, and history surface. The org runs the task, the user inspects how work moved through the agents, gives feedback on what went right or wrong, and the system generates the next org iteration.

---

## 🎯 Product Vision

1. User lands on a simple prompt page and describes the task.
2. App opens the single workspace: agent chat on the left, canvas on the right.
3. Claude streams **Org v1** into the canvas as an interactive org design.
4. User approves the org or requests changes in chat.
5. Canvas unlocks `Run`, `Traces`, and `Agent History` tabs.
6. User runs the task through the org and sees the final output.
7. Traces show the org and the task moving through it in a visual, inspectable way.
8. User hovers or clicks agents to see each agent's input, trace, output, and attached feedback.
9. Feedback generates **Org v2** with adjusted roles, prompts, tools, or workflow.
10. Repeat the run and keep iterating until the org is good enough.

---

## 💡 Key Differentiators

- **Schema-first** — one JSON object defines everything: the org, teams, agents, tools, memory
- **Single-screen workflow** — design, approval, run, traces, history, and iteration live in one workspace
- **Org evolution** — not just run-and-done; orgs iterate based on feedback like real teams do
- **Traceable execution** — hover or click agents to inspect input, trace, output, and feedback
- **Visual execution** — animated org chart showing the task moving through the org in real time
- **Scoped resource access** — tools, DBs, and storage assigned at org / team / agent level

---

## 🧠 The Org JSON Schema (Core Artifact)

Claude generates this from the user's task. All downstream steps — visualization, execution, versioning — derive from it.

### Resource Scoping Rules

| Scope | Access | Example use |
|-------|--------|-------------|
| `org` | All agents and teams | Shared knowledge base, final deliverable storage |
| `team` | Agents within same team | Researchers share findings; writer reads them |
| `private` | Single agent only | Agent scratch space, working memory |

### Schema Example

```json
{
  "org": {
    "id": "org_abc123",
    "version": 1,
    "name": "Growth Research Team",
    "task": "Research 3 AI startups and write personalized outreach emails",
    "created_at": "2026-04-24T10:00:00Z",

    "resources": {
      "tools": ["web_search"],
      "db": { "provider": "ghost", "id": "ghost_org_001", "scope": "org" },
      "storage": { "provider": "insforge", "path": "/org/shared", "scope": "org" }
    },

    "teams": [
      {
        "id": "team_research",
        "name": "Research Team",
        "resources": {
          "tools": ["tinyfish_browser", "tinyfish_search"],
          "db": { "provider": "ghost", "id": "ghost_team_research", "scope": "team" }
        },
        "agents": [
          {
            "id": "agent_researcher_1",
            "name": "Researcher A",
            "role": "Research startup: Acme AI",
            "system_prompt": "You are a B2B research analyst. Find funding, team size, product focus, and recent news. Be concise and factual.",
            "resources": {
              "tools": ["tinyfish_browser"],
              "db": { "provider": "ghost", "id": "ghost_r1", "scope": "private" },
              "storage": { "provider": "insforge", "path": "/agents/r1", "scope": "private" }
            },
            "output_schema": {
              "startup_name": "string",
              "funding": "string",
              "team_size": "number",
              "product_summary": "string",
              "recent_news": "string"
            }
          }
        ]
      },
      {
        "id": "team_output",
        "name": "Output Team",
        "resources": {
          "tools": [],
          "db": { "provider": "ghost", "id": "ghost_team_output", "scope": "team" },
          "storage": { "provider": "insforge", "path": "/team/output", "scope": "team" }
        },
        "agents": [
          {
            "id": "agent_analyst",
            "name": "Analyst",
            "role": "Synthesize research findings",
            "system_prompt": "You are a strategic analyst. Read all researcher outputs and identify the most compelling angle for outreach for each startup.",
            "resources": {
              "tools": [],
              "db": { "provider": "ghost", "id": "ghost_analyst", "scope": "private" }
            },
            "depends_on": ["agent_researcher_1", "agent_researcher_2"]
          },
          {
            "id": "agent_writer",
            "name": "Writer",
            "role": "Draft personalized outreach emails",
            "system_prompt": "You are an expert B2B copywriter. Write concise, specific, non-generic cold emails. No fluff.",
            "resources": {
              "tools": [],
              "storage": { "provider": "insforge", "path": "/team/output/emails", "scope": "team" }
            },
            "depends_on": ["agent_analyst"]
          }
        ]
      }
    ],

    "workflow": [
      { "step": 1, "label": "Decompose task", "agents": ["planner"], "parallel": false },
      { "step": 2, "label": "Research startups", "agents": ["agent_researcher_1", "agent_researcher_2", "agent_researcher_3"], "parallel": true },
      { "step": 3, "label": "Synthesize findings", "agents": ["agent_analyst"], "parallel": false },
      { "step": 4, "label": "Write outreach emails", "agents": ["agent_writer"], "parallel": false }
    ]
  }
}
```

---

## 🔄 The Iteration Loop (Core Flow)

```
Landing Prompt
   ↓
Single Workspace Opens
   ↓
Agent chat streams while canvas builds Org v1
   ↓
User approves Org v1
   ↓
Run task through Org v1
   ↓
Inspect final output + traces
   ↓
Feedback: "Emails too generic. Researcher didn't find LinkedIn data."
   ↓
Claude generates Org v2:
  - Researcher system_prompt updated
  - LinkedIn tool added to Researcher agents
  - Writer system_prompt made more specific
   ↓
Org v2 Runs
   ↓
Review traces again → Org v3 if needed
```

What changes between versions:
- Agent `system_prompt` values (personality, focus)
- Tool assignments per agent
- Team structure (add/remove agents)
- Workflow step ordering
- DB scope changes

What stays the same:
- The task
- The schema structure
- The execution infrastructure

Feedback can attach to:
- Final run output
- A specific agent
- A handoff between agents
- A workflow step
- A trace event or tool call

---

## 🔗 Infrastructure & Tools

| Component | Role | Notes |
|-----------|------|-------|
| **Claude (Anthropic API)** | Generates org schema; powers each agent | Core LLM for all intelligence |
| **Chainguard Libraries** | Secure, vetted Python packages installed from Chainguard's registry instead of PyPI | Replaces standard pip for agent dependencies — no containers needed |
| **Guild.ai** | Governs and tracks agent runs; versioning; observability | Reads schema, fires agent runs, logs all inputs/outputs |
| **InsForge** | Backend: Postgres, Auth, Storage, Edge Functions, Realtime | Source of truth for schema versions, run history, artifacts |
| **TinyFish** | Web automation API for browser/search tasks | Research agents only; ~$0.015/step |
| **TigerData Ghost** | Ephemeral per-agent Postgres DBs | Instant fork per agent; think git branches for data |
| **Redis** | *(Optional)* Pub/sub for real-time agent-to-agent events | Only needed if InsForge realtime is insufficient |
| **WunderGraph Cosmo** | *(Optional)* API federation | Skip for MVP |

### Chainguard Libraries — What This Means in Practice

Chainguard provides a secure mirror of common Python packages (numpy, requests, langchain, anthropic SDK, etc.) hosted at their registry. Instead of:

```bash
pip install anthropic requests
```

Agents install from:

```bash
pip install --index-url https://packages.cgr.dev/python/simple/ anthropic requests
```

No containers required. Same packages, hardened supply chain. Drop-in for any Python agent runtime.

---

## 🧩 Architecture (No Containers)

```
┌─────────────────────────────────────────────────┐
│                  Frontend (UI)                   │
│  Landing Prompt · Chat Panel · Canvas Workspace  │
│  Design · Run · Traces · Agent History           │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│             InsForge Backend                     │
│  Schema versions · Run history · Artifacts       │
│  Auth · Realtime updates · File storage          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│         Orchestrator (Claude API)                │
│  Generate schema → Validate → Store → Trigger   │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│          Guild.ai Execution Layer                │
│  Reads schema · Fires agent runs · Tracks status │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    Agent Process  Agent Process  Agent Process
    (Python, deps  (Python, deps  (Python, deps
    via Chainguard) via Chainguard) via Chainguard)
         │             │             │
    Private Ghost  Private Ghost  Private Ghost
    DB             DB             DB
         └─────────────┼─────────────┘
                  Team Ghost DB
                  Org Ghost DB
               InsForge Storage
```

---

## ⚡ MVP Scope

**Build:**
- ChatGPT-style landing prompt for starting a new org from a task
- Single workspace with agent chat on the left and canvas on the right
- Streaming org design in the canvas, followed by user approval
- Canvas tabs: `Design`, `Run`, `Traces`, and `Agent History`
- Animated org chart showing task movement during execution
- Hover/click inspection for each agent's input, trace, output, and feedback
- Feedback loop that creates **Org v2** and reruns the task

**Skip:**
- Redis (use InsForge realtime)
- WunderGraph
- More than 3 research targets in the demo
- QA/Verifier agent (nice to have, not critical)
- Full side-by-side comparison screen; use run summaries and agent history for MVP

---

## 🏆 Demo Script

1. Enter task: *"Research 3 AI startups and write cold outreach emails"*
2. Workspace opens: chat streams on the left while the canvas builds **Org v1**
3. User approves the org
4. Click **Run Task** — watch the task move through the org in real time
5. Output appears: 3 emails, but they are somewhat generic
6. Open `Traces`, hover over a researcher, and see input → trace → output
7. Add feedback on the agent: *"Researcher missed LinkedIn and funding data"*
8. Add feedback on the writer output: *"Opening is too generic"*
9. Generate **Org v2** — the design tab streams the updated org
10. Run v2 — traces show better research and a stronger final output

**The wow moment:** The user can see the org being designed, then watch the task move through it, hover any agent to understand what happened, give targeted feedback, and immediately run a better org.

---

## 💬 Pitch

> "Start with a task. Watch an AI organization form around it. Run the work, inspect every agent's input and output, give feedback where it matters, and evolve the org until it gets the job right."

---

## 🧠 Future Extensions

- Reusable org templates
- Automated feedback (agent-driven review, no human needed)
- Cost + token estimation per org version
- Org marketplace — share and fork winning org schemas
- Multi-tenant org collaboration

---

## 📎 Final Infrastructure Decisions

| Component | Decision | Reason |
|-----------|----------|--------|
| LLM | Claude API | Best structured JSON generation; native tool calling |
| Backend | InsForge | Agent-native BaaS, realtime built in, free tier |
| Execution + Tracking | Guild.ai | Governed runs, versioning, per-agent observability |
| Agent Memory | Ghost (TigerData) | Ephemeral per-agent Postgres, instant fork |
| Web Automation | TinyFish | SOTA browser API, simple, pay-per-step |
| Secure Packages | Chainguard Libraries | Hardened Python deps, no containers needed |
| Runtime | Plain Python processes | Simple, fast to set up |
| Inter-agent Comms | Ghost DBs + InsForge Realtime | No Redis needed for MVP |
| Queue/Pub-sub | Redis *(optional)* | Add only if realtime proves insufficient |

---

*End of Spec v2*
