import { supabase } from '@/lib/supabase/client';
import { Database, HealthState, ProjectPriority, ProjectStatus } from '@/types/database';
import { CreateProjectInput } from '@/lib/validation/project';

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type ProjectRepoRow = Database['public']['Tables']['project_repositories']['Row'];
export type ProjectIntegrationRow = Database['public']['Tables']['project_integrations']['Row'];

export interface ProjectWithDetails extends ProjectRow {
  repositories?: ProjectRepoRow[];
  integrations?: ProjectIntegrationRow[];
}

export interface ProjectFilterOptions {
  searchQuery?: string;
  status?: ProjectStatus | 'all';
  priority?: ProjectPriority | 'all';
  healthStatus?: HealthState | 'all';
  sortBy?: 'last_activity_at' | 'created_at' | 'name' | 'priority' | 'progress';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  total: number;
  active: number;
  paused: number;
  completed: number;
  ideas: number;
  needsAttention: number;
}

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) throw new Error('Not authenticated. Please sign in.');
  return userId;
}

// ──────────────── FETCH ────────────────

export async function fetchProjects(filters: ProjectFilterOptions = {}): Promise<ProjectWithDetails[]> {
  await requireAuth();

  let query = (supabase.from('projects') as any).select(
    '*, repositories:project_repositories(*), integrations:project_integrations(*)'
  );

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }
  if (filters.healthStatus && filters.healthStatus !== 'all') {
    query = query.eq('health_status', filters.healthStatus);
  }

  const sortBy = filters.sortBy || 'last_activity_at';
  const sortOrder = filters.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;
  if (error) throw error;

  let result = (data || []) as ProjectWithDetails[];

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return result;
}

export async function fetchProjectById(id: string): Promise<ProjectWithDetails | null> {
  await requireAuth();

  const { data, error } = await (supabase.from('projects') as any)
    .select('*, repositories:project_repositories(*), integrations:project_integrations(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }

  return data as ProjectWithDetails;
}

// ──────────────── CREATE ────────────────

export async function createProject(input: CreateProjectInput): Promise<ProjectWithDetails> {
  const userId = await requireAuth();

  const payload: ProjectInsert = {
    user_id: userId,
    name: input.name,
    description: input.description || null,
    status: input.status,
    priority: input.priority,
    progress: input.progress,
    start_date: input.start_date || null,
    target_date: input.target_date || null,
    tags: input.tags,
    health_status: 'healthy',
    health_reasons: ['Project created'],
    last_activity_at: new Date().toISOString(),
    frontend_url: input.frontend_url || null,
    backend_url: input.backend_url || null,
    supabase_url: input.supabase_url || null,
    metadata: {},
  };

  const { data, error } = await (supabase.from('projects') as any)
    .insert(payload)
    .select('*, repositories:project_repositories(*), integrations:project_integrations(*)')
    .single();

  if (error) throw error;
  return data as ProjectWithDetails;
}

// ──────────────── UPDATE ────────────────

export async function updateProject(
  id: string,
  updates: Partial<ProjectRow> | Partial<CreateProjectInput>
): Promise<ProjectWithDetails> {
  await requireAuth();

  const { data, error } = await (supabase.from('projects') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, repositories:project_repositories(*), integrations:project_integrations(*)')
    .single();

  if (error) throw error;
  return data as ProjectWithDetails;
}

// ──────────────── DELETE ────────────────

export async function deleteProject(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ──────────────── DASHBOARD STATS ────────────────

export function computeDashboardStats(projects: ProjectWithDetails[]): DashboardStats {
  return {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    paused: projects.filter((p) => p.status === 'paused').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    ideas: projects.filter((p) => p.status === 'idea').length,
    needsAttention: projects.filter(
      (p) => p.health_status === 'needs_attention' || p.health_status === 'critical'
    ).length,
  };
}

// fetchDashboardStats kept for backward compat but now uses computeDashboardStats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const projects = await fetchProjects();
  return computeDashboardStats(projects);
}
