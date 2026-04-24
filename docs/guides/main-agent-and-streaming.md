# Main Agent and Streaming Guide

## Decision

Use Mastra as the preferred main-agent framework and OpenAI `gpt-5.4-mini` as the target model, then stream agent and org-building events to the frontend.

Guild remains a candidate for later execution governance and hosted agent workflows, but it is not the MVP main-agent runtime. The first implementation should keep the main product loop simple:

1. User submits a task from the landing prompt.
2. Main agent streams chat text and org-design events.
3. Frontend renders chat on the left and builds the org canvas on the right.
4. User approves the org.
5. Run and trace events stream into the same canvas.

## Model Verification

Before writing model code, verify the exact model string. The Mastra skill requires checking the current provider registry after Mastra packages are installed.

Target intent:

```text
openai/gpt-5.4-mini
```

Required secret:

```text
OPENAI_API_KEY
```

Do not hardcode this key. Store it in local env files for development and in InsForge secrets or deployment environment variables for deployed code. The local `.env` can contain this key, but implementation and tests should only verify whether it is present, never print the value.

## Event Stream Contract

The frontend should consume one normalized event stream rather than mixing raw model deltas, tool logs, and persistence events directly into UI components.

Initial event types:

```json
{ "type": "chat_delta", "message": "I am designing the research team..." }
{ "type": "org_node", "node": { "id": "agent_researcher", "kind": "agent", "label": "Researcher" } }
{ "type": "org_edge", "edge": { "from": "agent_researcher", "to": "agent_writer" } }
{ "type": "org_complete", "orgId": "org_123", "version": 1 }
{ "type": "agent_status", "agentId": "agent_researcher", "status": "running" }
{ "type": "agent_input", "agentId": "agent_researcher", "input": { "target": "Acme AI" } }
{ "type": "agent_trace", "agentId": "agent_researcher", "summary": "Opened funding article" }
{ "type": "agent_output", "agentId": "agent_researcher", "output": { "funding": "$12M" } }
{ "type": "run_complete", "runId": "run_123", "finalOutput": {} }
```

## Streaming Path

Preferred first path:

1. App API route receives task or run request.
2. API route calls the main agent.
3. API route writes SSE to the browser.
4. API route persists durable state to InsForge.
5. InsForge realtime can replay or broadcast persisted run events to other views later.

This keeps the MVP easier to debug than pushing every event through backend realtime first.

## Main Agent Responsibilities

- Turn a user task into an org schema.
- Explain design decisions in chat-friendly language.
- Emit canvas events as the schema is built.
- Respect user requested changes before approval.
- Convert feedback into the next org version.
- Avoid running external tools during design unless the user explicitly asks for research before design.

## Mastra vs Guild

Current decision:

- **Use Mastra** for the main agent, org-builder, and frontend streaming path.
- **Do not use Guild** for the first UI/agent-builder loop.
- Revisit Guild after the event contract, org schema, run traces, and feedback loop work end to end.

Guild may still be useful later for packaged execution agents, hosted sessions, credentials, governance, or observability. It should be introduced as an adapter behind the runtime boundary, not as a dependency baked into the canvas UI.

## What Not To Put In The Main Agent

- UI state management.
- Direct DOM/canvas rendering concerns.
- Raw database writes from deep inside agent tools.
- Long-term execution scheduling.
- Secrets in prompts or generated schemas.

## First Smoke Test

Once a frontend/backend skeleton exists:

1. Set `OPENAI_API_KEY`.
2. Verify the Mastra model string through the provider registry.
3. Send task: `Research 3 AI startups and write cold outreach emails`.
4. Confirm the browser receives `chat_delta`, `org_node`, and `org_complete`.
5. Confirm the canvas builds incrementally without waiting for the final schema.
