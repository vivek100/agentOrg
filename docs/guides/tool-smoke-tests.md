# Tool Smoke Test Matrix

This file tracks safe checks we can run before full implementation.

## Current Local Preflight

Ran safe local checks without calling paid/authenticated APIs. A local `.env` file may contain secrets, but secrets are not read or printed in this doc.

| Tool | Status |
| --- | --- |
| Node | Installed: `v22.22.0` |
| npm | Installed: `10.9.2` |
| Docker | Installed: `Docker version 26.0.0` |
| Git | Installed: `git version 2.45.0.windows.1` |
| SSH | Installed: OpenSSH for Windows |
| Ghost CLI | Installed: `v0.4.5` |
| Guild CLI | Not installed |
| chainctl | Not installed |
| `OPENAI_API_KEY` | Expected in local `.env`; verify by loading env before model smoke tests |
| `TINYFISH_API_KEY` | Expected in local `.env`; verify by loading env before TinyFish smoke tests |
| `GHOST_API_KEY` | Not set |

## Required Secrets And Logins

| Integration | Needed From User | Why |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY` with access to `gpt-5.4-mini` | Main agent and org builder |
| InsForge | Permission to create trial project, or existing `projectUrl` plus access API key | Backend, auth, DB, storage, realtime |
| TinyFish | `TINYFISH_API_KEY` | Web research/browser automation agents |
| Ghost | `ghost login`, then `ghost api-key create --env` to produce `GHOST_API_KEY` | Ephemeral Postgres DB creation/forking |
| Chainguard Libraries | Free Chainguard account/org and pull token | Hardened package registry |
| Guild | Guild account/login if we use Guild | Hosted agent workflows and governance |

## Smoke Test Order

Run these in order as implementation reaches each boundary.

### 1. OpenAI / Main Agent

```powershell
$env:OPENAI_API_KEY = "<provided-secret>"
```

If the key is in local `.env`, load it into the current shell before running the smoke test. Do not print the value.

After Mastra is installed, verify the model through Mastra's provider registry before using `openai/gpt-5.4-mini`.

Pass condition:

- A local endpoint streams `chat_delta`, `org_node`, and `org_complete` for one task.

### 2. InsForge

```powershell
npx @insforge/cli current
npx @insforge/cli metadata --json
```

Pass condition:

- CLI is linked.
- Metadata loads.
- App can write and read one test org row.

### 3. TinyFish

```powershell
if ($env:TINYFISH_API_KEY) { "TINYFISH_API_KEY is set" } else { "TINYFISH_API_KEY is NOT set" }
```

If the key is in local `.env`, load it into the current shell before running the smoke test. Do not print the value.

Authenticated call:

```powershell
curl.exe -N -s -X POST "https://agent.tinyfish.ai/v1/automation/run-sse" `
  -H "X-API-Key: $env:TINYFISH_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{ "url": "https://example.com", "goal": "Extract page title as JSON: {\"title\": str}" }'
```

Pass condition:

- Final SSE result contains completed JSON.
- Trace event persists URL, goal, and result summary.

### 4. Ghost

```powershell
ghost version
ghost login
ghost api-key create --name "agentorg-dev" --env
ghost create
ghost list
```

Pass condition:

- A Ghost API key can be generated via CLI.
- A throwaway DB can be created, listed, connected, forked, and deleted.
- The server runtime can use `GHOST_API_KEY` without requiring a frontend flow.

### 5. Chainguard

No-auth container check:

```powershell
docker pull chainguard/node:latest
```

Libraries check after free account setup:

```powershell
chainctl version
chainctl auth login
chainctl libraries entitlements create --ecosystems=JAVASCRIPT
```

Pass condition:

- Public Node image pulls.
- If using Libraries, package install works with pull token.

Note: Chainguard says both Containers and Libraries are free for individual developers. The practical setup difference is that public container image pulls can be tested without auth, while Libraries use authenticated registry access through a free account/org and pull token.

### 6. Guild

Only run if Guild becomes part of the execution layer. Current plan is Mastra for the MVP main agent and streaming path.

```powershell
npm install -g @guildai/cli
guild auth login
guild auth status
guild doctor
```

Pass condition:

- CLI authenticates and doctor passes.

## Safety Rules

- Do not commit `.env`, `.env.local`, API keys, Ghost connection strings, InsForge access API keys, or Chainguard pull tokens.
- Do not run destructive Ghost or InsForge delete commands against non-test resources.
- Do not call InsForge trial signup more than once for the same project attempt.
- Do not call paid APIs in loops without explicit approval.
