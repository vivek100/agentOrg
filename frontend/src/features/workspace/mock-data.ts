import type {
  AgentSpec,
  AgentTrace,
  CanvasEvent,
  FinalOutput,
  OrgSpec,
  TraceEvent,
} from "./types";

const tools = [
  {
    id: "tinyfish_search",
    name: "TinyFish Search",
    description: "Find high-signal company and funding sources.",
  },
  {
    id: "tinyfish_browser",
    name: "TinyFish Browser",
    description: "Open pages and extract evidence from primary sources.",
  },
  {
    id: "linkedin_signal",
    name: "LinkedIn Signals",
    description: "Mock enrichment for founder and hiring signals.",
  },
];

const baseAgents: AgentSpec[] = [
  {
    id: "agent_researcher_a",
    teamId: "team_research",
    name: "Researcher A",
    role: "Find funding and product proof for Acme AI.",
    status: "idle",
    tools: ["tinyfish_search", "tinyfish_browser"],
    resources: [{ id: "ghost_r1", label: "ghost_r1", scope: "private" }],
    promptSummary: "Extract funding, team size, product focus, and recent news.",
  },
  {
    id: "agent_researcher_b",
    teamId: "team_research",
    name: "Researcher B",
    role: "Find market signals for Northstar Labs.",
    status: "idle",
    tools: ["tinyfish_search", "tinyfish_browser"],
    resources: [{ id: "ghost_r2", label: "ghost_r2", scope: "private" }],
    promptSummary: "Prioritize evidence that can become a specific email hook.",
  },
  {
    id: "agent_researcher_c",
    teamId: "team_research",
    name: "Researcher C",
    role: "Find growth signals for VectorMind.",
    status: "idle",
    tools: ["tinyfish_search", "tinyfish_browser"],
    resources: [{ id: "ghost_r3", label: "ghost_r3", scope: "private" }],
    promptSummary: "Return concise facts with source notes for the analyst.",
  },
  {
    id: "agent_analyst",
    teamId: "team_output",
    name: "Analyst",
    role: "Synthesize research into outreach angles.",
    status: "idle",
    tools: [],
    resources: [{ id: "ghost_analyst", label: "ghost_analyst", scope: "private" }],
    promptSummary: "Rank the strongest buyer pain and proof point per startup.",
  },
  {
    id: "agent_writer",
    teamId: "team_output",
    name: "Writer",
    role: "Draft personalized cold emails.",
    status: "idle",
    tools: [],
    resources: [{ id: "emails", label: "/team/output/emails", scope: "team" }],
    promptSummary: "Write specific, concise emails. No generic openings.",
  },
];

const verifierAgent: AgentSpec = {
  id: "agent_verifier",
  teamId: "team_output",
  name: "Verifier",
  role: "Check each email for specific evidence, source fit, and non-generic hooks.",
  status: "idle",
  tools: ["tinyfish_browser", "linkedin_signal"],
  resources: [{ id: "verifier_notes", label: "/team/output/verifier", scope: "team" }],
  promptSummary: "Reject vague openings and require one company-specific trigger per email.",
};

