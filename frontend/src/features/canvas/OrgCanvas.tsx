"use client";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  BadgeCheck,
  Bot,
  Check,
  CircleDot,
  Crown,
  FlaskConical,
  Folder,
  GitBranch,
  Play,
  Plus,
  RadioTower,
  RotateCcw,
  Sparkles,
  Tags,
  Wrench,
  type LucideIcon,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { CanvasTab, OrgSpec, ResourceScope, SelectionKind } from "../workspace/types";

type BadgeVariant = "tool" | "path" | "resource" | "tag";

type OrgNodeData = Record<string, unknown> & {
  title: string;
  subtitle: string;
  kind: "org" | "leader" | "team" | "agent";
  status?: string;
  badges?: string[];
  /** Classified chips (tools vs paths vs identities). */
  badgeItems?: Array<{ label: string; variant: BadgeVariant }>;
  scopes?: ResourceScope[];
  selected?: boolean;
  onSelect?: () => void;
};

type OrgFlowNode = Node<OrgNodeData, "orgNode">;

const nodeTypes = {
  orgNode: OrgNode,
};

interface OrgCanvasProps {
  org: OrgSpec;
  activeTab: CanvasTab;
  visibleIds: string[];
  selectedId?: string;
  selectedKind?: SelectionKind;
  isGenerating: boolean;
  isRunning: boolean;
  versions: OrgSpec[];
  currentVersion: number;
  onTabChange: (tab: CanvasTab) => void;
  onSelect: (kind: SelectionKind, id: string) => void;
  onApprove: () => void;
  onRun: () => void;
  onFeedback: (message: string) => void;
  onReset: () => void;
  onMarkMain: () => void;
  onVersion: (version: number) => void;
}

export function OrgCanvas({
  org,
  activeTab,
  visibleIds,
  selectedId,
  selectedKind,
  isGenerating,
  isRunning,
  versions,
  currentVersion,
  onTabChange,
  onSelect,
  onApprove,
  onRun,
  onFeedback,
  onReset,
  onMarkMain,
  onVersion,
}: OrgCanvasProps) {
  const selectedAgent = org.agents.find((agent) => agent.id === selectedId);
  const selectedTrace = org.run.traces.find((trace) => trace.agentId === selectedId);
  const selectedTeam = org.teams.find((team) => team.id === selectedId);
  const selectedStep = org.workflow.find((step) => step.id === selectedId);
  const [feedback, setFeedback] = useState("The email hooks are too generic. Use funding events.");
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const handleSelect = useCallback((kind: SelectionKind, id: string) => {
    setInspectorOpen(true);
    onSelect(kind, id);
  }, [onSelect]);

  const { nodes, edges } = createFlowElements(org, visibleIds, selectedId, handleSelect);

  function submitFeedback() {
    onFeedback(feedback);
    setFeedback("");
  }

  return (
    <section className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-black/25 backdrop-blur">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.4,
              maxZoom: 0.5,
              minZoom: 0.18,
            }}
            minZoom={0.18}
            maxZoom={1.35}
            defaultEdgeOptions={{
              type: "smoothstep",
              zIndex: 8,
              interactionWidth: 32,
            }}
            proOptions={{ hideAttribution: true }}
            className="org-flow [&_.react-flow__edge-path]:drop-shadow-[0_0_6px_rgba(34,211,238,0.25)]"
          >
            <Background color="rgba(148,163,184,0.16)" gap={22} />
            <Controls className="!border-white/10 !bg-slate-900/80 !text-white" />
          </ReactFlow>

          <WorkflowRail org={org} visibleIds={visibleIds} onSelect={handleSelect} />

      <div className="absolute left-3 top-3 max-w-xl rounded-lg border border-white/10 bg-slate-950/78 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <p className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-xs font-semibold text-cyan-100">
            AgentOrg
          </p>
          <p className="truncate text-sm font-semibold text-white">{org.name}</p>
          <span className={statusClass(org.status)}>{org.status}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">{org.task}</p>
      </div>

      <CanvasCommandBar
        activeTab={activeTab}
        org={org}
        versions={versions}
        currentVersion={currentVersion}
        isGenerating={isGenerating}
        isRunning={isRunning}
        onTabChange={onTabChange}
        onApprove={onApprove}
        onRun={onRun}
        onSelectOutput={() => handleSelect("output", "final_output")}
        onMarkMain={onMarkMain}
        onVersion={onVersion}
        onReset={onReset}
        onOpenHistory={() => {
          onTabChange("history");
          setInspectorOpen(true);
        }}
      />

      <div className="absolute left-3 top-20 rounded-lg border border-white/10 bg-slate-950/72 px-3 py-2 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {activeTab === "design"
                ? "Design Canvas"
                : activeTab === "run"
                  ? "Live Run"
                  : activeTab === "traces"
                    ? "Trace Replay"
                    : "Agent History"}
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-300">
              {activeTab === "traces"
                ? "Click an agent, team, edge, or workflow step to inspect it."
                : isGenerating
                  ? "Streaming org structure into the canvas."
                  : "Use the top controls to approve, run, inspect, and iterate."}
            </p>
      </div>

      {activeTab === "traces" && (
        <TraceReplayBar
          org={org}
          visibleIds={visibleIds}
          onSelect={(kind, id) => handleSelect(kind, id)}
        />
      )}

      {activeTab === "run" && org.run.finalOutput && (
        <RunOutputDock org={org} onSelectOutput={() => handleSelect("output", "final_output")} />
      )}

      {inspectorOpen && (
        <InspectorPanel
          org={org}
          activeTab={activeTab}
          selectedId={selectedId}
          selectedKind={selectedKind}
          selectedAgent={selectedAgent}
          selectedTeam={selectedTeam}
          selectedStep={selectedStep}
          selectedTrace={selectedTrace}
          feedback={feedback}
          setFeedback={setFeedback}
          submitFeedback={submitFeedback}
          onClose={() => setInspectorOpen(false)}
        />
      )}
    </section>
  );
}

