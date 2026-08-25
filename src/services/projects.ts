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

// User's Real Projects Data
const FALLBACK_PROJECTS: ProjectWithDetails[] = [
  {
    id: 'proj-1',
    user_id: 'dev-user',
    name: 'App_Wallet',
    description: 'Personal Developer Command Center for projects, repos & deployments.',
    status: 'active',
    priority: 'critical',
    progress: 100,
    start_date: '2026-08-24',
    target_date: '2026-09-30',
    tags: ['TypeScript', 'Expo Router', 'Supabase', 'Vercel'],
    health_status: 'healthy',
    health_reasons: ['Active development in progress', 'Vercel deployment is READY'],
    last_activity_at: new Date().toISOString(),
    frontend_url: 'https://app-wallet-betrk176b-minkoi007cs-projects.vercel.app',
    backend_url: 'https://ymunwzjmemxifjxsiugz.supabase.co/functions/v1',
    supabase_url: 'https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [
      {
        id: 'repo-app-wallet',
        project_id: 'proj-1',
        provider: 'github',
        external_id: 'gh-app-wallet',
        owner: 'minkoi007cs',
        name: 'App_Wallet',
        url: 'https://github.com/minkoi007cs/App_Wallet',
        role: 'frontend',
        default_branch: 'main',
        visibility: 'public',
        primary_language: 'TypeScript',
        stars_count: 5,
        forks_count: 0,
        open_issues_count: 0,
        latest_commit_sha: '6fef633',
        latest_commit_message: 'feat: add real GitHub REST API integration',
        latest_commit_author: 'Khoi Hoang',
        latest_commit_date: new Date().toISOString(),
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'proj-2',
    user_id: 'dev-user',
    name: 'lifedashboard',
    description: 'Personal life management dashboard and daily tracking system.',
    status: 'active',
    priority: 'high',
    progress: 75,
    start_date: '2026-06-01',
    target_date: '2026-10-31',
    tags: ['TypeScript', 'React', 'Tailwind'],
    health_status: 'healthy',
    health_reasons: ['Active commits recorded'],
    last_activity_at: new Date(Date.now() - 86400 * 1000).toISOString(),
    frontend_url: 'https://lifedashboard.vercel.app',
    backend_url: '',
    supabase_url: 'https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz',
    metadata: {},
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-3',
    user_id: 'dev-user',
    name: 'fitmatch_AI',
    description: 'AI-powered fitness match & workout algorithm platform.',
    status: 'active',
    priority: 'high',
    progress: 60,
    start_date: '2026-05-15',
    target_date: '2026-11-15',
    tags: ['Python', 'FastAPI', 'AI'],
    health_status: 'healthy',
    health_reasons: ['AI model training pipeline running'],
    last_activity_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    frontend_url: 'https://fitmatch-ai.vercel.app',
    backend_url: 'https://api.fitmatch.internal',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 90 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-4',
    user_id: 'dev-user',
    name: 'TokenWallet',
    description: 'Collab project with johnnyhoang — Web3 & crypto token wallet manager.',
    status: 'active',
    priority: 'medium',
    progress: 50,
    start_date: '2026-04-01',
    target_date: '2026-12-01',
    tags: ['TypeScript', 'Web3', 'Ethers'],
    health_status: 'healthy',
    health_reasons: ['Collaborator repo linked'],
    last_activity_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    frontend_url: 'https://token-wallet.vercel.app',
    backend_url: '',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 120 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-5',
    user_id: 'dev-user',
    name: 'Canvas_AI',
    description: 'AI generative canvas and design workspace.',
    status: 'active',
    priority: 'high',
    progress: 85,
    start_date: '2026-03-01',
    target_date: '2026-09-30',
    tags: ['Python', 'PyTorch', 'Canvas'],
    health_status: 'healthy',
    health_reasons: ['6 stars on GitHub'],
    last_activity_at: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    frontend_url: 'https://canvas-ai.vercel.app',
    backend_url: 'https://backend-canvas.vercel.app',
    supabase_url: 'https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz',
    metadata: {},
    created_at: new Date(Date.now() - 150 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-6',
    user_id: 'dev-user',
    name: 'house_renting',
    description: 'House renting platform — browse and manage rental listings.',
    status: 'active',
    priority: 'medium',
    progress: 40,
    start_date: '2026-03-15',
    target_date: '2026-12-31',
    tags: ['TypeScript', 'React', 'Supabase'],
    health_status: 'healthy',
    health_reasons: ['Active development'],
    last_activity_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    frontend_url: '',
    backend_url: '',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 130 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-7',
    user_id: 'dev-user',
    name: 'learning_AI',
    description: 'AI-powered adaptive learning and education platform.',
    status: 'active',
    priority: 'high',
    progress: 55,
    start_date: '2026-04-10',
    target_date: '2026-11-30',
    tags: ['Python', 'AI', 'Education'],
    health_status: 'healthy',
    health_reasons: ['Active development'],
    last_activity_at: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
    frontend_url: '',
    backend_url: '',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 110 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-8',
    user_id: 'dev-user',
    name: 'family-management',
    description: 'Collab project with johnnyhoang — Family task and schedule management app.',
    status: 'active',
    priority: 'medium',
    progress: 35,
    start_date: '2026-05-01',
    target_date: '2027-01-31',
    tags: ['TypeScript', 'React Native', 'Firebase'],
    health_status: 'healthy',
    health_reasons: ['Collaborator repo linked'],
    last_activity_at: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    frontend_url: '',
    backend_url: '',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 100 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-9',
    user_id: 'dev-user',
    name: 'money-management',
    description: 'Collab project with emkay2007 — Personal finance tracker and budgeting tool.',
    status: 'active',
    priority: 'medium',
    progress: 45,
    start_date: '2026-02-15',
    target_date: '2026-12-31',
    tags: ['JavaScript', 'React', 'Charts'],
    health_status: 'healthy',
    health_reasons: ['Collaborator repo linked'],
    last_activity_at: new Date(Date.now() - 8 * 86400 * 1000).toISOString(),
    frontend_url: '',
    backend_url: '',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 160 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-10',
    user_id: 'dev-user',
    name: 'tbao_manage_device',
    description: 'Collab project with emkay2007 — IoT device management and monitoring dashboard.',
    status: 'active',
    priority: 'low',
    progress: 30,
    start_date: '2026-06-01',
    target_date: '2027-03-31',
    tags: ['Python', 'IoT', 'MQTT'],
    health_status: 'healthy',
    health_reasons: ['Collaborator repo linked'],
    last_activity_at: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    frontend_url: '',
    backend_url: '',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 80 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
  },
  {
    id: 'proj-11',
    user_id: 'dev-user',
    name: 'ielts',
    description: 'Collab project with emkay2007 — IELTS exam preparation and practice platform.',
    status: 'active',
    priority: 'medium',
    progress: 50,
    start_date: '2026-01-15',
    target_date: '2026-12-15',
    tags: ['TypeScript', 'Next.js', 'Education'],
    health_status: 'healthy',
    health_reasons: ['Collaborator repo linked'],
    last_activity_at: new Date(Date.now() - 12 * 86400 * 1000).toISOString(),
    frontend_url: '',
    backend_url: '',
    supabase_url: '',
    metadata: {},
    created_at: new Date(Date.now() - 200 * 86400 * 1000).toISOString(),
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
      if (!error && data) {
        let result = data as ProjectWithDetails[];
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
    }
  } catch (err) {
    console.warn('fetchProjects notice:', err);
  }

  // Filter in memory for local fallback
  let result = [...localProjectsStore];
  if (filters.status && filters.status !== 'all') {
    result = result.filter((p) => p.status === filters.status);
  }
  if (filters.priority && filters.priority !== 'all') {
    result = result.filter((p) => p.priority === filters.priority);
  }
  if (filters.healthStatus && filters.healthStatus !== 'all') {
    result = result.filter((p) => p.health_status === filters.healthStatus);
  }
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
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('projects') as any)
        .select('*, repositories:project_repositories(*), integrations:project_integrations(*)')
        .eq('id', id)
        .single();
      if (!error && data) return data as ProjectWithDetails;
    }
  } catch (err) {
    console.warn('fetchProjectById notice:', err);
  }

  const found = localProjectsStore.find((p) => p.id === id);
  return found || null;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectWithDetails> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id || 'dev-user';

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

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('projects') as any)
      .insert(payload)
      .select('*, repositories:project_repositories(*), integrations:project_integrations(*)')
      .single();

    if (error) throw error;
    return data as ProjectWithDetails;
  }

  const created: ProjectWithDetails = {
    ...payload,
    id: `proj-${Date.now()}`,
    user_id: userId,
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [],
    integrations: [],
  };

  localProjectsStore = [created, ...localProjectsStore];
  return created;
}

export async function updateProject(id: string, updates: Partial<ProjectRow> | Partial<CreateProjectInput>): Promise<ProjectWithDetails> {
  const { data: session } = await supabase.auth.getSession();

  if (session?.session?.user) {
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

  const idx = localProjectsStore.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found.');

  localProjectsStore[idx] = {
    ...localProjectsStore[idx],
    ...updates,
    updated_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
  };

  return localProjectsStore[idx];
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
    needsAttention: projects.filter((p) => p.health_status === 'needs_attention' || p.health_status === 'critical').length,
  };
}