const baseOrg = {
  id: "org_growth_research",
  name: "Growth Research Team",
  mission:
    "Research three AI startups, identify credible buying triggers, and turn them into personalized outreach.",
  leadership: [
    {
      id: "planner",
      name: "Planner",
      role: "CEO and workflow coordinator",
      status: "idle" as const,
    },
  ],
  teams: [
    {
      id: "team_research",
      name: "Research Team",
      purpose: "Collect sourced company evidence in parallel.",
      resources: [
        { id: "ghost_team_research", label: "ghost_team_research", scope: "team" as const },
        { id: "custom_files_research", label: "Research file vault", scope: "team" as const },
        { id: "tinyfish_shared", label: "TinyFish shared", scope: "team" as const },
      ],
    },
    {
      id: "team_output",
      name: "Output Team",
      purpose: "Synthesize findings and write final outreach.",
      resources: [
        { id: "ghost_team_output", label: "ghost_team_output", scope: "team" as const },
        { id: "custom_files_output", label: "Output file store", scope: "team" as const },
        { id: "shared_artifacts", label: "/org/shared", scope: "org" as const },
      ],
    },
  ],
  workflow: [
    {
      id: "step_plan",
      step: 1,
      label: "Decompose task",
      agentIds: ["planner"],
      parallel: false,
      status: "pending" as const,
    },
    {
      id: "step_research",
      step: 2,
      label: "Research startups",
      agentIds: ["agent_researcher_a", "agent_researcher_b", "agent_researcher_c"],
      parallel: true,
      status: "pending" as const,
    },
    {
      id: "step_synthesize",
      step: 3,
      label: "Synthesize angles",
      agentIds: ["agent_analyst"],
      parallel: false,
      status: "pending" as const,
    },
    {
      id: "step_write",
      step: 4,
      label: "Write outreach",
      agentIds: ["agent_writer"],
      parallel: false,
      status: "pending" as const,
    },
  ],
  edges: [
    {
      id: "edge_planner_research",
      source: "planner",
      target: "agent_researcher_a",
      label: "research brief",
      payloadSummary: "Targets, fields, and evidence requirements.",
    },
    {
      id: "edge_research_analyst",
      source: "agent_researcher_b",
      target: "agent_analyst",
      label: "sourced facts",
      payloadSummary: "Funding, hiring, product, and recent-news summaries.",
    },
    {
      id: "edge_analyst_writer",
      source: "agent_analyst",
      target: "agent_writer",
      label: "positioning angles",
      payloadSummary: "Ranked hooks and credibility points per startup.",
    },
  ],
};

/** Skeleton org filled incrementally from the generate SSE stream. */
export function createEmptyOrgShell(task: string, version: number): OrgSpec {
  return {
    id: "",
    name: "",
    mission: "",
    task,
    version,
    status: "draft",
    leadership: [],
    teams: [],
    agents: [],
    tools: [],
    workflow: [],
    edges: [],
    run: createEmptyRun(version),
    createdAt: new Date().toISOString(),
  };
}

export function createOrgFixture(task: string, version = 1): OrgSpec {
  const isV2 = version > 1;
  const agents = baseAgents.map((agent) => {
    if (!isV2 || !agent.id.startsWith("agent_researcher")) {
      return { ...agent, status: "idle" as const };
    }

    return {
      ...agent,
      status: "idle" as const,
      tools: [...agent.tools, "linkedin_signal"],
      promptSummary: `${agent.promptSummary} Always capture LinkedIn and funding-event context.`,
    };
  });
  const versionedAgents = isV2 ? [...agents, verifierAgent] : agents;
  const versionedWorkflow = isV2
    ? [
        ...baseOrg.workflow,
        {
          id: "step_verify",
          step: 5,
          label: "Verify specificity",
          agentIds: ["agent_verifier"],
          parallel: false,
          status: "pending" as const,
        },
      ]
    : baseOrg.workflow;
  const versionedEdges = isV2
    ? [
        ...baseOrg.edges,
        {
          id: "edge_writer_verifier",
          source: "agent_writer",
          target: "agent_verifier",
          label: "draft emails",
          payloadSummary: "Three drafted emails with hooks, source notes, and CTA checks.",
        },
      ]
    : baseOrg.edges;

  return {
    ...baseOrg,
    task,
    version,
    status: version === 1 ? "draft" : "draft",
    agents: versionedAgents,
    tools,
    workflow: versionedWorkflow,
    edges: versionedEdges,
    run: createEmptyRun(version),
    createdAt: new Date().toISOString(),
  };
}

export function createEmptyRun(version: number) {
  return {
    id: `run_v${version}`,
    status: "idle" as const,
    traces: createAgentTraces(version),
  };
}

