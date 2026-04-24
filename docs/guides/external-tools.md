# External Tool Integration Guide

This guide covers tools that support the AI org runtime but should not block the first UI and agent-builder pass.

## TinyFish

Use TinyFish for web research and browser automation agents.

Reference:

- `references/tinyfish-skills/skills/tinyfish-web-agent/SKILL.md`
- `references/tinyfish-skills/skills/tunneling/SKILL.md`

Required secret:

```text
TINYFISH_API_KEY
```

API shape:

```powershell
curl.exe -N -s -X POST "https://agent.tinyfish.ai/v1/automation/run-sse" `
  -H "X-API-Key: $env:TINYFISH_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{ "url": "https://example.com", "goal": "Extract page title as JSON: {\"title\": str}" }'
```

AgentOrg usage:

- Research agents call TinyFish through server-side tools only.
- Agent schemas should declare TinyFish capability, not store the API key.
- Trace events should capture URL, goal, status, cost if returned, and result summary.

Smoke test:

1. Confirm `$env:TINYFISH_API_KEY` is set.
2. Run the example extraction against `https://example.com`.
3. Confirm the final SSE event includes completed JSON output.

## Ghost DB

Use Ghost for ephemeral Postgres databases where we need private agent workspaces, forks, and disposable state.

Reference:

- `https://ghost.build/docs/`
- `references/ghost/agents.txt`

Local status:

- Ghost CLI is installed: `ghost version` returned `v0.4.5`.

Required login/key setup:

- Ghost is CLI/MCP-first. There is no frontend integration required for AgentOrg's MVP.
- First authenticate with GitHub OAuth:

```powershell
ghost login
```

- Then create an API key through the CLI for non-interactive app/server usage:

```powershell
ghost api-key create --name "agentorg-dev" --env
```

- Store the returned value as:

```text
GHOST_API_KEY=<generated key>
```

- Do not commit the key. Keep it in local `.env` and deployment secrets.

AgentOrg usage:

- Create private DBs for agents that need isolated scratch space.
- Fork from team/org DBs when an agent needs a copy of shared state.
- Store Ghost database IDs and connection metadata in InsForge, not in frontend state.
- Prefer the CLI/API key path for the server runtime. MCP can be useful for local development and debugging but should not be required by the production app path.

Smoke tests:

```powershell
ghost login
ghost api-key create --name "agentorg-dev" --env
ghost create
ghost list
ghost connect <database-name-or-id>
ghost fork <database-name-or-id>
ghost delete <database-name-or-id>
```

Deletion is destructive, so use throwaway test DB names.

## Chainguard

Use Chainguard for hardened runtime dependencies and optional container images.

Reference:

- `references/cgstart/chainguard-setup.md`

Local status:

- `chainctl` is not installed in this shell.
- Docker is available.
- User has created a Chainguard account.

Fast path:

- Public container images can be used without account setup.
- Libraries are free for individual developers, but still require free account/org setup and a pull token.
- So the distinction is not paid vs free. It is no-auth public image pulls vs authenticated package registry access.

PowerShell-friendly checks:

```powershell
docker pull chainguard/node:latest
docker pull chainguard/python:latest
```

Free account setup needed for Libraries:

1. Create Chainguard account and org. Account is created; org status still needs verification.
2. Install `chainctl`.
3. Run `chainctl auth login`.
4. Create library entitlements.
5. Create pull token.
6. Store token outside source control.

AgentOrg usage:

- Use Chainguard Node image for deployed Node services if/when we containerize.
- Use Chainguard Python packages only if we introduce Python agent workers.
- Do not make Chainguard a blocker for the UI-first MVP.

## Guild

Use Guild later if we want hosted agent sessions, versioned agents, governance, or workspace credentials.

Reference:

- `https://docs.guild.ai/quickstart.md`
- `docs/tools.md` contains the broader Guild docs index.

Local status:

- Guild CLI is not installed in this shell.

Required login:

```powershell
npm install -g @guildai/cli
guild auth login
guild auth status
```

AgentOrg usage options:

- Option A, current plan: do not use Guild in MVP; Mastra + app server owns the main-agent loop.
- Option B: use Guild for packaged execution agents after UI and org schema contracts stabilize.
- Option C: use Guild as an observability/versioning layer for agents if its runtime fits the org execution model.

Smoke test after install:

```powershell
guild auth status
guild doctor
```

Decision for now: use Mastra for the main agent and streaming path. Keep Guild as optional later infrastructure, not as the first agent builder/runtime dependency.