function CanvasCommandBar({
  activeTab,
  org,
  versions,
  currentVersion,
  isGenerating,
  isRunning,
  onTabChange,
  onApprove,
  onRun,
  onSelectOutput,
  onMarkMain,
  onVersion,
  onReset,
  onOpenHistory,
}: {
  activeTab: CanvasTab;
  org: OrgSpec;
  versions: OrgSpec[];
  currentVersion: number;
  isGenerating: boolean;
  isRunning: boolean;
  onTabChange: (tab: CanvasTab) => void;
  onApprove: () => void;
  onRun: () => void;
  onSelectOutput: () => void;
  onMarkMain: () => void;
  onVersion: (version: number) => void;
  onReset: () => void;
  onOpenHistory: () => void;
}) {
  const canRun = org.status === "approved" || org.status === "main";
  const tabs: Array<[CanvasTab, LucideIcon, string]> = [
    ["design", GitBranch, "Design"],
    ["run", RadioTower, "Run"],
    ["traces", FlaskConical, "Traces"],
    ["history", Sparkles, "History"],
  ];

  return (
    <div className="absolute right-3 top-3 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-2">
      <div className="flex rounded-lg border border-white/10 bg-slate-950/78 p-1 backdrop-blur">
        {tabs.map(([tab, Icon, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => (tab === "history" ? onOpenHistory() : onTabChange(tab))}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition",
              activeTab === tab ? "bg-white text-slate-950" : "text-slate-400 hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <select
        value={currentVersion}
        onChange={(event) => onVersion(Number(event.target.value))}
        className="h-10 rounded-lg border border-white/10 bg-slate-950/78 px-3 text-xs font-medium text-white outline-none backdrop-blur"
        aria-label="Version selector"
      >
        {versions.map((version) => (
          <option key={version.version} value={version.version}>
            v{version.version} · {version.status}
          </option>
        ))}
      </select>

      {org.status === "draft" ? (
        <button
          type="button"
          onClick={onApprove}
          disabled={isGenerating}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-300 px-3 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <BadgeCheck className="h-4 w-4" />
          Approve
        </button>
      ) : (
        <button
          type="button"
          onClick={onRun}
          disabled={!canRun || isRunning}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Running" : "Run"}
        </button>
      )}

      {org.run.finalOutput && (
        <button
          type="button"
          onClick={onSelectOutput}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/50"
        >
          Output
        </button>
      )}

      <button
        type="button"
        onClick={onMarkMain}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 text-xs font-medium text-emerald-100 transition hover:border-emerald-300/50"
      >
        <Crown className="h-4 w-4" />
        Main
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/78 px-3 text-xs font-medium text-slate-200 transition hover:bg-white hover:text-slate-950"
      >
        <RotateCcw className="h-4 w-4" />
        New
      </button>
    </div>
  );
}

function InspectorPanel({
  org,
  activeTab,
  selectedId,
  selectedKind,
  selectedAgent,
  selectedTeam,
  selectedStep,
  selectedTrace,
  feedback,
  setFeedback,
  submitFeedback,
  onClose,
}: {
  org: OrgSpec;
  activeTab: CanvasTab;
  selectedId?: string;
  selectedKind?: SelectionKind;
  selectedAgent?: OrgSpec["agents"][number];
  selectedTeam?: OrgSpec["teams"][number];
  selectedStep?: OrgSpec["workflow"][number];
  selectedTrace?: OrgSpec["run"]["traces"][number];
  feedback: string;
  setFeedback: (value: string) => void;
  submitFeedback: () => void;
  onClose: () => void;
}) {
  const fallbackTrace = org.run.status !== "idle" ? org.run.traces[0] : undefined;
  const trace = selectedTrace ?? fallbackTrace;
  const traceAgent = org.agents.find((agent) => agent.id === trace?.agentId);

  return (
    <aside className="scrollbar-clean absolute bottom-16 right-3 top-16 z-20 w-[360px] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/92 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="sticky -top-4 z-10 -mx-4 mb-4 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {selectedKind ?? activeTab}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {selectedAgent?.name ??
              selectedTeam?.name ??
              selectedStep?.label ??
              traceAgent?.name ??
              (selectedKind === "output" ? "Final Output" : "Agent History")}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:bg-white hover:text-slate-950"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {selectedKind === "output" && org.run.finalOutput ? (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-slate-300">{org.run.finalOutput.summary}</p>
          {org.run.finalOutput.emails.map((email) => (
            <div key={email.startup} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                {email.startup}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{email.subject}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{email.body}</p>
            </div>
          ))}
          <FeedbackBox value={feedback} setValue={setFeedback} onSubmit={submitFeedback} disabled={false} />
        </div>
      ) : selectedTeam ? (
        <div className="space-y-3">
          <TraceBlock label="Purpose" lines={[selectedTeam.purpose]} />
          <TraceBlock label="Shared Resources" lines={selectedTeam.resources.map((resource) => `${resource.label} (${resource.scope})`)} />
        </div>
      ) : selectedStep ? (
        <div className="space-y-3">
          <TraceBlock label="Workflow Step" lines={[`Step ${selectedStep.step}: ${selectedStep.label}`, selectedStep.parallel ? "Runs in parallel." : "Runs sequentially."]} />
          <TraceBlock label="Agents" lines={selectedStep.agentIds} />
        </div>
      ) : activeTab === "history" && !selectedId ? (
        <HistoryPanel org={org} />
      ) : trace ? (
        <div className="space-y-3">
          <TraceBlock label="Input" lines={[trace.input]} />
          <TraceBlock label="Tools Used" lines={trace.toolsUsed.length ? trace.toolsUsed : ["No tools used."]} />
          <TraceBlock label="Trace" lines={trace.trace} />
          <TraceBlock label="Output" lines={[trace.output]} />
          <TraceBlock label="Feedback" lines={trace.feedback.length ? trace.feedback : ["No feedback yet."]} />
          <FeedbackBox value={feedback} setValue={setFeedback} onSubmit={submitFeedback} disabled={false} />
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm leading-6 text-slate-300">
            Click an agent, team, output, or workflow step to inspect it here.
          </p>
        </div>
      )}
    </aside>
  );
}

/**
 * Team bounding boxes (canvas coords). Agent cards are anchored to the **bottom** of this
 * rectangle so they never stack on top of the team title / purpose text (siblings, z-index 10).
 */
const DEFAULT_TEAM_BOX: { w: number; h: number } = { w: 460, h: 332 };

/** Layout band reserved under team header; keep in sync with agent card max-height below. */
const AGENT_CARD_HEIGHT = 196;

/** Research team on top; output team stacked below for clearer flow and edge routing. */
const KNOWN_TEAM_LAYOUT: Record<string, { x: number; y: number; w: number; h: number }> = {
  team_research: { x: 72, y: 232, w: 920, h: 332 },
  team_output: { x: 260, y: 598, w: 680, h: 332 },
};

function classifyBadge(label: string): BadgeVariant {
  const t = label.trim();
  const lower = t.toLowerCase();
  if (
    t.startsWith("/") ||
    t.includes("/org/") ||
    t.includes("/team/") ||
    (t.includes("/") && !t.includes(" "))
  ) {
    return "path";
  }
  if (
    lower.includes("tinyfish") ||
    lower.includes("linkedin") ||
    lower.includes("search") ||
    lower.includes("browser") ||
    /\b(api|sdk|mcp|tool)\b/i.test(t)
  ) {
    return "tool";
  }
  if (lower.startsWith("ghost") || /^ghost_[\w-]+$/i.test(t) || /^[\w]+_r\d+$/i.test(t)) {
    return "resource";
  }
  return "tag";
}

function buildBadgeItems(labels: string[]): Array<{ label: string; variant: BadgeVariant }> {
  return labels.map((label) => ({ label, variant: classifyBadge(label) }));
}

function badgeVariantIcon(variant: BadgeVariant): LucideIcon {
  switch (variant) {
    case "tool":
      return Wrench;
    case "path":
      return Folder;
    case "resource":
      return Bot;
    case "tag":
    default:
      return Tags;
  }
}

function badgeChipClass(variant: BadgeVariant): string {
  switch (variant) {
    case "tool":
      return "border-sky-400/35 bg-sky-400/10 text-sky-100";
    case "path":
      return "border-amber-400/35 bg-amber-400/10 text-amber-100";
    case "resource":
      return "border-violet-400/35 bg-violet-400/10 text-violet-100";
    case "tag":
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function badgeVariantTitle(variant: BadgeVariant): string {
  switch (variant) {
    case "tool":
      return "Tool";
    case "path":
      return "Folder or path";
    case "resource":
      return "Resource or agent identity";
    case "tag":
    default:
      return "Tag";
  }
}

function OrgBadgeRow({ data }: { data: OrgFlowNode["data"] }) {
  const items =
    data.badgeItems ?? (data.badges ?? []).map((label) => ({ label, variant: classifyBadge(label) }));

  if (!items.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2.5 flex flex-wrap gap-1.5",
        data.kind === "team" && "max-h-[4.5rem] overflow-hidden",
      )}
    >
      {items.map((item) => {
        const Icon = badgeVariantIcon(item.variant);
        return (
          <span
            key={`${item.variant}-${item.label}`}
            title={badgeVariantTitle(item.variant)}
            className={cn(
              "inline-flex max-w-[min(100%,12rem)] items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
              badgeChipClass(item.variant),
            )}
          >
            <Icon className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
            <span className="truncate">{item.label}</span>
          </span>
        );
      })}
    </div>
  );
}

function layoutAgentsInTeam(
  box: { x: number; y: number; w: number; h: number },
  agentIds: string[],
): Record<string, { x: number; y: number; width: number }> {
  const paddingX = 22;
  const gap = 14;
  const bottomPad = 14;
  const n = agentIds.length;
  const out: Record<string, { x: number; y: number; width: number }> = {};
  if (n === 0) {
    return out;
  }
  const y = box.y + box.h - AGENT_CARD_HEIGHT - bottomPad;
  const usable = box.w - 2 * paddingX - gap * (n - 1);
  const width = Math.max(152, Math.floor(usable / n));
  agentIds.forEach((id, i) => {
    out[id] = {
      x: box.x + paddingX + i * (width + gap),
      y,
      width,
    };
  });
  return out;
}

function createFlowElements(
  org: OrgSpec,
  visibleIds: string[],
  selectedId: string | undefined,
  onSelect: (kind: SelectionKind, id: string) => void,
) {
  const isVisible = (id: string) => visibleIds.includes(id);
  const nodes: OrgFlowNode[] = [];

  if (isVisible(org.id)) {
    nodes.push({
      id: org.id,
      type: "orgNode",
      position: { x: 468, y: 12 },
      data: {
        title: org.name,
        subtitle: `Org v${org.version} · ${org.status}`,
        kind: "org",
        badges: ["schema-first", "single workspace"],
        badgeItems: buildBadgeItems(["schema-first", "single workspace"]),
        selected: selectedId === org.id,
      },
      zIndex: 4,
    });
  }

  org.leadership.forEach((node) => {
    if (!isVisible(node.id)) {
      return;
    }

    nodes.push({
      id: node.id,
      type: "orgNode",
      position: { x: 508, y: 108 },
      data: {
        title: node.name,
        subtitle: node.role,
        kind: "leader",
        status: node.status,
        badges: ["planner", "handoffs"],
        badgeItems: buildBadgeItems(["planner", "handoffs"]),
        selected: selectedId === node.id,
        onSelect: () => onSelect("agent", node.id),
      },
      zIndex: 5,
    });
  });

  const agentLayout: Record<string, { x: number; y: number; width: number }> = {};

  org.teams.forEach((team) => {
    if (!isVisible(team.id)) {
      return;
    }

    const known = KNOWN_TEAM_LAYOUT[team.id];
    const teamAgents = org.agents.filter((a) => a.teamId === team.id).map((a) => a.id);
    const box = known ?? {
      x: 40 + org.teams.indexOf(team) * 420,
      y: 268,
      ...DEFAULT_TEAM_BOX,
    };

    Object.assign(agentLayout, layoutAgentsInTeam(box, teamAgents));

    nodes.push({
      id: team.id,
      type: "orgNode",
      position: { x: box.x, y: box.y },
      data: {
        title: team.name,
        subtitle: team.purpose,
        kind: "team",
        badges: team.resources.map((resource) => resource.label),
        badgeItems: buildBadgeItems(team.resources.map((resource) => resource.label)),
        scopes: team.resources.map((resource) => resource.scope),
        selected: selectedId === team.id,
        onSelect: () => onSelect("team", team.id),
      },
      style: {
        width: box.w,
        height: box.h,
      },
      zIndex: 0,
      draggable: false,
    });
  });

  org.agents.forEach((agent) => {
    if (!isVisible(agent.id)) {
      return;
    }

    const layout = agentLayout[agent.id];
    const fallbackX = 80 + org.agents.indexOf(agent) * 200;
    const pos = layout ?? { x: fallbackX, y: 360, width: 196 };

    const badgeStrings = [
      ...(agent.id === "agent_writer" && org.version > 1 ? ["specific funding hook"] : []),
      ...agent.tools
        .map((toolId) => org.tools.find((tool) => tool.id === toolId)?.name ?? toolId)
        .slice(0, 2),
      ...agent.resources.map((resource) => resource.label).slice(0, 1),
    ];

    nodes.push({
      id: agent.id,
      type: "orgNode",
      position: { x: pos.x, y: pos.y },
      style: { width: pos.width },
      data: {
        title: agent.name,
        subtitle: agent.role,
        kind: "agent",
        status: agent.status,
        badges: badgeStrings,
        badgeItems: buildBadgeItems(badgeStrings),
        scopes: agent.resources.map((resource) => resource.scope),
        selected: selectedId === agent.id,
        onSelect: () => onSelect("agent", agent.id),
      },
      zIndex: 12,
    });
  });

  const edges: Edge[] = org.edges
    .filter((edge) => isVisible(edge.id) && isVisible(edge.source) && isVisible(edge.target))
    .map((edge) => {
      const active = org.run.activeEdgeId === edge.id;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep" as const,
        animated: active,
        zIndex: 8,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: active ? "#e0f2fe" : "#7dd3fc",
          width: active ? 22 : 18,
          height: active ? 22 : 18,
        },
        style: {
          stroke: active ? "#e0f2fe" : "rgba(125, 211, 252, 0.82)",
          strokeWidth: active ? 4 : 3,
          strokeLinecap: "round" as const,
        },
        labelStyle: { fill: "#f1f5f9", fontSize: 12, fontWeight: 500 },
        labelBgStyle: { fill: "rgba(15, 23, 42, 0.92)", fillOpacity: 0.95 },
        labelBgPadding: [6, 4] as [number, number],
      };
    });

  return { nodes, edges };
}

