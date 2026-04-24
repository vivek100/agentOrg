"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Text } from "@react-three/drei";
import {
  BadgeCheck,
  Crown,
  FlaskConical,
  GitBranch,
  Play,
  RadioTower,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { type ElementRef, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AgentChatPanel } from "@/features/chat/AgentChatPanel";
import { cn } from "@/lib/utils";
import type { CanvasTab, DemoState, OrgSpec, SelectionKind } from "../workspace/types";

type WorldSelection =
  | { kind: SelectionKind; id: string }
  | { kind: "tool"; id: string; agentId: string }
  | { kind: "none"; id: "" };

interface CanvasLab3DShellProps {
  state: DemoState;
  currentOrg: OrgSpec;
  onReset: () => void;
  onApprove: () => void;
  onMarkMain: () => void;
  onRun: () => void;
  onFeedback: (message: string) => void;
  onSelect: (kind: SelectionKind, id: string) => void;
  onTabChange: (tab: CanvasTab) => void;
  onVersion: (version: number) => void;
}

const statusColor = {
  idle: "#64748b",
  queued: "#fbbf24",
  running: "#22d3ee",
  done: "#34d399",
  failed: "#f87171",
};

const tabIcons = {
  design: GitBranch,
  run: RadioTower,
  traces: FlaskConical,
  history: Sparkles,
};

export function CanvasLab3DShell({
  state,
  currentOrg,
  onReset,
  onApprove,
  onMarkMain,
  onRun,
  onFeedback,
  onSelect,
  onTabChange,
  onVersion,
}: CanvasLab3DShellProps) {
  const [selection, setSelection] = useState<WorldSelection>({ kind: "none", id: "" });
  const [feedback, setFeedback] = useState("Add a verifier and make hooks more company-specific.");
  const [cameraOffset, setCameraOffset] = useState<[number, number]>([0, 0]);
  const selectedAgent =
    selection.kind === "agent" ? currentOrg.agents.find((agent) => agent.id === selection.id) : undefined;
  const selectedLeader =
    selection.kind === "agent" ? currentOrg.leadership.find((leader) => leader.id === selection.id) : undefined;
  const selectedTeam =
    selection.kind === "team" ? currentOrg.teams.find((team) => team.id === selection.id) : undefined;
  const selectedStep =
    selection.kind === "workflow" ? currentOrg.workflow.find((step) => step.id === selection.id) : undefined;
  const selectedTrace =
    selection.kind === "agent" ? currentOrg.run.traces.find((trace) => trace.agentId === selection.id) : undefined;

  function select(kind: SelectionKind, id: string) {
    setSelection({ kind, id });
    onSelect(kind, id);
  }

  function submitFeedback() {
    onFeedback(feedback);
    setFeedback("");
  }

  function moveCamera(dx: number, dz: number) {
    setCameraOffset(([x, z]) => [
      Math.max(-4.5, Math.min(4.5, x + dx)),
      Math.max(-2.5, Math.min(2.5, z + dz)),
    ]);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        moveCamera(-0.45, 0);
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        moveCamera(0.45, 0);
      }
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        moveCamera(0, -0.45);
      }
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        moveCamera(0, 0.45);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="flex h-screen min-h-[760px] flex-col overflow-hidden bg-[#050816] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/90 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <p className="text-sm font-semibold text-cyan-100">AgentOrg</p>
          <span className="h-5 w-px bg-white/10" />
          <p className="truncate text-sm font-medium text-white">{currentOrg.name || "Canvas Lab Org"}</p>
          <span className={statusClass(currentOrg.status)}>{currentOrg.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={state.currentVersion}
            onChange={(event) => onVersion(Number(event.target.value))}
            className="h-9 rounded-md border border-white/10 bg-slate-900 px-2 text-xs text-white outline-none"
            aria-label="Version selector"
          >
            {state.versions.map((org) => (
              <option key={org.version} value={org.version}>
                v{org.version} - {org.status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onMarkMain}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 text-xs font-medium text-emerald-100"
          >
            <Crown className="h-4 w-4" />
            Set Main
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-slate-900 px-3 text-xs font-medium text-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            New Org
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-2 p-2 lg:grid-cols-[340px_minmax(0,1fr)]">
        <AgentChatPanel messages={state.chatMessages} onFeedback={onFeedback} isGenerating={state.isGenerating} />

        <section className="relative min-h-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
          <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
            {(Object.keys(tabIcons) as CanvasTab[]).map((tab) => {
              const Icon = tabIcons[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium backdrop-blur",
                    state.activeTab === tab
                      ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-50"
                      : "border-white/10 bg-slate-950/75 text-slate-300",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab === "history" ? "Agent History" : tab[0].toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </div>

          <div className="absolute right-3 top-3 z-20 flex flex-wrap justify-end gap-2">
            {currentOrg.status === "draft" ? (
              <button
                type="button"
                onClick={onApprove}
                disabled={state.isGenerating}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-semibold text-slate-950 disabled:opacity-50"
              >
                <BadgeCheck className="h-4 w-4" />
                Approve Org
              </button>
            ) : (
              <button
                type="button"
                onClick={onRun}
                disabled={state.isRunning}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-xs font-semibold text-slate-950 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {state.isRunning ? "Running" : "Run Task"}
              </button>
            )}
            <button
              type="button"
              onClick={() => submitFeedback()}
              className="h-9 rounded-md border border-white/10 bg-slate-950/75 px-3 text-xs font-medium text-slate-200 backdrop-blur"
            >
              Request Changes
            </button>
          </div>

          <AgentOrgWorld
            org={currentOrg}
            activeTab={state.activeTab}
            visibleIds={state.visibleIds}
            selectedId={selection.id}
            isGenerating={state.isGenerating}
            cameraOffset={cameraOffset}
            onSelect={select}
          />

          <ModePanel org={currentOrg} state={state} onSelect={select} />
          <NavigationPad
            onMove={moveCamera}
            onReset={() => setCameraOffset([0, 0])}
          />

          {selection.kind !== "none" && (
            <Inspector
              org={currentOrg}
              selection={selection}
              selectedAgent={selectedAgent}
              selectedLeader={selectedLeader}
              selectedTeam={selectedTeam}
              selectedStep={selectedStep}
              selectedTrace={selectedTrace}
              feedback={feedback}
              setFeedback={setFeedback}
              onSubmit={submitFeedback}
              onClose={() => setSelection({ kind: "none", id: "" })}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function AgentOrgWorld({
  org,
  activeTab,
  visibleIds,
  selectedId,
  isGenerating,
  cameraOffset,
  onSelect,
}: {
  org: OrgSpec;
  activeTab: CanvasTab;
  visibleIds: string[];
  selectedId: string;
  isGenerating: boolean;
  cameraOffset: [number, number];
  onSelect: (kind: SelectionKind, id: string) => void;
}) {
  const layout = useMemo(() => buildWorldLayout(org), [org]);
  const visible = (id: string) => visibleIds.includes(id);
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);

  return (
    <Canvas
      camera={{ position: [8, 6.5, 9], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="bg-[#050816]"
    >
      <color attach="background" args={["#050816"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 4]} intensity={1.2} />
      <pointLight position={[-4, 4, -2]} intensity={0.8} color="#22d3ee" />
      <CameraOffsetRig cameraOffset={cameraOffset} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        enablePan
        screenSpacePanning
        minDistance={5}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.25}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <OfficeFloor isGenerating={isGenerating} />

      {visible(org.id) && <OrgHeader org={org} />}

      {org.teams.filter((team) => visible(team.id)).map((team) => (
        <TeamZone
          key={team.id}
          team={team}
          position={layout.teams[team.id] ?? [0, 0.02, 0]}
          selected={selectedId === team.id}
          onClick={() => onSelect("team", team.id)}
        />
      ))}

      {org.leadership.filter((leader) => visible(leader.id)).map((leader) => (
        <LeadershipDesk
          key={leader.id}
          name={`AI CEO: ${leader.name}`}
          role={leader.role}
          status={leader.status}
          position={layout.agents[leader.id] ?? [0, 0.1, 1.8]}
          selected={selectedId === leader.id}
          onClick={() => onSelect("agent", leader.id)}
        />
      ))}

      {org.agents.filter((agent) => visible(agent.id)).map((agent) => (
        <AgentDesk
          key={agent.id}
          org={org}
          agent={agent}
          position={layout.agents[agent.id] ?? [0, 0.1, 0]}
          selected={selectedId === agent.id}
          traceMode={activeTab === "traces" || activeTab === "history"}
          onClick={() => onSelect("agent", agent.id)}
        />
      ))}

      {org.edges.filter((edge) => visible(edge.id) && visible(edge.source) && visible(edge.target)).map((edge) => (
        <HandoffPath
          key={edge.id}
          edge={edge}
          source={layout.agents[edge.source]}
          target={layout.agents[edge.target]}
          active={org.run.activeEdgeId === edge.id}
          traceMode={activeTab === "traces"}
        />
      ))}

      {org.workflow.filter((step) => visible(step.id)).map((step, index) => (
        <WorkflowMarker
          key={step.id}
          step={step}
          position={[-4.5 + index * 2.3, 0.08, 3.2]}
          onClick={() => onSelect("workflow", step.id)}
        />
      ))}

      {org.run.finalOutput && <OutputStation onClick={() => onSelect("output", "final_output")} />}
    </Canvas>
  );
}

function CameraOffsetRig({
  cameraOffset,
  controlsRef,
}: {
  cameraOffset: [number, number];
  controlsRef: RefObject<ElementRef<typeof OrbitControls> | null>;
}) {
  const { camera } = useThree();
  const lastOffset = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const [lastX, lastZ] = lastOffset.current;
    const [nextX, nextZ] = cameraOffset;
    const delta = new THREE.Vector3(nextX - lastX, 0, nextZ - lastZ);

    camera.position.add(delta);
    controlsRef.current?.target.add(delta);
    controlsRef.current?.update();
    lastOffset.current = cameraOffset;
  }, [camera, cameraOffset, controlsRef]);

  return null;
}

function NavigationPad({
  onMove,
  onReset,
}: {
  onMove: (dx: number, dz: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute right-3 top-16 z-20 rounded-lg border border-white/10 bg-slate-950/82 p-2 backdrop-blur">
      <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Move Floor</p>
      <div className="grid grid-cols-3 gap-1">
        <span />
        <button type="button" onClick={() => onMove(0, -0.55)} className="h-8 rounded-md border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100">W</button>
        <span />
        <button type="button" onClick={() => onMove(-0.55, 0)} className="h-8 rounded-md border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100">A</button>
        <button type="button" onClick={onReset} className="h-8 rounded-md border border-cyan-300/20 bg-cyan-300/10 text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/50">0</button>
        <button type="button" onClick={() => onMove(0.55, 0)} className="h-8 rounded-md border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100">D</button>
        <span />
        <button type="button" onClick={() => onMove(0, 0.55)} className="h-8 rounded-md border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100">S</button>
        <span />
      </div>
      <p className="mt-2 w-28 px-1 text-[10px] leading-4 text-slate-400">Use WASD or arrow keys. Right-drag pans.</p>
    </div>
  );
}

function OfficeFloor({ isGenerating }: { isGenerating: boolean }) {
  const pulse = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (pulse.current) {
      pulse.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * (isGenerating ? 0.015 : 0.004));
    }
  });

  return (
    <group>
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[10.5, 7.2, 0.08]} />
        <meshStandardMaterial color="#111827" roughness={0.85} metalness={0.05} />
      </mesh>
      <gridHelper args={[10, 10, "#334155", "#1e293b"]} position={[0, 0.06, 0]} />
      <mesh position={[0, 0.1, -3.65]}>
        <boxGeometry args={[10.7, 0.16, 0.18]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

function OrgHeader({ org }: { org: OrgSpec }) {
  return (
    <Html position={[0, 2.35, -3.3]} center transform distanceFactor={8}>
      <div className="w-[360px] rounded-lg border border-cyan-300/30 bg-slate-950/85 px-4 py-3 text-center shadow-2xl shadow-cyan-500/10 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">AI Organization</p>
        <p className="mt-1 text-lg font-semibold text-white">{org.name || "Designing org..."}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">{org.mission || org.task}</p>
      </div>
    </Html>
  );
}

function TeamZone({
  team,
  position,
  selected,
  onClick,
}: {
  team: OrgSpec["teams"][number];
  position: [number, number, number];
  selected: boolean;
  onClick: () => void;
}) {
  const color = team.id.includes("research") ? "#0e7490" : "#166534";

  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[4.2, 2.45, 0.06]} />
        <meshStandardMaterial color={color} opacity={0.32} transparent />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[4.3, 0.12, 2.55]} />
        <meshStandardMaterial color={selected ? "#67e8f9" : "#334155"} opacity={0.18} transparent />
      </mesh>
      <TeamResourceDock resources={team.resources} />
      <Text position={[0, 0.2, -1.08]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} color="#e2e8f0" anchorX="center">
        {team.name}
      </Text>
    </group>
  );
}

function TeamResourceDock({ resources }: { resources: OrgSpec["teams"][number]["resources"] }) {
  return (
    <group position={[-1.55, 0.18, -0.72]}>
      {resources.map((resource, index) => {
        const x = index * 0.52;
        const isGhost = resource.id.includes("ghost");
        const isFile = resource.id.includes("files") || resource.id.includes("file") || resource.label.includes("/");

        return (
          <group key={resource.id} position={[x, 0, 0]}>
            <mesh position={[0, 0.22, 0]}>
              {isGhost ? <cylinderGeometry args={[0.16, 0.16, 0.42, 18]} /> : <boxGeometry args={[0.34, 0.34, 0.3]} />}
              <meshStandardMaterial
                color={isGhost ? "#22d3ee" : isFile ? "#f59e0b" : "#a78bfa"}
                emissive={isGhost ? "#155e75" : isFile ? "#78350f" : "#581c87"}
                emissiveIntensity={0.28}
              />
            </mesh>
            <Html position={[0, 0.62, 0]} center distanceFactor={8}>
              <div className="pointer-events-none w-24 rounded bg-slate-950/82 px-1.5 py-0.5 text-center text-[9px] leading-3 text-slate-100">
                {isGhost ? "Ghost DB" : isFile ? "Team Files" : resource.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function LeadershipDesk({
  name,
  role,
  status,
  position,
  selected,
  onClick,
}: {
  name: string;
  role: string;
  status: OrgSpec["leadership"][number]["status"];
  position: [number, number, number];
  selected: boolean;
  onClick: () => void;
}) {
  const color = statusColor[status];

  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.48, 0.56, 0.34, 6]} />
        <meshStandardMaterial color={selected ? "#22d3ee" : "#475569"} emissive={status === "running" ? color : "#000000"} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <octahedronGeometry args={[0.28]} />
        <meshStandardMaterial color={status === "done" ? "#34d399" : "#facc15"} emissive={status === "running" ? "#22d3ee" : "#854d0e"} emissiveIntensity={0.28} />
      </mesh>
      <WorldLabel title={name} subtitle={role} position={[0, 1.12, 0]} />
    </group>
  );
}

function AgentDesk({
  org,
  agent,
  position,
  selected,
  traceMode,
  onClick,
}: {
  org: OrgSpec;
  agent: OrgSpec["agents"][number];
  position: [number, number, number];
  selected: boolean;
  traceMode: boolean;
  onClick: () => void;
}) {
  const glow = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (glow.current) {
      glow.current.intensity = agent.status === "running" ? 1.4 + Math.sin(clock.elapsedTime * 6) * 0.45 : 0.25;
    }
  });

  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <pointLight ref={glow} position={[0, 0.9, 0]} color={statusColor[agent.status]} distance={2.5} intensity={0.25} />
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.95, 0.22, 0.58]} />
        <meshStandardMaterial color={selected ? "#155e75" : "#1e293b"} />
      </mesh>
      <mesh position={[0, 0.54, -0.12]}>
        <boxGeometry args={[0.42, 0.36, 0.06]} />
        <meshStandardMaterial color="#020617" emissive={agent.status === "running" ? "#0891b2" : "#0f172a"} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.27, 0.62, 0.12]}>
        <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
        <meshStandardMaterial color={statusColor[agent.status]} emissive={statusColor[agent.status]} emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[0.36, 0.45, 0.18]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {agent.tools.slice(0, 3).map((toolId, index) => (
        <ToolProp
          key={toolId}
          label={org.tools.find((tool) => tool.id === toolId)?.name ?? toolId}
          position={[-0.36 + index * 0.22, 0.47, 0.28]}
        />
      ))}
      {agent.resources.slice(0, 2).map((resource, index) => (
        <mesh key={resource.id} position={[-0.48 + index * 0.22, 0.2, -0.34]}>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial
            color={resource.scope === "private" ? "#c084fc" : resource.scope === "team" ? "#fbbf24" : "#38bdf8"}
            emissive={resource.scope === "private" ? "#581c87" : resource.scope === "team" ? "#78350f" : "#155e75"}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
      {traceMode && agent.status === "done" && (
        <mesh position={[0.42, 0.95, -0.16]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.8} />
        </mesh>
      )}
      <WorldLabel
        title={agent.name}
        subtitle={agent.id === "agent_writer" && org.version > 1 ? "specific funding hook" : agent.promptSummary}
        position={[0, 1.08, 0]}
      />
    </group>
  );
}

function ToolProp({ label, position }: { label: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#155e75" emissiveIntensity={0.35} />
      </mesh>
      <Html position={[0, 0.16, 0]} center distanceFactor={8}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] text-cyan-100">
          {label}
        </div>
      </Html>
    </group>
  );
}

function HandoffPath({
  edge,
  source,
  target,
  active,
  traceMode,
}: {
  edge: OrgSpec["edges"][number];
  source?: [number, number, number];
  target?: [number, number, number];
  active: boolean;
  traceMode: boolean;
}) {
  if (!source || !target) {
    return null;
  }

  const points: [number, number, number][] = [
    [source[0], 0.42, source[2]],
    [(source[0] + target[0]) / 2, 0.42, (source[2] + target[2]) / 2],
    [target[0], 0.42, target[2]],
  ];

  return (
    <group>
      <Line points={points} color={active ? "#22d3ee" : traceMode ? "#a78bfa" : "#64748b"} lineWidth={active ? 4 : 2} dashed={!active} />
      {active && <WorkPacket points={points} />}
      {traceMode && (
        <Html position={points[1]} center distanceFactor={9}>
          <div className="pointer-events-none rounded-md border border-white/10 bg-slate-950/85 px-2 py-1 text-[10px] text-slate-200">
            {edge.label}
          </div>
        </Html>
      )}
    </group>
  );
}

function WorkPacket({ points }: { points: [number, number, number][] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }
    const t = (Math.sin(clock.elapsedTime * 2.2) + 1) / 2;
    const a = new THREE.Vector3(...points[0]);
    const b = new THREE.Vector3(...points[2]);
    ref.current.position.copy(a.lerp(b, t));
  });

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.16]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.9} />
    </mesh>
  );
}

