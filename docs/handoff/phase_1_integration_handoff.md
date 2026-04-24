# Phase 1 Integration Handoff (Post–UI Prototype)

## Purpose

Use this handoff to start a fresh implementation chat for the **next slice of work** after the UI-first mock prototype: completing **Phase 1** as defined in `docs/plans/integration_implementation_plan.md`—real **Mastra** org generation, **InsForge** persistence, **SSE (or equivalent) streaming** APIs, and wiring the existing `frontend/` to those backends—without starting **Phase 2** (Ghost, TinyFish), **Phase 3** (Guild), or **Phase 4** (Chainguard story) yet.

The mock frontend already proves the product loop. This phase replaces fixtures with durable contracts, stored artifacts, and a real main agent.

## What Already Exists (Do Not Rebuild From Scratch)

- **App:** `frontend/` — Next.js + TypeScript + Tailwind + React Flow.
- **UX:** Landing prompt → workspace (chat left, canvas right), compact overlay controls, contextual detail panel on selection, approve / run / traces / history / version / set main (mock timers and in-memory state).
- **Reference handoff:** `docs/handoff/frontend_phase_1_handoff.md` — original Phase 1 UI contract and mock flow description.
- **Product and API intent:** `docs/ai_orgs_spec_v2.md`, `docs/ai_orgs_ui_ux_spec.md`.
- **Stack direction:** `docs/guides/main-agent-and-streaming.md`, `docs/guides/insforge.md`, `docs/guides/external-tools.md`.

**Note:** `docs/plans/integration_implementation_plan.md` still says the repo is documentation-only; that paragraph is **stale** now that `frontend/` exists. Update it when convenient so future readers are not misled.

## Phase Boundary (Critical)

### In scope for this handoff

Aligned with plan sub-phases **1A (contracts)**, **1C (Mastra + streaming)**, **1D (InsForge)**, and enough of **1E / 1F** that the same UI loop runs on **persisted** data:

- Harden and centralize **TypeScript contracts** for `OrgSpec`, versions, runs, trace events, feedback targets, and canvas stream events (single module used by API + UI).
- Implement **Next.js Route Handlers** (or app server modules) for the Phase 1 API surface described in the plan and UI spec (generate, approve, run, run stream, run detail, feedback → new version, history, set main).
- **Mastra** main agent: task → structured org design, stream **chat deltas** and **canvas events**; validate or repair model output before emitting to the client.
- **InsForge:** link project, migrations/tables for orgs, versions, runs, trace events (append-only), feedback, final outputs; all mutations go through server code (no secrets in the browser).
- **Frontend wiring:** replace timer-based mock streams in `frontend/src/features/workspace/use-agent-org-demo.ts` (and related mock modules) with `fetch` + **SSE** (or chunked JSON) consumers that feed the **same** reducer/event shapes the UI already expects—or evolve types once in the shared contract module.

### Explicitly out of scope until Phase 1 acceptance is met

- **Ghost** and **TinyFish** (Phase 2).
- **Guild** as execution layer (Phase 3).
- **Chainguard** narrative and dependency hardening (Phase 4).

## Goals (Done When)

Mirror **Phase 1 acceptance** in `docs/plans/integration_implementation_plan.md`:

- A user can complete the full loop on **real persisted data**: task → streamed org → approve → run → trace inspection → feedback → new version → run → set main.
- **Trace events** are the source of truth for live animation and replay (even if agent bodies are still simple Mastra steps in Phase 1).
- **API contracts** are stable enough that Phase 2 can add tool providers without redesigning the canvas.
- The demo still works **without** Ghost, TinyFish, Guild, or Chainguard in the critical path.

## Prerequisites

1. **OpenAI:** Confirm access and behavior for `gpt-5.4-mini` (or the model you standardize on); document env var names in `frontend/.env.example` and root docs if needed.
2. **InsForge:** Complete `npx @insforge/cli link` for the target project (see plan for example `link` command); store credentials server-side only.
3. **Local dev:** PowerShell-friendly scripts documented in `README.md` (`cd frontend`, `npm run dev`, plus any new `npm run` for db migrate or codegen).

## Recommended Build Order

1. **Contracts (1A)**  
   - Add something like `frontend/src/lib/contracts/` (or a small `packages/shared` workspace if you split app later) exporting Zod or TypeScript types + parsers for: org version, run, trace event, canvas event, feedback payload.  
   - Align field names with `docs/ai_orgs_ui_ux_spec.md` **and** the shapes already used in `frontend/src/features/workspace/types.ts`—minimize UI churn.

2. **API skeleton**  
   - Implement routes with **auth stub** or session later; first milestone is happy-path + validation errors.  
   - Return stable error JSON for parse failures and model repair failures.

3. **Mastra generate stream (1C)**  
   - `POST /api/orgs/generate` (or namespaced equivalent) emits SSE: `chat_delta`, canvas events, then `org_complete` with persisted org id/version.  
   - Server validates partial graph updates so the canvas never receives impossible edges.

