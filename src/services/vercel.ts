import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type IntegrationRow = Database['public']['Tables']['project_integrations']['Row'];

export interface VercelProjectItem {
  id: string;
  name: string;
  production_url: string;
  framework: string;
}

export interface LinkVercelInput {
  project_id: string;
  name: string;
  production_url: string;
  latest_deployment_url?: string;
  latest_deployment_status?: string;
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

  const { data, error } = await supabase.functions.invoke('vercel-sync', {
    body: { action: 'list_projects' },
  });

  if (error) throw error;
  if (!data?.projects) return [];

  return data.projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    production_url: p.targets?.production?.url
      ? `https://${p.targets.production.url}`
      : `https://${p.name}.vercel.app`,
    framework: p.framework || 'nextjs',
  }));
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
