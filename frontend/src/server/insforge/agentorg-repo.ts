import type { FeedbackPayload, FinalOutput, TraceEvent } from "@/lib/contracts";
import { jsonApiError, parseTraceEventJson } from "@/lib/contracts";
import { getInsForgeServerClient } from "./client";

export function insforgeUnavailable(): Response {
  return jsonApiError(
    503,
    "insforge_unconfigured",
    "Set INSFORGE_URL and INSFORGE_SERVICE_KEY (run `npm run env:insforge` in frontend after `npx @insforge/cli link`).",
  );
}

export function getDb() {
  return getInsForgeServerClient();
}

export async function updateVersionApproved(orgId: string, version: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  if (!db) {
    return { ok: false, message: "no_db" };
  }
  const { error } = await db.database
    .from("agentorg_org_versions")
    .update({ status: "approved" })
    .eq("org_id", orgId)
    .eq("version", version);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function setMainVersion(orgId: string, version: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  if (!db) {
    return { ok: false, message: "no_db" };
  }
  const clear = await db.database
    .from("agentorg_org_versions")
    .update({ status: "approved" })
    .eq("org_id", orgId)
    .eq("status", "main");
  if (clear.error) {
    return { ok: false, message: clear.error.message };
  }
  const set = await db.database
    .from("agentorg_org_versions")
    .update({ status: "main" })
    .eq("org_id", orgId)
    .eq("version", version);
  if (set.error) {
    return { ok: false, message: set.error.message };
  }
  return { ok: true };
}

export async function insertRun(orgId: string, orgVersion: number, runId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  if (!db) {
    return { ok: false, message: "no_db" };
  }
  const { error } = await db.database.from("agentorg_runs").insert([
    {
      id: runId,
      org_id: orgId,
      org_version: orgVersion,
      status: "running",
    },
  ]);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function insertTraceRow(runId: string, seq: number, event: TraceEvent): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  const id = `${runId}_t_${seq}`;
  await db.database.from("agentorg_trace_events").upsert(
    [
      {
        id,
        run_id: runId,
        seq,
        event: event as unknown as Record<string, unknown>,
      },
    ],
    { onConflict: "run_id,seq" },
  );
}

export async function completeRunRow(runId: string, finalOutput: FinalOutput): Promise<void> {
  const db = getDb();
  if (!db) {
    return;
  }
  await db.database
    .from("agentorg_runs")
    .update({
      status: "success",
      final_output: finalOutput as unknown as Record<string, unknown>,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

export async function insertFeedbackRow(payload: FeedbackPayload & { orgId: string }): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  if (!db) {
    return { ok: false, message: "no_db" };
  }
  const id = `fb_${crypto.randomUUID()}`;
  const { error } = await db.database.from("agentorg_feedback").insert([
    {
      id,
      org_id: payload.orgId,
      org_version: payload.orgVersion ?? null,
      run_id: payload.runId ?? null,
      target_type: payload.targetType,
      target_id: payload.targetId,
      message: payload.message,
    },
  ]);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function listTraceEvents(runId: string): Promise<TraceEvent[]> {
  const db = getDb();
  if (!db) {
    return [];
  }
  const { data, error } = await db.database
    .from("agentorg_trace_events")
    .select("event")
    .eq("run_id", runId)
    .order("seq", { ascending: true });
  if (error || !data) {
    return [];
  }
  return (data as { event: unknown }[])
    .map((row) => parseTraceEventJson(row.event))
    .filter((r): r is { success: true; data: TraceEvent } => r.success)
    .map((r) => r.data);
}

export async function getRunRow(runId: string): Promise<{
  id: string;
  org_id: string;
  org_version: number;
  status: string;
  final_output: FinalOutput | null;
} | null> {
  const db = getDb();
  if (!db) {
    return null;
  }
  const { data, error } = await db.database.from("agentorg_runs").select("*").eq("id", runId).maybeSingle();
  if (error || !data) {
    return null;
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    org_version: Number(row.org_version),
    status: String(row.status),
    final_output: (row.final_output as FinalOutput) ?? null,
  };
}

export async function listFeedbackForOrg(orgId: string): Promise<
  {
    id: string;
    org_version: number | null;
    run_id: string | null;
    target_type: string;
    target_id: string;
    message: string;
    created_at: string;
  }[]
> {
  const db = getDb();
  if (!db) {
    return [];
  }
  const { data, error } = await db.database
    .from("agentorg_feedback")
    .select("id, org_version, run_id, target_type, target_id, message, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error || !data) {
    return [];
  }
  return data as {
    id: string;
    org_version: number | null;
    run_id: string | null;
    target_type: string;
    target_id: string;
    message: string;
    created_at: string;
  }[];
}

export async function listRunsForOrg(orgId: string): Promise<
  { id: string; org_version: number; status: string; created_at: string; completed_at: string | null }[]
> {
  const db = getDb();
  if (!db) {
    return [];
  }
  const { data, error } = await db.database
    .from("agentorg_runs")
    .select("id, org_version, status, created_at, completed_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error || !data) {
    return [];
  }
  return data as {
    id: string;
    org_version: number;
    status: string;
    created_at: string;
    completed_at: string | null;
  }[];
}

export async function listVersionsForOrg(orgId: string): Promise<
  { version: number; status: string; id: string; created_at: string }[]
> {
  const db = getDb();
  if (!db) {
    return [];
  }
  const { data, error } = await db.database
    .from("agentorg_org_versions")
    .select("id, version, status, created_at")
    .eq("org_id", orgId)
    .order("version", { ascending: true });
  if (error || !data) {
    return [];
  }
  return (data as { id: string; version: number; status: string; created_at: string }[]).map((r) => ({
    version: r.version,
    status: r.status,
    id: r.id,
    created_at: r.created_at,
  }));
}
