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

// Preview / Fallback Vercel projects
const FALLBACK_VERCEL_PROJECTS: VercelProjectItem[] = [
  {
    id: 'v-101',
    name: 'ai-study-assistant-web',
    production_url: 'https://ai-study-assistant.vercel.app',
    framework: 'nextjs',
  },
  {
    id: 'v-102',
    name: 'app-wallet-dashboard',
    production_url: 'https://app-wallet.vercel.app',
    framework: 'expo-web',
  },
  {
    id: 'v-103',
    name: 'subject-manager-portal',
    production_url: 'https://subject-manager.vercel.app',
    framework: 'react',
  },
];

let localIntegrationsStore: IntegrationRow[] = [
  {
    id: 'int-demo-1',
    project_id: 'demo-1',
    provider: 'vercel',
    external_id: 'v-101',
    name: 'ai-study-assistant-web',
    status: 'confirmed',
    production_url: 'https://ai-study-assistant.vercel.app',
    latest_deployment_url: 'https://ai-study-assistant-a8f7c9.vercel.app',
    latest_deployment_status: 'READY',
    latest_deployment_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    metadata: { framework: 'nextjs' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchProjectIntegrations(projectId: string): Promise<IntegrationRow[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('project_integrations') as any)
        .select('*')
        .eq('project_id', projectId);
      if (!error && data) return data as IntegrationRow[];
    }
  } catch (err) {
    console.warn('fetchProjectIntegrations notice:', err);
  }

  return localIntegrationsStore.filter((i) => i.project_id === projectId);
}

export async function fetchAvailableVercelProjects(): Promise<VercelProjectItem[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await supabase.functions.invoke('vercel-sync', {
        body: { action: 'list_projects' },
      });
      if (!error && data?.projects) {
        return data.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          production_url: p.targets?.production?.url ? `https://${p.targets.production.url}` : `https://${p.name}.vercel.app`,
          framework: p.framework || 'nextjs',
        }));
      }
    }
  } catch (err) {
    console.warn('fetchAvailableVercelProjects notice:', err);
  }

  return FALLBACK_VERCEL_PROJECTS;
}

export async function linkVercelProjectToApp(input: LinkVercelInput): Promise<IntegrationRow> {
  const { data: session } = await supabase.auth.getSession();

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

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('project_integrations') as any)
      .insert(payload)
      .select()
      .single();
    if (!error && data) return data as IntegrationRow;
  }

  const created: IntegrationRow = {
    ...payload,
    id: `int-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localIntegrationsStore = [...localIntegrationsStore, created];
  return created;
}

export async function unlinkVercelProjectFromApp(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    const { error } = await supabase.from('project_integrations').delete().eq('id', id);
    if (error) throw error;
  }

  localIntegrationsStore = localIntegrationsStore.filter((i) => i.id !== id);
}
