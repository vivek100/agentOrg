-- AgentOrg Phase 1: org + version persistence for generate flow

CREATE TABLE IF NOT EXISTS agentorg_orgs (
  id TEXT PRIMARY KEY,
  task TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agentorg_org_versions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES agentorg_orgs (id) ON DELETE CASCADE,
  version INT NOT NULL,
  status TEXT NOT NULL,
  spec JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, version)
);

CREATE INDEX IF NOT EXISTS agentorg_org_versions_org_id_idx ON agentorg_org_versions (org_id);
