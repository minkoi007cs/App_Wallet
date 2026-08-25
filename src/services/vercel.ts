import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type IntegrationRow = Database['public']['Tables']['project_integrations']['Row'];

export interface VercelProjectItem {
  id: string;
  name: string;
  production_url: string;
  framework?: string;
  gitRepo?: string;
  gitOwner?: string;
  updatedAt?: number;
}

export interface LinkVercelInput {
  project_id: string;
  name: string;
  production_url: string;
  latest_deployment_url?: string;
  latest_deployment_status?: string;
}

// ──────────────── VERCEL CREDENTIALS (persisted in localStorage) ────────────────

const VERCEL_STORAGE_KEY = 'app_wallet_vercel_config';
let activeVercelToken: string | null = null;

export async function configureVercelCredentials(config: { token?: string }) {
  if (config.token !== undefined) {
    activeVercelToken = config.token.trim() || null;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        VERCEL_STORAGE_KEY,
        JSON.stringify({ token: activeVercelToken })
      );
    } catch {
      // Non-critical local storage fallback
    }
  }
}

export function getVercelConfig() {
  if (!activeVercelToken && typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(VERCEL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token) activeVercelToken = parsed.token;
      }
    } catch {
      // ignore
    }
  }

  return {
    token: activeVercelToken,
  };
}

export async function getVercelConnectionStatus(): Promise<{
  isConnected: boolean;
  username?: string;
}> {
  const config = getVercelConfig();
  if (!config.token) return { isConnected: false };

  try {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return { isConnected: true, username: data.user?.username || data.user?.email || 'Vercel User' };
    }
  } catch {
    // Network error or invalid token
  }

  return { isConnected: false };
}

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) throw new Error('Not authenticated. Please sign in.');
}

// ──────────────── INTEGRATIONS CRUD ────────────────

export async function fetchProjectIntegrations(projectId: string): Promise<IntegrationRow[]> {
  await requireAuth();

  const { data, error } = await (supabase.from('project_integrations') as any)
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;
  return (data || []) as IntegrationRow[];
}

export async function fetchAvailableVercelProjects(): Promise<VercelProjectItem[]> {
  await requireAuth();

  const config = getVercelConfig();

  // 1. Direct Vercel REST API if token is configured
  if (config.token) {
    try {
      const res = await fetch('https://api.vercel.com/v9/projects?limit=100', {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const projects = data.projects || [];
        return projects.map((p: any) => {
          let prodUrl = p.targets?.production?.url;
          if (!prodUrl && p.alias && p.alias.length > 0) {
            prodUrl = p.alias[0]?.domain || p.alias[0];
          }
          if (!prodUrl) {
            prodUrl = `${p.name}.vercel.app`;
          }

          if (!prodUrl.startsWith('http://') && !prodUrl.startsWith('https://')) {
            prodUrl = `https://${prodUrl}`;
          }

          return {
            id: p.id,
            name: p.name,
            production_url: prodUrl,
            framework: p.framework || 'nextjs',
            gitRepo: p.link?.repo,
            gitOwner: p.link?.org,
            updatedAt: p.updatedAt,
          };
        });
      }
    } catch {
      // Fallback to Edge function below
    }
  }

  // 2. Fallback to Supabase Edge function
  try {
    const { data, error } = await supabase.functions.invoke('vercel-sync', {
      body: { action: 'list_projects' },
    });

    if (error) return [];
    if (!data?.projects) return [];

    return data.projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      production_url: p.targets?.production?.url
        ? `https://${p.targets.production.url}`
        : `https://${p.name}.vercel.app`,
      framework: p.framework || 'nextjs',
      gitRepo: p.link?.repo,
      gitOwner: p.link?.org,
      updatedAt: p.updatedAt,
    }));
  } catch {
    return [];
  }
}

export async function linkVercelProjectToApp(input: LinkVercelInput): Promise<IntegrationRow> {
  await requireAuth();

  const payload = {
    project_id: input.project_id,
    provider: 'vercel' as const,
    external_id: `ver-${Date.now()}`,
    name: input.name,
    status: 'confirmed' as const,
    production_url: input.production_url,
    latest_deployment_url: input.latest_deployment_url || input.production_url,
    latest_deployment_status: input.latest_deployment_status || 'READY',
    latest_deployment_at: new Date().toISOString(),
    metadata: {},
  };

  const { data, error } = await (supabase.from('project_integrations') as any)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as IntegrationRow;
}

export async function unlinkVercelProjectFromApp(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase.from('project_integrations').delete().eq('id', id);
  if (error) throw error;
}
