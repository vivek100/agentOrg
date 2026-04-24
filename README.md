# AgentOrg

AgentOrg is a UI-first AI organization builder. The product starts with a simple task prompt, opens a single workspace with agent chat on the left and an org canvas on the right, then lets the user approve, run, inspect, and improve an AI org.

## Current Docs

- `docs/ai_orgs_spec_v2.md` - product vision, MVP scope, architecture, and demo script.
- `docs/ai_orgs_ui_ux_spec.md` - single-workspace UI/UX and mock API specification.
- `docs/tools.md` - source list for required integrations and reference repos.
- `docs/plans/integration_implementation_plan.md` - phased implementation plan, with Phase 1 focused on the complete UI, Mastra, InsForge, runs, traces, feedback, and versions loop.
- `docs/handoff/frontend_phase_1_handoff.md` - handoff for starting a fresh frontend build chat.
- `docs/handoff/phase_1_integration_handoff.md` - handoff for the next implementation phase: Mastra, InsForge, real APIs, and wiring the mock UI to persisted data (Phase 1 completion; Phase 2+ deferred).
- `docs/prompts/ui_builder_mock_frontend_prompt.md` - copy-ready prompt for generating a mock frontend with mock APIs and the full UX flow.
- `docs/prompts/canvas_ideation_prompt.md` - copy-ready prompt for exploring 4-5 canvas visualization directions.
- `docs/guides/` - tool-specific integration and smoke-test guides.

## Reference Repos

External reference repos are cloned under `references/` and should be treated as read-only source material unless intentionally refreshed.

## Preferred Technical Direction

- Frontend: single workspace with landing prompt, agent chat, and canvas tabs.
- Main agent: Mastra-powered TypeScript agent using OpenAI `gpt-5.4-mini` after model access is verified.
- Backend: InsForge for database, auth, storage, realtime events, functions, and deployment support.
- Tool integrations: TinyFish for web automation, Ghost CLI/API key for ephemeral Postgres databases, Chainguard for hardened packages/images, Guild as a possible execution/observability path after the UI and agent builder are stable.

## Frontend Prototype

The Phase 1 mock frontend lives in `frontend/`. It is a Next.js + TypeScript app using Tailwind and React Flow for the org canvas.

Run it with PowerShell:

```powershell
cd frontend
npm run dev
```

Current prototype coverage:

- ChatGPT-style landing prompt with example tasks.
- Single-screen workspace with agent chat on the left and canvas tabs on the right.
- Compact canvas-first workspace with minimal chrome, contextual controls, and details shown as click-triggered overlays instead of a permanent side rail.
- Mock streaming org generation into a React Flow canvas with leadership, teams, agents, tools, scoped resources, workflow steps, and handoff edges.
- Approval flow that unlocks running the org.
- Mock run animation with queued/running/done agent states, active handoff edges, workflow rail, and final output.
- Traces tab with clickable agent detail for input, trace, output, tools, and feedback.
- Feedback loop that creates `Org v2` with adjusted researcher instructions and an added LinkedIn signal tool.
- Version selector plus `Set Main` behavior.

The app is intentionally mock-first so the later InsForge/Mastra backend can replace the fixture event streams without changing the core UI flow.

### Phase 1 integration (in progress)

- **Contracts:** `frontend/src/lib/contracts/` — Zod schemas and parsers for `OrgSpec`, canvas stream events, trace events, and feedback payloads (aligned with the workspace UI types).
- **APIs (Phase 1 surface):** Next.js route handlers under `frontend/src/app/api/` — `POST /api/orgs/generate` (SSE canvas), `POST /api/orgs/[orgId]/approve`, `POST /api/orgs/[orgId]/versions/[version]/main`, `POST /api/orgs/[orgId]/run`, `GET /api/runs/[runId]/stream` (SSE traces), `GET /api/runs/[runId]`, `POST /api/feedback`, `GET /api/orgs/[orgId]/history`. The workspace hook calls these when **not** in offline mock mode (`NEXT_PUBLIC_AGENTORG_OFFLINE_MOCK`).
- **Generate API:** `POST /api/orgs/generate` — server-sent events (`text/event-stream`) with the same canvas event sequence as the mock; optional InsForge upsert after the stream finishes (see `migrations/` for CLI-tracked SQL and `frontend/.env.example`).
- **External SaaS tools** (TinyFish, Ghost, Guild, Chainguard) stay **Phase 2+** per `docs/handoff/phase_1_integration_handoff.md` and `docs/guides/external-tools.md`; runs still use the same trace contract so those tools can plug in later.
- **Default behavior:** the workspace calls the generate API over SSE. To use the legacy in-browser timer mock instead, set `NEXT_PUBLIC_AGENTORG_OFFLINE_MOCK=1` in `frontend/.env.local`.

PowerShell:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm run dev
```

After `npx @insforge/cli link` at the **repo root**, populate InsForge variables into `frontend/.env.local` (no secrets printed):

```powershell
cd frontend
npm run env:insforge
```

That runs `scripts/write-insforge-env.mjs`, which reads `oss_host` from `.insforge/project.json` and pulls `ANON_KEY` and `API_KEY` via the InsForge CLI.
