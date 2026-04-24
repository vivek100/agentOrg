"use client";

import { LandingPrompt } from "@/features/landing/LandingPrompt";
import { WorkspaceShell } from "@/features/workspace/WorkspaceShell";
import { useAgentOrgDemo } from "@/features/workspace/use-agent-org-demo";

export default function Home() {
  const demo = useAgentOrgDemo();

  if (!demo.state || !demo.currentOrg) {
    return <LandingPrompt onCreate={demo.begin} />;
  }

  return (
    <WorkspaceShell
      state={demo.state}
      currentOrg={demo.currentOrg}
      onReset={demo.reset}
      onApprove={demo.approve}
      onMarkMain={demo.markMain}
      onRun={demo.run}
      onFeedback={demo.feedback}
      onSelect={demo.select}
      onTabChange={demo.changeTab}
      onVersion={demo.version}
    />
  );
}
