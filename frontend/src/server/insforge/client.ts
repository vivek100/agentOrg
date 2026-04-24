import { createClient, type InsForgeClient } from "@insforge/sdk";

let cached: InsForgeClient | null = null;

/**
 * Server-only InsForge client for database writes.
 * Prefer `INSFORGE_SERVICE_KEY` (service / access key) in `anonKey` so inserts are not blocked by anon RLS.
 */
export function getInsForgeServerClient(): InsForgeClient | null {
  const baseUrl =
    process.env.INSFORGE_URL?.trim() ||
    process.env.NEXT_PUBLIC_INSFORGE_URL?.trim() ||
    "";
  const anonKey =
    process.env.INSFORGE_SERVICE_KEY?.trim() ||
    process.env.INSFORGE_ACCESS_API_KEY?.trim() ||
    process.env.INSFORGE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY?.trim() ||
    "";

  if (!baseUrl || !anonKey) {
    return null;
  }

  if (!cached) {
    cached = createClient({
      baseUrl,
      anonKey,
      isServerMode: true,
    });
  }

  return cached;
}
