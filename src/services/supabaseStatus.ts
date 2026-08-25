/**
 * Supabase Health Status & Pause Detector Service
 *
 * Checks if a Supabase project is ACTIVE, PAUSED (free-tier inactivity),
 * UNREACHABLE, or UNCONFIGURED, and provides direct links to the Supabase Console.
 */

export type SupabaseProjectStatus = 'active' | 'paused' | 'unreachable' | 'error' | 'unconfigured';

export interface SupabaseHealthResult {
  status: SupabaseProjectStatus;
  ref: string | null;
  latencyMs?: number;
  message: string;
  dashboardUrl: string | null;
  checkedAt: string;
}

/**
 * Extracts project ref from various Supabase URL formats:
 * - https://xyz123.supabase.co
 * - https://supabase.com/dashboard/project/xyz123
 * - xyz123
 */
export function extractSupabaseRef(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();

  // Pattern 1: https://xyz.supabase.co
  const domainMatch = trimmed.match(/https?:\/\/([a-z0-9_-]+)\.supabase\.co/i);
  if (domainMatch && domainMatch[1]) {
    return domainMatch[1];
  }

  // Pattern 2: https://supabase.com/dashboard/project/xyz
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return dashboardMatch[1];
  }

  // Pattern 3: exact alphanumeric project ref (e.g. 20 chars 'ymunwzjmemxifjxsiugz')
  if (/^[a-z0-9]{20}$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Normalizes any Supabase input into a canonical API URL (https://<ref>.supabase.co)
 */
export function normalizeSupabaseApiUrl(rawUrl?: string | null): string | null {
  const ref = extractSupabaseRef(rawUrl);
  if (!ref) return null;
  return `https://${ref}.supabase.co`;
}

/**
 * Returns the Supabase web dashboard URL for a given project ref
 */
export function getSupabaseDashboardUrl(rawUrl?: string | null): string | null {
  const ref = extractSupabaseRef(rawUrl);
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}`;
}

/**
 * Probes the live health endpoint of a Supabase project.
 * Detects whether the project is running or paused due to inactivity.
 */
export async function checkSupabaseHealth(
  rawUrl?: string | null,
  customAnonKey?: string
): Promise<SupabaseHealthResult> {
  const checkedAt = new Date().toISOString();
  const ref = extractSupabaseRef(rawUrl);

  if (!rawUrl || !ref) {
    return {
      status: 'unconfigured',
      ref: null,
      message: 'Supabase URL not configured for this project',
      dashboardUrl: null,
      checkedAt,
    };
  }

  const apiUrl = `https://${ref}.supabase.co`;
  const dashboardUrl = `https://supabase.com/dashboard/project/${ref}`;

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (customAnonKey) {
      headers.apikey = customAnonKey;
      headers.Authorization = `Bearer ${customAnonKey}`;
    }

    // Health probe: Supabase auth health endpoint is public on all instances
    const healthUrl = `${apiUrl}/auth/v1/health`;
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      return {
        status: 'active',
        ref,
        latencyMs,
        message: `Active & Healthy (${latencyMs}ms response time)`,
        dashboardUrl,
        checkedAt,
      };
    }

    // Supabase paused instances return 503, 504, or specific pause message
    if (res.status === 503 || res.status === 504 || res.status === 521 || res.status === 523) {
      return {
        status: 'paused',
        ref,
        latencyMs,
        message: 'Project is PAUSED due to free-tier inactivity. Open Supabase Console to unpause.',
        dashboardUrl,
        checkedAt,
      };
    }

    // If 401 or 404 on health, try querying root rest endpoint
    const restRes = await fetch(`${apiUrl}/rest/v1/`, {
      method: 'HEAD',
      headers,
    }).catch(() => null);

    if (restRes && (restRes.ok || restRes.status === 401)) {
      return {
        status: 'active',
        ref,
        latencyMs,
        message: `Active & Responding (${latencyMs}ms)`,
        dashboardUrl,
        checkedAt,
      };
    }

    return {
      status: 'paused',
      ref,
      latencyMs,
      message: `Database instance unreachable (HTTP ${res.status}). It may be paused.`,
      dashboardUrl,
      checkedAt,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('timeout');

    return {
      status: isTimeout ? 'unreachable' : 'paused',
      ref,
      latencyMs,
      message: isTimeout
        ? 'Connection timed out (>6s). Project may be paused or starting up.'
        : 'Network connection failed. Instance may be paused by Supabase.',
      dashboardUrl,
      checkedAt,
    };
  }
}