export function createAgentTraces(version: number): AgentTrace[] {
  const improved = version > 1;

  return [
    {
      agentId: "planner",
      input: "Decompose the user task and route work through the org.",
      trace: improved
        ? ["parsed feedback", "added verifier checkpoint", "tightened handoff requirements"]
        : ["decomposed task", "assigned parallel research", "defined output handoff"],
      output: improved
        ? "Updated org design with verifier gate and stricter evidence requirements."
        : "Created a research-to-writing workflow with planner, research, analyst, and writer roles.",
      feedback: improved ? ["CEO/planner incorporated feedback into v2 routing."] : [],
      toolsUsed: [],
    },
    {
      agentId: "agent_researcher_a",
      input: "Find funding, team size, product focus, recent news for Acme AI.",
      trace: improved
        ? ["searched funding databases", "checked LinkedIn headcount", "opened source article"]
        : ["searched web", "opened product page", "extracted funding mention"],
      output: improved
        ? "Acme AI raised a $12M Series A and is hiring GTM engineers."
        : "Acme AI builds workflow automation for sales teams and recently raised funding.",
      feedback: improved ? ["v2 captured LinkedIn and funding event."] : [],
      toolsUsed: improved
        ? ["TinyFish Search", "TinyFish Browser", "LinkedIn Signals"]
        : ["TinyFish Search", "TinyFish Browser"],
    },
    {
      agentId: "agent_researcher_b",
      input: "Find market trigger and competitor signal for Northstar Labs.",
      trace: ["searched web", "opened launch announcement", "captured product positioning"],
      output: "Northstar Labs launched an AI analyst product for revenue teams.",
      feedback: [],
      toolsUsed: ["TinyFish Search", "TinyFish Browser"],
    },
    {
      agentId: "agent_researcher_c",
      input: "Find growth signal and buyer pain for VectorMind.",
      trace: ["searched hiring pages", "opened customer story", "summarized buyer pain"],
      output: "VectorMind is expanding support operations after landing enterprise accounts.",
      feedback: [],
      toolsUsed: ["TinyFish Search", "TinyFish Browser"],
    },
    {
      agentId: "agent_analyst",
      input: "Synthesize three research packets into strongest outreach hooks.",
      trace: ["ranked proof points", "mapped buyer pain", "prepared writer brief"],
      output: "Use funding, launch, and support scaling as the three hooks.",
      feedback: [],
      toolsUsed: [],
    },
    {
      agentId: "agent_writer",
      input: "Write three concise cold emails using analyst hooks.",
      trace: improved
        ? ["drafted event-specific hooks", "removed generic openers", "tightened CTA"]
        : ["drafted email set", "checked length", "prepared final output"],
      output: improved
        ? "Three emails with specific funding, launch, and scaling hooks."
        : "Three emails with helpful but slightly generic openings.",
      feedback: improved ? ["v2 opening hooks are stronger."] : [],
      toolsUsed: [],
    },
    ...(improved
      ? [
          {
            agentId: "agent_verifier",
            input: "Review drafted emails for evidence specificity and remove generic hooks.",
            trace: ["checked source-backed hooks", "flagged generic phrasing", "approved final set"],
            output: "All three emails include concrete company events and pass specificity checks.",
            feedback: ["Verifier added after feedback to enforce quality before final output."],
            toolsUsed: ["TinyFish Browser", "LinkedIn Signals"],
          },
        ]
      : []),
  ];
}