4. **InsForge persistence (1D)**  
   - Write org + version on complete; append trace events on run; store feedback and link to targets; `set main` updates version row(s).  
   - `GET /api/orgs/:orgId/history` (or equivalent) drives version list and agent history summaries.

5. **Run + stream (1E)**  
   - `POST /api/orgs/:orgId/run` creates run, returns `runId`.  
   - `GET /api/runs/:runId/stream` pushes trace events the UI already animates on.  
   - Optionally keep a thin “simulated agent” executor behind an interface so TinyFish/Ghost can replace implementations in Phase 2 without changing the stream contract.

6. **Feedback + versioning (1F)**  
   - `POST /api/feedback` accepts targets from the spec; triggers regeneration stream for `version+1`.  
   - Ensure runs are tied to `orgId` + `version` in the DB.

7. **Frontend swap**  
   - Replace mock hook with a thin client that: opens SSE, parses events, dispatches to existing reducers where possible.  
   - Keep overlay/detail UX; add loading and reconnect states.

8. **Tests**  
   - Contract/parser tests, API integration tests (with test DB or InsForge test project), and at least one E2E path: generate → approve → run → feedback → second version.

## API Surface (Align With Plan + UI Spec)

Implement server routes to match (names can be adjusted if you namespace under `/api/v1`, but keep semantics):

| Intent | Suggested route | Notes |
|--------|-----------------|--------|
| Generate org from task | `POST /api/orgs/generate` | SSE: chat + canvas events |
| Approve version | `POST /api/orgs/:orgId/approve` | Body includes version |
| Set main version | `POST /api/orgs/:orgId/versions/:version/main` | |
| Start run | `POST /api/orgs/:orgId/run` | Returns `runId` |
| Stream run | `GET /api/runs/:runId/stream` | SSE trace events |
| Run detail | `GET /api/runs/:runId` | Full trace + output + feedback |
| Feedback | `POST /api/feedback` | May stream org regen |
| History | `GET /api/orgs/:orgId/history` | Versions, runs, feedback summaries |

The mock handoff used `/api/mock/...`; **either** migrate the frontend to the real paths above **or** keep mock routes as a feature flag only for demos—pick one strategy and document it in `README.md`.

## Mastra Notes

- Follow `docs/guides/main-agent-and-streaming.md` for agent layout, streaming, and tool boundaries.
- Main agent responsibilities: decompose task, propose org structure, emit **incremental** canvas events (not one giant blob at the end), handle “request changes” chat messages before approval.
- Keep a strict **server-side** schema gate: invalid structures never reach the client.

## InsForge Notes

- Follow `docs/guides/insforge.md` for project layout, migrations, and optional realtime later.
- Persist enough to **replay** a run from stored trace events alone.
- Link command example already lives in the integration plan (Phase 1D); rotate or redact project IDs in docs if you publish publicly.

## Frontend Integration Touchpoints

Likely files to evolve (paths may shift slightly):

- `frontend/src/features/workspace/use-agent-org-demo.ts` — replace mock timers with real API + SSE.
- `frontend/src/features/workspace/event-reducer.ts` — align event types with shared contracts.
- `frontend/src/features/workspace/mock-data.ts` — demote to **tests only** or delete once fixtures move to `__tests__/fixtures`.
- `frontend/src/features/canvas/OrgCanvas.tsx` — minimal changes if contracts stay stable; add connection/error UI.

## Phase 2 Gate (When This Handoff Is “Complete”)

Do **not** start `docs/plans/integration_implementation_plan.md` **Phase 2** until:

- Phase 1 acceptance criteria above are true on **real** data.
- At least one full loop is reproducible on a clean machine using documented env setup.
- Trace stream and persistence are trustworthy enough to attach **real** TinyFish and Ghost events later without renaming everything.

Then open a new handoff: “Phase 2 — Ghost + TinyFish” using plan section **Phase 2** as the source of truth.

## Suggested First Task In The Next Chat

> “Introduce `frontend/src/lib/contracts` (or shared package), mirror `types.ts` + plan schemas, add Zod parse on the server for Mastra output, and implement `POST /api/orgs/generate` SSE that persists org v1 to InsForge on `org_complete`—then swap the landing → workspace flow to call it instead of mock fixtures.”

## Reference Index

| Doc | Use |
|-----|-----|
| `docs/plans/integration_implementation_plan.md` | Phase 1A–1F breakdown and acceptance |
| `docs/ai_orgs_ui_ux_spec.md` | UX + API naming intent |
| `docs/handoff/frontend_phase_1_handoff.md` | Original UI-first mock scope |
| `docs/guides/main-agent-and-streaming.md` | Mastra direction |
| `docs/guides/insforge.md` | Backend persistence |
| `docs/guides/external-tools.md` | Phase 2+ tools (defer) |

---

*End of Phase 1 integration handoff*
