# InsForge Integration Guide

## Role In AgentOrg

Use InsForge as the backend platform for:

- Auth and sessions.
- Postgres persistence.
- Storage for run artifacts and generated files.
- Realtime channels for run status, trace replay, and multi-view updates.
- Edge functions or deployment environment support where useful.
- AI gateway only if we intentionally route model calls through InsForge later.

## Canonical Setup Notes

InsForge docs say agents should fetch `https://insforge.dev/skill.md` before setup. Current guidance from that file:

- Always use `npx @insforge/cli`; do not install `@insforge/cli` globally.
- For a trial backend, create one project through `POST https://api.insforge.dev/agents/v1/signup`.
- Persist `accessApiKey`, `projectUrl`, and `claimUrl`.
- Link with:

```powershell
npx @insforge/cli link --api-base-url <projectUrl> --api-key <accessApiKey>
```

- Never expose the admin `accessApiKey` in `NEXT_PUBLIC_*` or `VITE_*` variables.
- Hand the user the `claimUrl` before the 24-hour trial expires.

## Current Project Link

Use this command to link this workspace to the existing InsForge project:

```powershell
npx @insforge/cli link --project-id f0292312-e52c-4f71-9ec2-78768a630740
```

After linking, verify with:

```powershell
npx @insforge/cli current
npx @insforge/cli metadata --json
```

To write `frontend/.env.local` (URL + `ANON_KEY` + `API_KEY`) without pasting secrets by hand, from the repo:

```powershell
cd frontend
npm run env:insforge
```

## Proposed Data Model

Start with these tables. Exact SQL should be written after the app stack is created and the live InsForge schema is inspected.

- `orgs`: one row per user-created org task.
- `org_versions`: schema JSON, version number, approval status, and generated summary.
- `runs`: one row per execution attempt.
- `trace_events`: append-only stream of agent status, inputs, tool calls, outputs, and handoffs.
- `feedback`: user feedback attached to output, org, agent, edge, workflow step, or trace event.
- `agent_history`: derived or materialized history for agent behavior across versions.
- `artifacts`: stored output metadata and storage object references.

## App Environment

Frontend public values:

```text
NEXT_PUBLIC_INSFORGE_URL=<projectUrl>
NEXT_PUBLIC_INSFORGE_ANON_KEY=<anon key>
```

Server-only values:

```text
INSFORGE_URL=<projectUrl>
INSFORGE_ANON_KEY=<anon key if server uses public client>
INSFORGE_ACCESS_API_KEY=<admin/project access key, never sent to browser>
OPENAI_API_KEY=<OpenAI key>
TINYFISH_API_KEY=<TinyFish key, when web automation is enabled>
GHOST_API_KEY=<Ghost key generated with `ghost api-key create --env`>
```

## Realtime Channels

Initial channel patterns:

- `org:<orgId>` for org design events.
- `run:<runId>` for live run events.
- `agent:<agentId>` for agent-history updates if needed.

The MVP can stream directly from the app server to the browser first, then persist the same events to InsForge. InsForge realtime becomes important when multiple tabs, replay, or collaborative viewing are needed.

## Smoke Tests

Run after credentials exist:

```powershell
npx @insforge/cli current
npx @insforge/cli metadata --json
npx @insforge/cli db tables --json
npx @insforge/cli secrets list --json
```

Expected result:

- CLI is linked to the intended project.
- Metadata returns database, auth, storage, functions, AI, and realtime capabilities.
- No secrets are printed into committed files.

## Information Needed From User

- Should I create a new trial InsForge project, or will you provide an existing project?
- If existing: `projectUrl` and a project access API key for linking.
- If trial: permission to call the InsForge signup endpoint once and then give you the claim URL.
- Preferred auth behavior for the MVP: anonymous/local user, email login, OAuth, or skip auth until after the UI flow works.