function WorkflowMarker({
  step,
  position,
  onClick,
}: {
  step: OrgSpec["workflow"][number];
  position: [number, number, number];
  onClick: () => void;
}) {
  const color = step.status === "done" ? "#34d399" : step.status === "active" ? "#22d3ee" : "#94a3b8";

  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <mesh>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={step.status === "active" ? 0.5 : 0.12} />
      </mesh>
      <Text position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.16} color="#020617" anchorX="center">
        {step.step}
      </Text>
    </group>
  );
}

function OutputStation({ onClick }: { onClick: () => void }) {
  return (
    <group position={[4.35, 0.12, -2.65]} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[1.2, 0.26, 0.72]} />
        <meshStandardMaterial color="#064e3b" emissive="#065f46" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.84, 0.08, 0.52]} />
        <meshStandardMaterial color="#d1fae5" />
      </mesh>
      <WorldLabel title="Final Output" subtitle="Cold emails, quality, cost, time" position={[0, 0.92, 0]} />
    </group>
  );
}

function WorldLabel({ title, subtitle, position }: { title: string; subtitle: string; position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={8}>
      <div className="pointer-events-none w-40 rounded-md border border-white/10 bg-slate-950/82 px-2 py-1 text-center shadow-xl backdrop-blur">
        <p className="truncate text-[11px] font-semibold text-white">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[9px] leading-3 text-slate-300">{subtitle}</p>
      </div>
    </Html>
  );
}

