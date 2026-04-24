# Tool References And Integration Direction

This file is the source list for tools we plan to use. Detailed guides now live under `docs/guides/`, and cloned upstream repos live under `references/`.

## Current Priority

First solve the UI, agent builder, and streaming flow:

1. Landing prompt.
2. Single workspace.
3. Agent chat streams on the left.
4. Canvas streams org design on the right.
5. User approves the org.
6. Run, traces, agent history, feedback, and iteration happen in the same workspace.

## Main Agent

Preferred direction:

- Use Mastra for the main agent and streaming adapter.
- Use OpenAI `gpt-5.4-mini` as the target model after model access is verified.
- Stream normalized events to the frontend instead of coupling UI components to raw model/tool output.
- Treat Guild as deferred. It should not block the MVP UI or main-agent builder.

Alternative:

- Use Guild later for hosted agent execution, governance, and observability if it fits the runtime after the UI and schema contracts stabilize.

Guide:

- `docs/guides/main-agent-and-streaming.md`

## InsForge

Use InsForge for backend, database, auth, storage, realtime, functions, and deployment support.

Docs:

- `https://docs.insforge.dev/introduction`
- `https://insforge.dev/skill.md`

Reference repos:

- `references/InsForge`
- `references/insforge-skills`

Guide:

- `docs/guides/insforge.md`

## Guild

Use Guild as an optional later execution/observability layer, not the first UI dependency.

Docs:

- [Commands](https://docs.guild.ai/cli/commands.md)
- [CLI reference](https://docs.guild.ai/cli/getting-started.md)
- [Guild CLI](https://docs.guild.ai/cli/introduction.md)
- [Auto-managed state agents](https://docs.guild.ai/guide/coded-agents.md)
- [LLM agents](https://docs.guild.ai/guide/llm-agents.md)
- [LLMs](https://docs.guild.ai/guide/llms.md)
- [Agent SDK](https://docs.guild.ai/guide/sdk-introduction.md)
- [Self-managed state agents](https://docs.guild.ai/guide/self-managed-agents.md)
- [State](https://docs.guild.ai/guide/state.md)
- [Tasks](https://docs.guild.ai/guide/tasks.md)
- [Versions](https://docs.guild.ai/guide/versions.md)
- [Introduction](https://docs.guild.ai/index.md)
- [Quickstart](https://docs.guild.ai/quickstart.md)
- [Task object](https://docs.guild.ai/sdk/task-object.md)
- [Tool sets](https://docs.guild.ai/sdk/tools.md)
- [Create an Integration](https://docs.guild.ai/services/create-an-integration.md)

Guide:

- `docs/guides/external-tools.md`

## Chainguard

Use Chainguard for secure containers and optional hardened libraries.

Reference repo:

- `references/cgstart`

Guide:

- `docs/guides/external-tools.md`

## Ghost DB

Use Ghost for ephemeral per-agent Postgres databases and database forks. Ghost is CLI/MCP-first for our needs; there is no frontend setup required.

Docs:

- `https://ghost.build/docs/`
- `https://ghost.build/learn/`

Local reference:

- `references/ghost/agents.txt`

Key setup:

- Run `ghost login`.
- Generate a non-interactive key with `ghost api-key create --name "agentorg-dev" --env`.
- Store the returned `GHOST_API_KEY` in local `.env` or deployment secrets.

Guide:

- `docs/guides/external-tools.md`

## TinyFish

Use TinyFish for browser automation and web research agents.

Reference repo:

- `references/tinyfish-skills`

Guide:

- `docs/guides/external-tools.md`

## Smoke Tests

See `docs/guides/tool-smoke-tests.md` for current local readiness, required credentials, and safe test order.

## Implementation Plan

See `docs/plans/integration_implementation_plan.md`.
