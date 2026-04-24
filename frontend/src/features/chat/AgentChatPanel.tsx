"use client";

import { Bot, Send, UserRound } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../workspace/types";

interface AgentChatPanelProps {
  messages: ChatMessage[];
  onFeedback: (message: string) => void;
  isGenerating: boolean;
}

export function AgentChatPanel({ messages, onFeedback, isGenerating }: AgentChatPanelProps) {
  const [draft, setDraft] = useState("");

  function submit() {
    if (!draft.trim()) {
      return;
    }

    onFeedback(draft);
    setDraft("");
  }

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950/72 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Agent Chat</p>
          <p className="text-xs text-slate-400">Plain-language design and iteration stream</p>
        </div>
        <span
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium",
            isGenerating ? "bg-cyan-400/15 text-cyan-200" : "bg-emerald-400/15 text-emerald-200",
          )}
        >
          {isGenerating ? "Streaming" : "Ready"}
        </span>
      </div>

      <div className="scrollbar-clean min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 rounded-lg border p-3",
              message.role === "user"
                ? "border-cyan-300/20 bg-cyan-300/10"
                : message.role === "system"
                  ? "border-emerald-300/20 bg-emerald-300/10"
                  : "border-white/10 bg-white/[0.04]",
            )}
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
              {message.role === "user" ? (
                <UserRound className="h-4 w-4 text-cyan-200" />
              ) : (
                <Bot className="h-4 w-4 text-violet-200" />
              )}
            </div>
            <p className="text-sm leading-6 text-slate-200">{message.content}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
            placeholder="Ask for changes or add targeted feedback..."
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Feedback creates a new org version.</p>
              <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              Send
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
