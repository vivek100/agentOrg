"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { consumeCanvasSse, consumeTraceSse } from "@/lib/sse-client";
import { createGenerationEvents, createTraceEvents } from "./mock-data";
import {
  approveCurrentOrg,
  createInitialState,
  createNextVersion,
  createStreamingInitialState,
  getCurrentOrg,
  isAgentOrgOfflineMock,
  markCurrentVersionMain,
  reduceCanvasEvent,
  reduceTraceEvent,
  startRun,
  switchVersion,
} from "./event-reducer";
import type { CanvasTab, DemoState, SelectionKind } from "./types";

const DEFAULT_TASK = "Research 3 AI startups and write cold outreach emails";

export function useAgentOrgDemo() {
  const [state, setState] = useState<DemoState | null>(null);
  const stateRef = useRef<DemoState | null>(null);

  const timersRef = useRef<number[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const abortStream = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      abortStream();
    };
  }, [abortStream, clearTimers]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const currentOrg = useMemo(() => (state ? getCurrentOrg(state) : null), [state]);

  const streamGenerationFromApi = useCallback(
    (task: string, version: number) => {
      abortStream();
      const ac = new AbortController();
      streamAbortRef.current = ac;

      void (async () => {
        try {
          const res = await fetch("/api/orgs/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({ task, version }),
            signal: ac.signal,
          });

          if (!res.ok) {
            const text = await res.text();
            setState((s) =>
              s
                ? {
                    ...s,
                    isGenerating: false,
                    chatMessages: [
                      ...s.chatMessages,
                      {
                        id: `err_${Date.now()}`,
                        role: "system",
                        content: `Generation failed (${res.status}). ${text.slice(0, 400)}`,
                      },
                    ],
                  }
                : s,
            );
            return;
          }

          await consumeCanvasSse(
            res,
            (ev) => {
              setState((s) => (s ? reduceCanvasEvent(s, ev) : s));
            },
            ac.signal,
          );
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            return;
          }
          const message = e instanceof Error ? e.message : String(e);
          setState((s) =>
            s
              ? {
                  ...s,
                  isGenerating: false,
                  chatMessages: [
                    ...s.chatMessages,
                    {
                      id: `err_${Date.now()}`,
                      role: "system",
                      content: `Could not complete generation: ${message}`,
                    },
                  ],
                }
              : s,
          );
        }
      })();
    },
    [abortStream],
  );

  const submitFeedbackToApi = useCallback(
    async (orgId: string, orgVersion: number, message: string): Promise<boolean> => {
      if (!orgId) {
        return true;
      }
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          targetType: "org_version",
          targetId: String(orgVersion),
          orgVersion,
          message,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setState((s) =>
          s
            ? {
                ...s,
                chatMessages: [
                  ...s.chatMessages,
                  {
                    id: `err_${Date.now()}`,
                    role: "system",
                    content: `Feedback save failed (${res.status}). ${text.slice(0, 300)}`,
                  },
                ],
              }
            : s,
        );
        return false;
      }
      return true;
    },
    [],
  );

  function begin(task: string) {
    const normalizedTask = task.trim() || DEFAULT_TASK;

    clearTimers();
    abortStream();

    if (isAgentOrgOfflineMock()) {
      const initialState = createInitialState(normalizedTask);
      setState(initialState);
      streamGenerationOffline(normalizedTask, 1);
      return;
    }

    setState(createStreamingInitialState(normalizedTask, 1));
    streamGenerationFromApi(normalizedTask, 1);
  }

  function reset() {
    clearTimers();
    abortStream();
    setState(null);
  }

  async function approve() {
    const current = stateRef.current;
    if (!current) {
      return;
    }

    if (isAgentOrgOfflineMock()) {
      setState(approveCurrentOrg(current));
      return;
    }

    const org = getCurrentOrg(current);
    const res = await fetch(`/api/orgs/${encodeURIComponent(org.id)}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: current.currentVersion }),
    });

    if (!res.ok) {
      const text = await res.text();
      setState((s) =>
        s
          ? {
              ...s,
              chatMessages: [
                ...s.chatMessages,
                {
                  id: `err_${Date.now()}`,
                  role: "system",
                  content: `Approve failed (${res.status}). ${text.slice(0, 300)}`,
                },
              ],
            }
          : s,
      );
      return;
    }

    setState((s) => (s ? approveCurrentOrg(s) : s));
  }

  async function markMain() {
    const current = stateRef.current;
    if (!current) {
      return;
    }

    if (isAgentOrgOfflineMock()) {
      setState(markCurrentVersionMain(current));
      return;
    }

    const org = getCurrentOrg(current);
    const v = current.currentVersion;
    const res = await fetch(
      `/api/orgs/${encodeURIComponent(org.id)}/versions/${encodeURIComponent(String(v))}/main`,
      { method: "POST" },
    );

    if (!res.ok) {
      const text = await res.text();
      setState((s) =>
        s
          ? {
              ...s,
              chatMessages: [
                ...s.chatMessages,
                {
                  id: `err_${Date.now()}`,
                  role: "system",
                  content: `Set main failed (${res.status}). ${text.slice(0, 300)}`,
                },
              ],
            }
          : s,
      );
      return;
    }

    setState((s) => (s ? markCurrentVersionMain(s) : s));
  }

  function select(kind: SelectionKind, id: string) {
    setState((current) =>
      current
        ? {
            ...current,
            selectedKind: kind,
            selectedId: id,
            activeTab: kind === "output" ? "run" : current.activeTab,
          }
        : current,
    );
  }

  function changeTab(tab: CanvasTab) {
    setState((current) => (current ? { ...current, activeTab: tab } : current));
  }

  function streamRunOffline() {
    const events = createTraceEvents();

    events.forEach((event, index) => {
      const timer = window.setTimeout(() => {
        setState((current) => (current ? reduceTraceEvent(current, event) : current));
      }, 520 * index + 260);
      timersRef.current.push(timer);
    });
  }

  async function run() {
    const current = stateRef.current;
    if (!current) {
      return;
    }

    if (isAgentOrgOfflineMock()) {
      setState((c) => {
        if (!c) {
          return c;
        }
        return startRun(c);
      });
      streamRunOffline();
      return;
    }

    const org = getCurrentOrg(current);
    const res = await fetch(`/api/orgs/${encodeURIComponent(org.id)}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: current.currentVersion }),
    });

    if (!res.ok) {
      const text = await res.text();
      setState((s) =>
        s
          ? {
              ...s,
              chatMessages: [
                ...s.chatMessages,
                {
                  id: `err_${Date.now()}`,
                  role: "system",
                  content: `Run start failed (${res.status}). ${text.slice(0, 300)}`,
                },
              ],
            }
          : s,
      );
      return;
    }

    const body = (await res.json()) as { runId?: string };
    const runId = body.runId;
    if (!runId) {
      setState((s) =>
        s
          ? {
              ...s,
              chatMessages: [
                ...s.chatMessages,
                {
                  id: `err_${Date.now()}`,
                  role: "system",
                  content: "Run start returned no runId.",
                },
              ],
            }
          : s,
      );
      return;
    }

    setState((c) => (c ? startRun(c) : c));

    abortStream();
    const ac = new AbortController();
    streamAbortRef.current = ac;

    try {
      const streamRes = await fetch(`/api/runs/${encodeURIComponent(runId)}/stream`, {
        signal: ac.signal,
        headers: { Accept: "text/event-stream" },
      });

      if (!streamRes.ok) {
        const text = await streamRes.text();
        setState((s) =>
          s
            ? {
                ...s,
                isRunning: false,
                chatMessages: [
                  ...s.chatMessages,
                  {
                    id: `err_${Date.now()}`,
                    role: "system",
                    content: `Run stream failed (${streamRes.status}). ${text.slice(0, 300)}`,
                  },
                ],
              }
            : s,
        );
        return;
      }

      await consumeTraceSse(
        streamRes,
        (ev) => {
          setState((s) => (s ? reduceTraceEvent(s, ev) : s));
        },
        ac.signal,
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      setState((s) =>
        s
          ? {
              ...s,
              isRunning: false,
              chatMessages: [
                ...s.chatMessages,
                {
                  id: `err_${Date.now()}`,
                  role: "system",
                  content: `Run stream error: ${message}`,
                },
              ],
            }
          : s,
      );
    }
  }

  function feedback(message: string) {
    const normalizedFeedback =
      message.trim() || "The email hooks are too generic. Use funding and LinkedIn events.";

    setState((current) => {
      if (!current) {
        return current;
      }

      const fromVersion = current.currentVersion;
      const orgId = getCurrentOrg(current).id;
      const next = createNextVersion(current, normalizedFeedback);
      clearTimers();
      abortStream();

      if (isAgentOrgOfflineMock()) {
        streamGenerationOffline(next.task, next.currentVersion);
      } else {
        void (async () => {
          await submitFeedbackToApi(orgId, fromVersion, normalizedFeedback);
          streamGenerationFromApi(next.task, next.currentVersion);
        })();
      }
      return next;
    });
  }

  function version(versionNumber: number) {
    setState((current) => (current ? switchVersion(current, versionNumber) : current));
  }

  function streamGenerationOffline(task: string, versionNumber: number) {
    const events = createGenerationEvents(task, versionNumber);

    events.forEach((event, index) => {
      const timer = window.setTimeout(() => {
        setState((current) => (current ? reduceCanvasEvent(current, event) : current));
      }, 260 * index + 160);
      timersRef.current.push(timer);
    });
  }

  return {
    state,
    currentOrg,
    begin,
    reset,
    approve,
    markMain,
    select,
    changeTab,
    run,
    feedback,
    version,
  };
}