function OrgNode({ data }: NodeProps<OrgFlowNode>) {
  const status = data.status?.toString();
  const isTeam = data.kind === "team";

  return (
    <button
      type="button"
      onClick={data.onSelect}
      className={cn(
        "group relative w-full min-w-36 rounded-lg border p-3 text-left shadow-2xl backdrop-blur transition",
        isTeam
          ? "flex h-full max-h-full min-h-0 flex-col border-white/10 bg-slate-950/55 hover:border-cyan-300/40"
          : cn(
              "border-white/10 bg-slate-950/90 hover:-translate-y-0.5 hover:border-cyan-300/50",
              data.kind === "agent" && "max-h-[196px] overflow-hidden",
            ),
        data.kind === "org" && "border-cyan-300/30 bg-cyan-300/10",
        data.selected && "border-cyan-300 shadow-cyan-500/20",
        status === "running" && "border-cyan-300 shadow-cyan-500/30",
        status === "queued" && "border-amber-300/70",
        status === "done" && "border-emerald-300/60",
      )}
    >
      {data.kind !== "org" && <Handle type="target" position={Position.Top} className="!bg-cyan-300" />}
      <div className={cn("min-w-0", isTeam && "shrink-0 pr-6")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusDot status={status} />
              <p className="truncate text-sm font-semibold text-white">{data.title}</p>
            </div>
            <p
              className={cn(
                "mt-1 text-xs leading-5 text-slate-400",
                isTeam ? "line-clamp-1" : "line-clamp-2",
              )}
            >
              {data.subtitle}
            </p>
          </div>
          {status === "done" && <Check className="h-4 w-4 shrink-0 text-emerald-300" />}
        </div>
        <OrgBadgeRow data={data} />
        {data.scopes && (
          <div className={cn("mt-2 flex gap-1.5", isTeam && "flex-wrap")}>
            {data.scopes.map((scope, index) => (
              <span
                key={`${scope}-${index}`}
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full ring-2", scopeRingClass(scope))}
                title={`${scope} scoped resource`}
              />
            ))}
          </div>
        )}
      </div>
      {/* Reserve lower band inside the team frame (sibling agent nodes draw above at z=10). */}
      {isTeam && (
        <div className="mt-2 flex-1 rounded-sm bg-white/[0.02]" style={{ minHeight: AGENT_CARD_HEIGHT }} aria-hidden />
      )}
      {data.kind !== "team" && <Handle type="source" position={Position.Bottom} className="!bg-cyan-300" />}
    </button>
  );
}

function StatusDot({ status }: { status?: string }) {
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full",
        status === "queued" && "bg-amber-300 shadow-lg shadow-amber-300/40",
        status === "running" && "animate-pulse bg-cyan-300 shadow-lg shadow-cyan-300/60",
        status === "done" && "bg-emerald-300 shadow-lg shadow-emerald-300/40",
        (!status || status === "idle") && "bg-slate-500",
      )}
    />
  );
}

