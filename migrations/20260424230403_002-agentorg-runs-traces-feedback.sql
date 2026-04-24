-- Runs, append-only trace stream, and user feedback (Phase 1E / 1F)

CREATE TABLE IF NOT EXISTS agentorg_runs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES agentorg_orgs (id) ON DELETE CASCADE,
  org_version INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  final_output JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agentorg_trace_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES agentorg_runs (id) ON DELETE CASCADE,
  seq INT NOT NULL,
  event JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, seq)
);

CREATE INDEX IF NOT EXISTS agentorg_trace_events_run_id_seq_idx ON agentorg_trace_events (run_id, seq);

CREATE TABLE IF NOT EXISTS agentorg_feedback (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES agentorg_orgs (id) ON DELETE CASCADE,
  org_version INT,
  run_id TEXT REFERENCES agentorg_runs (id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agentorg_feedback_org_id_idx ON agentorg_feedback (org_id);
