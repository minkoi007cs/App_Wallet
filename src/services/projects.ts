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

// Initial Mock Projects Data for preview / offline fallback
const FALLBACK_PROJECTS: ProjectWithDetails[] = [
  {
    id: 'demo-1',
    user_id: 'dev-user',
    name: 'AI Study Assistant',
    description: 'Personal study assistant with document RAG and quiz engine.',
    status: 'active',
    priority: 'high',
    progress: 82,
    start_date: '2026-07-01',
    target_date: '2026-09-15',
    tags: ['React', 'FastAPI', 'Supabase', 'OpenAI'],
    health_status: 'healthy',
    health_reasons: ['Last commit was 2 hours ago', 'Production deployment is READY'],
    last_activity_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    metadata: {},
    created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [
      {
        id: 'repo-1',
        project_id: 'demo-1',
        provider: 'github',
        external_id: '101',
        owner: 'khoihoang',
        name: 'ai-study-frontend',
        url: 'https://github.com/khoihoang/ai-study-frontend',
        role: 'frontend',
        default_branch: 'main',
        visibility: 'public',
        primary_language: 'TypeScript',
        stars_count: 14,
        forks_count: 2,
        open_issues_count: 1,
        latest_commit_sha: 'a8f7c9e',
        latest_commit_message: 'feat(rag): optimized vector search similarity threshold',
        latest_commit_author: 'Khoi Hoang',
        latest_commit_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'demo-2',
    user_id: 'dev-user',
    name: 'Subject Manager',
    description: 'Curriculum and course planning tool for university students.',
    status: 'active',
    priority: 'medium',
    progress: 65,
    start_date: '2026-06-10',
    target_date: '2026-10-01',
    tags: ['Expo', 'React Native', 'TypeScript'],
    health_status: 'needs_attention',
    health_reasons: ['No GitHub commit for 18 days', '2 tasks are overdue'],
    last_activity_at: new Date(Date.now() - 18 * 86400 * 1000).toISOString(),
    metadata: {},
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'demo-3',
    user_id: 'dev-user',
    name: 'App Wallet',
    description: 'Personal Developer Command Center for projects, repos & deployments.',
    status: 'active',
    priority: 'critical',
    progress: 40,
    start_date: '2026-08-24',
    target_date: '2026-09-30',
    tags: ['Expo Router', 'Supabase', 'PostgreSQL', 'TypeScript'],
    health_status: 'healthy',
    health_reasons: ['Active development in progress'],
    last_activity_at: new Date().toISOString(),
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
];

let localProjectsStore: ProjectWithDetails[] = [...FALLBACK_PROJECTS];

export async function fetchProjects(filters: ProjectFilterOptions = {}): Promise<ProjectWithDetails[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      let query = (supabase.from('projects') as any).select('*, repositories:project_repositories(*), integrations:project_integrations(*)');

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
      if (!error && data && data.length > 0) {
        let results = data as ProjectWithDetails[];
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          results = results.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.description && p.description.toLowerCase().includes(q)) ||
              p.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return results;
      }
    }
  } catch (err) {
    console.warn('Supabase fetch query notice:', err);
  }

  // Fallback / Preview local store filter
  let results = [...localProjectsStore];

  if (filters.status && filters.status !== 'all') {
    results = results.filter((p) => p.status === filters.status);
  }
  if (filters.priority && filters.priority !== 'all') {
    results = results.filter((p) => p.priority === filters.priority);
  }
  if (filters.healthStatus && filters.healthStatus !== 'all') {
    results = results.filter((p) => p.health_status === filters.healthStatus);
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return results;
}

export async function fetchProjectById(id: string): Promise<ProjectWithDetails | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('projects') as any)
        .select('*, repositories:project_repositories(*), integrations:project_integrations(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as ProjectWithDetails;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchProjectById notice:', err);
  }

  return localProjectsStore.find((p) => p.id === id) || null;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectWithDetails> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id || 'dev-user';

  const newProjectPayload: ProjectInsert = {
    user_id: userId,
    name: input.name,
    description: input.description || null,
    status: input.status,
    priority: input.priority,
    progress: input.progress,
    start_date: input.start_date || null,
    target_date: input.target_date || null,
    tags: input.tags || [],
    health_status: 'healthy',
    health_reasons: ['Project newly initialized'],
    last_activity_at: new Date().toISOString(),
    metadata: {},
  };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('projects') as any)
      .insert(newProjectPayload)
      .select()
      .single();

    if (!error && data) {
      return data as ProjectWithDetails;
    }
  }

  // Local fallback insert
  const created: ProjectWithDetails = {
    ...newProjectPayload,
    id: `proj-${Date.now()}`,
    user_id: userId,
    name: input.name,
    description: input.description || null,
    status: input.status,
    priority: input.priority,
    progress: input.progress,
    start_date: input.start_date || null,
    target_date: input.target_date || null,
    tags: input.tags || [],
    health_status: 'healthy',
    health_reasons: ['Project newly initialized'],
    last_activity_at: new Date().toISOString(),
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
    integrations: [],
  };

  localProjectsStore = [created, ...localProjectsStore];
  return created;
}

export async function updateProject(
  id: string,
  updates: Partial<CreateProjectInput> & { health_status?: HealthState; health_reasons?: string[] }
): Promise<ProjectWithDetails> {
  const { data: session } = await supabase.auth.getSession();

  const payload: ProjectUpdate = {
    ...updates,
    last_activity_at: new Date().toISOString(),
  };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('projects') as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data as ProjectWithDetails;
    }
  }

  // Local fallback update
  const index = localProjectsStore.findIndex((p) => p.id === id);
  if (index !== -1) {
    localProjectsStore[index] = {
      ...localProjectsStore[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return localProjectsStore[index];
  }

  throw new Error(`Project ${id} not found.`);
}

export async function deleteProject(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();

  if (session?.session?.user) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  }

  localProjectsStore = localProjectsStore.filter((p) => p.id !== id);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const projects = await fetchProjects();
  return {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    paused: projects.filter((p) => p.status === 'paused').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    ideas: projects.filter((p) => p.status === 'idea').length,
    needsAttention: projects.filter((p) => p.health_status !== 'healthy').length,
  };
}