function WorkflowRail({
  org,
  visibleIds,
  onSelect,
}: {
  org: OrgSpec;
  visibleIds: string[];
  onSelect: (kind: SelectionKind, id: string) => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/10 bg-slate-950/85 p-2.5 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        {org.workflow
          .filter((step) => visibleIds.includes(step.id))
          .map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect("workflow", step.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition",
                step.status === "done" && "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
                step.status === "active" && "border-cyan-300/50 bg-cyan-300/15 text-cyan-100",
                step.status === "pending" && "border-white/10 bg-white/5 text-slate-400",
              )}
            >
              {step.status === "done" ? <Check className="h-3 w-3" /> : <CircleDot className="h-3 w-3" />}
              {step.label}
            </button>
          ))}
      </div>
    </div>
  );
}

function HistoryPanel({ org }: { org: OrgSpec }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {["Version", "Run", "Agent"].map((label) => (
          <button
            key={label}
            type="button"
            className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-300"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <p className="text-sm font-semibold text-white">Before and after feedback</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          A compact timeline of how each agent behaved across this org version.
        </p>
      </div>
      <div className="space-y-3">
        {org.run.traces.map((trace) => {
          const agent = org.agents.find((candidate) => candidate.id === trace.agentId);

          return (
            <div key={trace.agentId} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="font-semibold text-white">{agent?.name ?? trace.agentId}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{trace.output}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trace.toolsUsed.map((tool) => (
                  <span key={tool} className="rounded-md bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TraceReplayBar({
  org,
  visibleIds,
  onSelect,
}: {
  org: OrgSpec;
  visibleIds: string[];
  onSelect: (kind: SelectionKind, id: string) => void;
}) {
  const completedAgents = org.agents.filter((agent) => agent.status === "done").length;
  const eventCount = org.run.status === "idle" ? 0 : org.run.traces.reduce((count, trace) => count + trace.trace.length, 0);
  const progress = org.agents.length ? Math.round((completedAgents / org.agents.length) * 100) : 0;

  return (
    <div className="absolute bottom-20 left-3 w-[min(520px,calc(100%-1.5rem))] rounded-lg border border-white/10 bg-slate-950/85 p-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trace Replay</p>
          <p className="mt-1 text-sm text-slate-200">{eventCount} events captured across agent calls</p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-xs font-semibold text-slate-950"
        >
          <Play className="h-3.5 w-3.5" />
          Replay
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {org.workflow
          .filter((step) => visibleIds.includes(step.id))
          .map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect("workflow", step.id)}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-100"
            >
              {step.label}
            </button>
          ))}
      </div>
    </div>
  );
}

function RunOutputDock({ org, onSelectOutput }: { org: OrgSpec; onSelectOutput: () => void }) {
  const firstEmail = org.run.finalOutput?.emails[0];

  return (
    <div className="absolute bottom-20 right-3 w-[360px] max-w-[calc(100%-1.5rem)] rounded-lg border border-emerald-300/20 bg-slate-950/88 p-4 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Final Output</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{org.run.finalOutput?.summary}</p>
        </div>
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
      </div>
      {firstEmail && (
        <div className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-semibold text-cyan-100">{firstEmail.startup}</p>
          <p className="mt-1 text-sm font-semibold text-white">{firstEmail.subject}</p>
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <span className="rounded-md bg-white/5 px-2 py-2 text-slate-300">$0.42</span>
        <span className="rounded-md bg-white/5 px-2 py-2 text-slate-300">18 steps</span>
        <span className="rounded-md bg-white/5 px-2 py-2 text-slate-300">42s</span>
      </div>
      <button
        type="button"
        onClick={onSelectOutput}
        className="mt-3 w-full rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
      >
        Inspect Output
      </button>
    </div>
  );
}

function FeedbackBox({
  value,
  setValue,
  onSubmit,
  disabled,
}: {
  value: string;
  setValue: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-auto pt-5">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={4}
        className="w-full resize-none rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm leading-6 text-white outline-none ring-cyan-400/30 transition placeholder:text-slate-500 focus:ring-4 disabled:opacity-45"
        placeholder="What should improve in the next version?"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Plus className="h-4 w-4" />
        Create Next Iteration
      </button>
    </div>
  );
}

function TraceBlock({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <p key={line} className="text-sm leading-6 text-slate-300">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function scopeRingClass(scope: ResourceScope) {
  if (scope === "org") {
    return "bg-red-300 ring-red-300/30";
  }

  if (scope === "team") {
    return "bg-amber-300 ring-amber-300/30";
  }

  return "bg-blue-300 ring-blue-300/30";
}

function statusClass(status: string) {
  return cn(
    "rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
    status === "draft" && "bg-amber-300/15 text-amber-200",
    status === "approved" && "bg-cyan-300/15 text-cyan-200",
    status === "main" && "bg-emerald-300/15 text-emerald-200",
    status === "archived" && "bg-slate-500/20 text-slate-300",
  );
}
