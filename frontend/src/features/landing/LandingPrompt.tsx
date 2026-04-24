"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

const examples = [
  "Research 3 AI startups and write cold outreach emails",
  "Analyze competitor pricing and summarize findings",
  "Scrape job postings and extract skills trends",
];

interface LandingPromptProps {
  onCreate: (task: string) => void;
}

export function LandingPrompt({ onCreate }: LandingPromptProps) {
  const [task, setTask] = useState(examples[0]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070a12] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.24),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.22),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-cyan-100 shadow-2xl shadow-cyan-500/10 backdrop-blur">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          UI-first AgentOrg prototype
        </div>

        <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] text-white md:text-7xl">
          Describe a task. Watch an AI org form around it.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-slate-300">
          One prompt opens a live workspace where teams, agents, tools, traces, feedback, and versions stay in view.
        </p>

        <div className="mt-10 w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <textarea
            value={task}
            onChange={(event) => setTask(event.target.value)}
            rows={4}
            className="min-h-36 w-full resize-none rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5 text-left text-lg leading-7 text-white outline-none ring-cyan-400/40 transition placeholder:text-slate-500 focus:ring-4"
            placeholder="What should your AI org do?"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setTask(example)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
                >
                  {example}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onCreate(task)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!task.trim()}
            >
              Create Org
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
