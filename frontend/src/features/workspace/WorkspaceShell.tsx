"use client";

import { GitPullRequestDraft } from "lucide-react";
import { AgentChatPanel } from "../chat/AgentChatPanel";
import { OrgCanvas } from "../canvas/OrgCanvas";
import type { CanvasTab, DemoState, OrgSpec, SelectionKind } from "./types";

interface WorkspaceShellProps {
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

export function WorkspaceShell({
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
}: WorkspaceShellProps) {
  return (
    <main className="flex h-screen min-h-[760px] flex-col overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.15),transparent_26%),radial-gradient(circle_at_82%_8%,rgba(139,92,246,0.14),transparent_26%)]" />
      <div className="relative z-10 grid h-full min-h-0 gap-2 p-2 lg:grid-cols-[340px_minmax(0,1fr)]">
          <AgentChatPanel
            messages={state.chatMessages}
            onFeedback={onFeedback}
            isGenerating={state.isGenerating}
          />
          <OrgCanvas
            org={currentOrg}
            activeTab={state.activeTab}
            visibleIds={state.visibleIds}
            selectedId={state.selectedId}
            selectedKind={state.selectedKind}
            isGenerating={state.isGenerating}
            isRunning={state.isRunning}
            versions={state.versions}
            currentVersion={state.currentVersion}
            onTabChange={onTabChange}
            onSelect={onSelect}
            onApprove={onApprove}
            onRun={onRun}
            onFeedback={onFeedback}
            onReset={onReset}
            onMarkMain={onMarkMain}
            onVersion={onVersion}
          />

        <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-400 backdrop-blur xl:flex">
          <GitPullRequestDraft className="h-3.5 w-3.5 text-cyan-200" />
          Minimal-click demo path: approve, run, inspect, feedback, set main.
        </div>
      </div>
    </main>
  );
}
