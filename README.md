# AgentOrg

AgentOrg is an AI organization builder with a single workspace: a task prompt opens **agent chat** on the left and an **org canvas** on the right. You stream an org structure onto the canvas, **approve** it, **run** it with live-style trace animation, inspect **traces**, send **feedback** to spawn a new version, pick versions, and **set main**.

This repository ships a working **Next.js** application under `frontend/`, shared **Zod contracts**, **Next.js Route Handlers** for the Phase 1 HTTP and SSE API surface, optional **InsForge** persistence after generation completes, and SQL **migrations** for orgs, runs, traces, and feedback.

---

## Features (what the app does today)

- **Landing:** task input with example prompts; starts the workspace flow.
- **Workspace layout:** chat panel on the left; tabs on the right for **canvas**, **traces**, and **history**. The **history** tab renders a timeline from the **current org’s run traces in client state** (`org.run.traces`). The server implements `GET /api/orgs/[orgId]/history`; the history tab UI does not fetch it.
- **Org canvas (2D):** [React Flow](https://reactflow.dev/) graph of leadership, teams, agents, tools, scoped resources, workflow steps, and handoff edges. Teams use a vertical layout (research on top, output below). Edges use higher-contrast styling so connections stay readable on a dark canvas. Badges distinguish **tools**, **paths**, and **agent-style identifiers** with icons (Lucide).
- **Generation:** `POST /api/orgs/generate` returns **Server-Sent Events** (`text/event-stream`) with the same canvas event sequence the UI reducer already consumes. The final org payload is produced from the **fixture generator** in code (`createOrgFixture` / `createGenerationEvents`), not from a separate hosted agent service.
- **Persistence:** when InsForge environment variables are set (see below), the completed org/version is written through **`@insforge/sdk`** from server code only.
- **Lifecycle APIs:** approve org, set a version as main, start a run, stream run trace events over SSE, fetch run detail, post feedback (driving a new org version in the client flow), fetch org history.
- **Run UX:** queued / running / done states on agents, highlighted handoff edges, workflow rail, and final output presentation (driven by the trace contract and mock trace generator for the demo loop).
- **Traces tab:** per-agent detail: input, trace text, output, tools, and feedback controls.
- **Feedback loop:** submitting feedback updates the in-app org (example: adjusted researcher copy and an extra tool on the next version).
- **3D lab:** optional `canvas-lab` page using **React Three Fiber**, **Drei**, and **Three.js** for an alternate spatial view of the same org data.

---

## Tools and libraries (this repo)

| Area | Technology |
|------|------------|
| App framework | **Next.js** 16.2.4 (App Router, Route Handlers) |
| UI | **React** 19.2.4, **TypeScript** 5 |
| Styling | **Tailwind CSS** 4, **PostCSS** |
| Canvas graph | **`@xyflow/react`** 12.x (React Flow) |
| 3D view | **`@react-three/fiber`** 9.x, **`@react-three/drei`** 10.x, **three** 0.184.x |
| Validation / contracts | **Zod** 4.3.x (`frontend/src/lib/contracts/`) |
| Icons | **lucide-react** |
| Utilities | **clsx**, **tailwind-merge**, **class-variance-authority** |
| Persistence (optional) | **InsForge** — **`@insforge/sdk`** 1.2.x, InsForge CLI (`npx @insforge/cli`) for `link` and env helpers |
| Lint | **ESLint** 9, **eslint-config-next** 16.2.4 |

**Not implemented in application code:** Mastra agent runtime, TinyFish browser automation, Ghost ephemeral databases, Guild execution, and Chainguard packaging flows. Those integrations are specified and scoped in `docs/guides/external-tools.md` and the handoff docs; the current product loop runs on the fixture stream and the in-repo trace generator.

---

## Repository layout

| Path | Purpose |
|------|---------|
| `frontend/` | Next.js app: pages, features, API routes, InsForge server modules |
| `frontend/src/lib/contracts/` | Zod schemas and types shared by API and UI |
| `migrations/` | SQL tracked for InsForge / Postgres-style deployments |
| `insforge/migrations/` | Additional migration copies used in docs workflows |
| `scripts/write-insforge-env.mjs` | Writes InsForge keys from the CLI into `frontend/.env.local` (no secret echo) |
| `docs/` | Product spec, UI spec, integration plan, guides, prompts, handoffs |
| `references/` | Cloned reference material; treat as read-only unless you refresh clones intentionally |

---

## Run locally (PowerShell)

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open the URL Next.js prints (default **http://localhost:3000**).

**Offline UI mock (no generate API):** set in `frontend/.env.local`:

```env
NEXT_PUBLIC_AGENTORG_OFFLINE_MOCK=1
```

With that unset, the workspace uses **`POST /api/orgs/generate`** and the other API routes over the network stack the browser already uses for same-origin fetches.

---

## InsForge (optional persistence)

1. From the **repository root**, run `npx @insforge/cli link` and select your InsForge project.
2. Apply the SQL in `migrations/` per your InsForge / Postgres workflow.
3. Populate `frontend/.env.local` without hand-copying secrets from the terminal:

```powershell
cd frontend
npm run env:insforge
```

That script reads `.insforge/project.json` and uses the InsForge CLI to fill **`ANON_KEY`**, **`API_KEY`**, and **`oss_host`**-derived URLs. The root **`.env`** file is **gitignored**; keep secrets only in ignored env files.

---

## Build

```powershell
cd frontend
npm run build
```

---

## Documentation index

- `docs/ai_orgs_spec_v2.md` — product vision, MVP scope, architecture, demo script  
- `docs/ai_orgs_ui_ux_spec.md` — single-workspace UI and API shapes  
- `docs/plans/integration_implementation_plan.md` — phased plan (Phase 1 UI + APIs + persistence; later phases for external tools)  
- `docs/handoff/frontend_phase_1_handoff.md` — original UI prototype contract  
- `docs/handoff/phase_1_integration_handoff.md` — integration boundaries and next backend steps  
- `docs/guides/insforge.md`, `docs/guides/main-agent-and-streaming.md`, `docs/guides/external-tools.md` — integration notes  
- `docs/tools.md` — reference sources and related repos  
- `docs/prompts/` — copy-ready prompts for UI and canvas exploration  
