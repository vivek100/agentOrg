import { OrgSpecSchema, type OrgSpec } from "@/lib/contracts";
import { getInsForgeServerClient } from "./client";

/**
 * Upserts org row and inserts org version with full `OrgSpec` JSON.
 * No-ops when InsForge env is not configured or insert fails (generation still succeeds).
 */
export async function persistOrgVersionIfConfigured(spec: OrgSpec): Promise<void> {
  const parsed = OrgSpecSchema.safeParse(spec);
  if (!parsed.success) {
    console.warn("[agentorg] skip persist: invalid OrgSpec", parsed.error.flatten());
    return;
  }

  const client = getInsForgeServerClient();
  if (!client) {
    return;
  }

  const row = parsed.data;
  const versionRowId = `${row.id}_v${row.version}`;

  try {
    const orgUpsert = await client.database
      .from("agentorg_orgs")
      .upsert([{ id: row.id, task: row.task }], { onConflict: "id" });

    if (orgUpsert.error) {
      console.warn("[agentorg] agentorg_orgs upsert:", orgUpsert.error.message);
      return;
    }

    const verUpsert = await client.database
      .from("agentorg_org_versions")
      .upsert(
        [
          {
            id: versionRowId,
            org_id: row.id,
            version: row.version,
            status: row.status,
            spec: row as unknown as Record<string, unknown>,
          },
        ],
        { onConflict: "org_id,version" },
      );

    if (verUpsert.error) {
      console.warn("[agentorg] agentorg_org_versions upsert:", verUpsert.error.message);
    }
  } catch (e) {
    console.warn("[agentorg] persist exception:", e);
  }
}