function ModePanel({
  org,
  state,
  onSelect,
}: {
  org: OrgSpec;
  state: DemoState;
  onSelect: (kind: SelectionKind, id: string) => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 z-20 w-[min(620px,calc(100%-1.5rem))] rounded-lg border border-white/10 bg-slate-950/82 p-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {state.activeTab === "traces" ? "Trace Replay" : state.activeTab === "run" ? "Run Monitor" : "3D Canvas Lab"}
          </p>
          <p className="mt-1 text-sm text-slate-200">
            {state.activeTab === "traces"
              ? `${org.run.traces.reduce((count, trace) => count + trace.trace.length, 0)} trace events visible on agents, tools, and handoffs.`
              : state.isRunning
                ? "Work packet is moving through the org while agents change status."
                : "Click teams, desks, workflow markers, or the output station to inspect and give feedback."}
          </p>
        </div>
        {org.run.finalOutput && (
          <button
            type="button"
            onClick={() => onSelect("output", "final_output")}
            className="rounded-md bg-emerald-300 px-3 py-2 text-xs font-semibold text-slate-950"
          >
            View Output
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {org.workflow.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect("workflow", step.id)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs",
              step.status === "active" && "border-cyan-300/40 bg-cyan-300/15 text-cyan-100",
              step.status === "done" && "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
              step.status === "pending" && "border-white/10 bg-white/5 text-slate-400",
            )}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Inspector({
  org,
  selection,
  selectedAgent,
  selectedLeader,
  selectedTeam,
  selectedStep,
  selectedTrace,
  feedback,
  setFeedback,
  onSubmit,
  onClose,
}: {
  org: OrgSpec;
  selection: WorldSelection;
  selectedAgent?: OrgSpec["agents"][number];
  selectedLeader?: OrgSpec["leadership"][number];
  selectedTeam?: OrgSpec["teams"][number];
  selectedStep?: OrgSpec["workflow"][number];
  selectedTrace?: OrgSpec["run"]["traces"][number];
  feedback: string;
  setFeedback: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="scrollbar-clean absolute bottom-3 right-3 top-16 z-30 w-[360px] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/92 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{selection.kind}</p>
          <h2 className="mt-1 text-base font-semibold text-white">
            {selectedAgent?.name ??
              selectedLeader?.name ??
              selectedTeam?.name ??
              selectedStep?.label ??
              (selection.kind === "output" ? "Final Output" : "Selection")}
          </h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border border-white/10 p-2 text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {selectedAgent && (
          <>
            <InfoBlock label="Role" lines={[selectedAgent.role]} />
            <InfoBlock label="Prompt" lines={[selectedAgent.promptSummary]} />
            <InfoBlock label="Tools" lines={selectedAgent.tools.map((toolId) => org.tools.find((tool) => tool.id === toolId)?.name ?? toolId)} />
          </>
        )}
        {selectedLeader && (
          <>
            <InfoBlock label="AI CEO Role" lines={[selectedLeader.role]} />
            <InfoBlock
              label="Routing Trace"
              lines={
                selectedTrace?.trace ?? [
                  "Creates the leadership node.",
                  "Routes task packets to research, analysis, output, and verifier teams.",
                ]
              }
            />
            <InfoBlock
              label="Feedback Target"
              lines={["Planner instructions", "Workflow decomposition", "Routing and handoff policy"]}
            />
          </>
        )}
        {selectedTeam && (
          <>
            <InfoBlock label="Purpose" lines={[selectedTeam.purpose]} />
            <InfoBlock label="Resources" lines={selectedTeam.resources.map((resource) => `${resource.label} (${resource.scope})`)} />
          </>
        )}
        {selectedStep && <InfoBlock label="Workflow Step" lines={[`Step ${selectedStep.step}`, ...selectedStep.agentIds]} />}
        {selectedTrace && (
          <>
            <InfoBlock label="Input" lines={[selectedTrace.input]} />
            <InfoBlock label="Trace Events" lines={selectedTrace.trace} />
            <InfoBlock label="Output" lines={[selectedTrace.output]} />
          </>
        )}
        {selection.kind === "output" && org.run.finalOutput && (
          <>
            <InfoBlock label="Quality Summary" lines={[org.run.finalOutput.summary]} />
            {org.run.finalOutput.emails.map((email) => (
              <InfoBlock key={email.startup} label={email.startup} lines={[email.subject, email.body]} />
            ))}
          </>
        )}
      </div>

      <textarea
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        rows={4}
        className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm leading-6 text-white outline-none ring-cyan-400/30 focus:ring-4"
        placeholder="Give feedback for the selected target..."
      />
      <button
        type="button"
        onClick={onSubmit}
        className="mt-3 w-full rounded-md bg-cyan-300 px-3 py-2.5 text-sm font-semibold text-slate-950"
      >
        Create v{Math.max(...org.workflow.map((step) => step.step), 1) >= 5 ? "Next" : "2"} From Feedback
      </button>
    </aside>
  );
}

function InfoBlock({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 space-y-1.5">
        {lines.length ? (
          lines.map((line) => (
            <p key={line} className="text-sm leading-6 text-slate-300">
              {line}
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-500">None</p>
        )}
      </div>
    </div>
  );
}

function buildWorldLayout(org: OrgSpec) {
  const agents: Record<string, [number, number, number]> = {
    planner: [0, 0.12, -1.9],
    agent_researcher_a: [-3.25, 0.12, 0.2],
    agent_researcher_b: [-2.15, 0.12, 1.05],
    agent_researcher_c: [-4.25, 0.12, 1.1],
    agent_analyst: [2.15, 0.12, 0.25],
    agent_writer: [3.35, 0.12, 1.05],
    agent_verifier: [4.25, 0.12, 0.05],
  };

  return {
    teams: {
      team_research: [-3.2, 0.08, 0.7] as [number, number, number],
      team_output: [3.15, 0.08, 0.7] as [number, number, number],
    } as Record<string, [number, number, number]>,
    agents: Object.fromEntries(
      Object.entries(agents).filter(([id]) => org.leadership.some((leader) => leader.id === id) || org.agents.some((agent) => agent.id === id)),
    ) as Record<string, [number, number, number]>,
  };
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
