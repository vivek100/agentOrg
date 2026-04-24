import {
  createAgentTraces,
  createEmptyOrgShell,
  createEmptyRun,
  createFinalOutput,
  createOrgFixture,
} from "./mock-data";
import type { CanvasEvent, DemoState, OrgSpec, TraceEvent } from "./types";

/** When true, generation uses in-browser timers instead of `POST /api/orgs/generate` SSE. */
export function isAgentOrgOfflineMock(): boolean {
  return process.env.NEXT_PUBLIC_AGENTORG_OFFLINE_MOCK === "1";
}

export function createInitialState(task: string): DemoState {
  const org = createOrgFixture(task);

  return {
    task,
    versions: [org],
    currentVersion: 1,
    chatMessages: [
      {
        id: "user_task",
        role: "user",
        content: task,
      },
    ],
    activeTab: "design",
    visibleIds: [],
    isGenerating: true,
    isRunning: false,
  };
}

/** State for server-driven generation (empty org filled from SSE). */
export function createStreamingInitialState(task: string, version: number): DemoState {
  const org = createEmptyOrgShell(task, version);

  return {
    task,
    versions: [org],
    currentVersion: version,
    chatMessages: [
      {
        id: "user_task",
        role: "user",
        content: task,
      },
    ],
    activeTab: "design",
    visibleIds: [],
    isGenerating: true,
    isRunning: false,
  };
}

export function getCurrentOrg(state: DemoState): OrgSpec {
  return state.versions.find((version) => version.version === state.currentVersion) ?? state.versions[0];
}

function patchCurrentOrg(state: DemoState, patch: (org: OrgSpec) => OrgSpec): DemoState {
  return {
    ...state,
    versions: state.versions.map((org) =>
      org.version === state.currentVersion ? patch(org) : org,
    ),
  };
}

function pushVisible(state: DemoState, id: string): DemoState {
  if (!id || state.visibleIds.includes(id)) {
    return state;
  }
  return { ...state, visibleIds: [...state.visibleIds, id] };
}

function patchAndReveal(state: DemoState, id: string, patch: (org: OrgSpec) => OrgSpec): DemoState {
  return pushVisible(patchCurrentOrg(state, patch), id);
}

export function reduceCanvasEvent(state: DemoState, event: CanvasEvent): DemoState {
  const currentOrg = getCurrentOrg(state);

  if (event.type === "chat_delta") {
    return {
      ...state,
      chatMessages: [
        ...state.chatMessages,
        {
          id: `chat_${state.chatMessages.length}_${Date.now()}`,
          role: "agent",
          content: event.message,
        },
      ],
    };
  }

  if (event.type === "org_identity") {
    return pushVisible(
      patchCurrentOrg(state, (org) => ({
        ...org,
        id: event.orgId,
        name: event.name,
        mission: event.mission,
        tools: event.tools ?? org.tools,
      })),
      event.orgId,
    );
  }

  if (event.type === "leadership_created") {
    return patchAndReveal(state, event.node.id, (org) => ({
      ...org,
      leadership: org.leadership.some((n) => n.id === event.node.id)
        ? org.leadership
        : [...org.leadership, event.node],
    }));
  }

  if (event.type === "team_created") {
    return patchAndReveal(state, event.team.id, (org) => ({
      ...org,
      teams: org.teams.some((t) => t.id === event.team.id) ? org.teams : [...org.teams, event.team],
    }));
  }

  if (event.type === "agent_created") {
    return patchAndReveal(state, event.agent.id, (org) => ({
      ...org,
      agents: org.agents.some((a) => a.id === event.agent.id)
        ? org.agents
        : [...org.agents, event.agent],
    }));
  }

  if (event.type === "workflow_step_created") {
    return patchAndReveal(state, event.step.id, (org) => {
      const next = org.workflow.some((s) => s.id === event.step.id)
        ? org.workflow
        : [...org.workflow, event.step];
      return {
        ...org,
        workflow: [...next].sort((a, b) => a.step - b.step),
      };
    });
  }

  if (event.type === "edge_created") {
    return patchAndReveal(state, event.edge.id, (org) => ({
      ...org,
      edges: org.edges.some((e) => e.id === event.edge.id) ? org.edges : [...org.edges, event.edge],
    }));
  }

  if (event.type === "org_complete") {
    return {
      ...state,
      isGenerating: false,
      visibleIds: [
        ...state.visibleIds,
        currentOrg.id,
        ...currentOrg.leadership.map((node) => node.id),
        ...currentOrg.teams.map((team) => team.id),
        ...currentOrg.agents.map((agent) => agent.id),
        ...currentOrg.workflow.map((step) => step.id),
        ...currentOrg.edges.map((edge) => edge.id),
      ],
    };
  }

  return state;
}

export function approveCurrentOrg(state: DemoState): DemoState {
  return {
    ...state,
    versions: state.versions.map((org) =>
      org.version === state.currentVersion ? { ...org, status: "approved" } : org,
    ),
    chatMessages: [
      ...state.chatMessages,
      {
        id: `approved_${Date.now()}`,
        role: "system",
        content: `Org v${state.currentVersion} approved. The run tab is ready.`,
      },
    ],
    activeTab: "run",
  };
}