export function createGenerationEvents(task: string, version = 1): CanvasEvent[] {
  const org = createOrgFixture(task, version);

  return [
    { type: "chat_delta", message: "I am decomposing the task into a small operating model." },
    { type: "org_identity", orgId: org.id, name: org.name, mission: org.mission, tools: org.tools },
    { type: "chat_delta", message: "Creating a planner to coordinate handoffs and approval." },
    { type: "leadership_created", node: org.leadership[0] },
    { type: "chat_delta", message: "Creating a research team for parallel company evidence." },
    { type: "team_created", team: org.teams[0] },
    { type: "agent_created", agent: org.agents[0] },
    { type: "agent_created", agent: org.agents[1] },
    { type: "agent_created", agent: org.agents[2] },
    { type: "chat_delta", message: "Adding an output team for synthesis and writing." },
    { type: "team_created", team: org.teams[1] },
    { type: "agent_created", agent: org.agents[3] },
    { type: "agent_created", agent: org.agents[4] },
    { type: "workflow_step_created", step: org.workflow[0] },
    { type: "workflow_step_created", step: org.workflow[1] },
    { type: "workflow_step_created", step: org.workflow[2] },
    { type: "workflow_step_created", step: org.workflow[3] },
    ...(version > 1
      ? [
          { type: "chat_delta" as const, message: "Adding a verifier so feedback can be enforced before output." },
          { type: "agent_created" as const, agent: org.agents.find((agent) => agent.id === "agent_verifier")! },
          { type: "workflow_step_created" as const, step: org.workflow.find((step) => step.id === "step_verify")! },
        ]
      : []),
    { type: "edge_created", edge: org.edges[0] },
    { type: "edge_created", edge: org.edges[1] },
    { type: "edge_created", edge: org.edges[2] },
    ...(version > 1
      ? [{ type: "edge_created" as const, edge: org.edges.find((edge) => edge.id === "edge_writer_verifier")! }]
      : []),
    {
      type: "chat_delta",
      message:
        version > 1
          ? "Org v2 is ready with stronger research requirements and LinkedIn signals."
          : "Org v1 is ready. You can approve it or ask for changes.",
    },
    { type: "org_complete", orgId: org.id, version },
  ];
}

export function createTraceEvents(): TraceEvent[] {
  return [
    { type: "run_started", runId: "run_live", stepId: "step_plan" },
    { type: "agent_started", agentId: "planner" },
    { type: "agent_completed", agentId: "planner" },
    { type: "step_started", stepId: "step_research" },
    { type: "agent_queued", agentId: "agent_researcher_a" },
    { type: "agent_queued", agentId: "agent_researcher_b" },
    { type: "agent_queued", agentId: "agent_researcher_c" },
    { type: "agent_started", agentId: "agent_researcher_a", edgeId: "edge_planner_research" },
    { type: "agent_started", agentId: "agent_researcher_b", edgeId: "edge_planner_research" },
    { type: "agent_started", agentId: "agent_researcher_c", edgeId: "edge_planner_research" },
    { type: "agent_completed", agentId: "agent_researcher_a" },
    { type: "agent_completed", agentId: "agent_researcher_b" },
    { type: "agent_completed", agentId: "agent_researcher_c" },
    { type: "step_started", stepId: "step_synthesize" },
    { type: "agent_started", agentId: "agent_analyst", edgeId: "edge_research_analyst" },
    { type: "agent_completed", agentId: "agent_analyst" },
    { type: "step_started", stepId: "step_write" },
    { type: "agent_started", agentId: "agent_writer", edgeId: "edge_analyst_writer" },
    { type: "agent_completed", agentId: "agent_writer" },
    { type: "step_started", stepId: "step_verify" },
    { type: "agent_started", agentId: "agent_verifier", edgeId: "edge_writer_verifier" },
    { type: "agent_completed", agentId: "agent_verifier" },
    { type: "run_completed", finalOutput: createFinalOutput(false) },
  ];
}

export function createFinalOutput(improved: boolean): FinalOutput {
  return {
    summary: improved
      ? "Generated three sharper outreach emails with event-specific hooks and cleaner CTAs."
      : "Generated three personalized outreach emails. The structure works, but a few openers are still broad.",
    emails: [
      {
        startup: "Acme AI",
        subject: improved ? "Saw Acme AI's $12M Series A" : "Quick idea for Acme AI",
        body: improved
          ? "Congrats on the $12M Series A. Teams usually feel the research load spike right after a GTM push, so I mapped a lightweight way to turn new account signals into personal outreach."
          : "I noticed Acme AI is growing quickly and thought there may be a useful way to improve your outbound research.",
      },
      {
        startup: "Northstar Labs",
        subject: "Your AI analyst launch",
        body: "Your launch around revenue intelligence caught my eye. I put together a short idea for turning competitor and buyer signals into faster account prep.",
      },
      {
        startup: "VectorMind",
        subject: "Scaling support after enterprise wins",
        body: "Saw VectorMind expanding support operations. I had a thought on using task-specific agents to summarize customer context before every enterprise handoff.",
      },
    ],
  };
}