export function markCurrentVersionMain(state: DemoState): DemoState {
  return {
    ...state,
    versions: state.versions.map((org) => ({
      ...org,
      status: org.version === state.currentVersion ? "main" : org.status === "main" ? "approved" : org.status,
    })),
  };
}

export function startRun(state: DemoState): DemoState {
  return {
    ...state,
    isRunning: true,
    activeTab: "run",
    versions: state.versions.map((org) =>
      org.version === state.currentVersion
        ? {
            ...org,
            agents: org.agents.map((agent) => ({ ...agent, status: "idle" })),
            leadership: org.leadership.map((leader) => ({ ...leader, status: "idle" })),
            workflow: org.workflow.map((step) => ({ ...step, status: "pending" })),
            run: {
              ...createEmptyRun(org.version),
              id: `run_v${org.version}_${Date.now()}`,
              status: "running",
              traces: createAgentTraces(org.version),
            },
          }
        : org,
    ),
    chatMessages: [
      ...state.chatMessages,
      {
        id: `run_${Date.now()}`,
        role: "agent",
        content: "Starting the approved org. I will light up each team as work moves through it.",
      },
    ],
  };
}

export function reduceTraceEvent(state: DemoState, event: TraceEvent): DemoState {
  const currentOrg = getCurrentOrg(state);

  return {
    ...state,
    isRunning: event.type === "run_completed" ? false : state.isRunning,
    versions: state.versions.map((org) => {
      if (org.version !== currentOrg.version) {
        return org;
      }

      if (event.type === "run_started") {
        return {
          ...org,
          run: { ...org.run, status: "running", id: event.runId, activeStepId: event.stepId },
          workflow: org.workflow.map((step) => ({
            ...step,
            status: step.id === event.stepId ? "active" : "pending",
          })),
        };
      }

      if (event.type === "step_started") {
        return {
          ...org,
          run: { ...org.run, activeStepId: event.stepId },
          workflow: org.workflow.map((step) => ({
            ...step,
            status: step.id === event.stepId ? "active" : step.status === "active" ? "done" : step.status,
          })),
        };
      }

      if (event.type === "agent_queued" || event.type === "agent_started" || event.type === "agent_completed") {
        const status =
          event.type === "agent_queued" ? "queued" : event.type === "agent_started" ? "running" : "done";

        return {
          ...org,
          agents: org.agents.map((agent) =>
            agent.id === event.agentId ? { ...agent, status } : agent,
          ),
          leadership: org.leadership.map((leader) =>
            leader.id === event.agentId ? { ...leader, status } : leader,
          ),
          run: {
            ...org.run,
            status: "running",
            activeEdgeId: event.type === "agent_started" ? event.edgeId : org.run.activeEdgeId,
          },
        };
      }

      return {
        ...org,
        run: {
          ...org.run,
          status: "success",
          activeEdgeId: undefined,
          finalOutput:
            org.version > 1 ? createFinalOutput(true) : event.finalOutput,
        },
        workflow: org.workflow.map((step) => ({ ...step, status: "done" })),
      };
    }),
    chatMessages:
      event.type === "run_completed"
        ? [
            ...state.chatMessages,
            {
              id: `complete_${Date.now()}`,
              role: "agent",
              content: "Run complete. You can inspect traces, add feedback, or set this version as main.",
            },
          ]
        : state.chatMessages,
  };
}

export function createNextVersion(state: DemoState, feedback: string): DemoState {
  const nextVersion = Math.max(...state.versions.map((org) => org.version)) + 1;
  const previousOrg = getCurrentOrg(state);
  const org = isAgentOrgOfflineMock()
    ? createOrgFixture(state.task, nextVersion)
    : { ...createEmptyOrgShell(state.task, nextVersion), id: previousOrg.id };

  return {
    ...state,
    versions: [...state.versions, org],
    currentVersion: nextVersion,
    activeTab: "design",
    selectedId: undefined,
    selectedKind: undefined,
    visibleIds: [],
    isGenerating: true,
    chatMessages: [
      ...state.chatMessages,
      {
        id: `feedback_${Date.now()}`,
        role: "user",
        content: feedback,
      },
      {
        id: `iteration_${Date.now()}`,
        role: "agent",
        content:
          "Updating researcher instructions, adding LinkedIn signal checks, and tightening writer guidance.",
      },
    ],
  };
}

export function switchVersion(state: DemoState, version: number): DemoState {
  const org = state.versions.find((candidate) => candidate.version === version);

  if (!org) {
    return state;
  }

  return {
    ...state,
    currentVersion: version,
    activeTab: "design",
    selectedId: undefined,
    selectedKind: undefined,
    visibleIds: [
      org.id,
      ...org.leadership.map((node) => node.id),
      ...org.teams.map((team) => team.id),
      ...org.agents.map((agent) => agent.id),
      ...org.workflow.map((step) => step.id),
      ...org.edges.map((edge) => edge.id),
    ],
    isGenerating: false,
  };
}
