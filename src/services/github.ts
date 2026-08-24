import { supabase } from '@/lib/supabase/client';
import { Database, RepoRole } from '@/types/database';

export type RepoRow = Database['public']['Tables']['project_repositories']['Row'];
export type ActivityEventRow = Database['public']['Tables']['activity_events']['Row'];

export interface GitHubRepoItem {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  url: string;
  default_branch: string;
  visibility: string;
  primary_language: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface LinkRepoInput {
  project_id: string;
  owner: string;
  name: string;
  url: string;
  role: RepoRole;
  default_branch: string;
  primary_language?: string;
  stars_count?: number;
  forks_count?: number;
  open_issues_count?: number;
}

// Fallback Repositories for offline/preview mode
const FALLBACK_AVAILABLE_REPOS: GitHubRepoItem[] = [
  {
    id: '101',
    owner: 'minkoi007cs',
    name: 'App_Wallet',
    full_name: 'minkoi007cs/App_Wallet',
    url: 'https://github.com/minkoi007cs/App_Wallet',
    default_branch: 'main',
    visibility: 'public',
    primary_language: 'TypeScript',
    stars_count: 5,
    forks_count: 0,
    open_issues_count: 0,
  },
  {
    id: '102',
    owner: 'khoihoang',
    name: 'ai-study-backend',
    full_name: 'khoihoang/ai-study-backend',
    url: 'https://github.com/khoihoang/ai-study-backend',
    default_branch: 'main',
    visibility: 'public',
    primary_language: 'Python',
    stars_count: 12,
    forks_count: 3,
    open_issues_count: 2,
  },
  {
    id: '103',
    owner: 'khoihoang',
    name: 'subject-manager-mobile',
    full_name: 'khoihoang/subject-manager-mobile',
    url: 'https://github.com/khoihoang/subject-manager-mobile',
    default_branch: 'main',
    visibility: 'private',
    primary_language: 'TypeScript',
    stars_count: 8,
    forks_count: 1,
    open_issues_count: 1,
  },
];

let localLinkedReposStore: RepoRow[] = [
  {
    id: 'repo-1',
    project_id: 'demo-1',
    provider: 'github',
    external_id: '102',
    owner: 'khoihoang',
    name: 'ai-study-backend',
    url: 'https://github.com/khoihoang/ai-study-backend',
    role: 'backend',
    default_branch: 'main',
    visibility: 'public',
    primary_language: 'Python',
    stars_count: 12,
    forks_count: 3,
    open_issues_count: 2,
    latest_commit_sha: 'c9f8a1e',
    latest_commit_message: 'feat: added FastAPI embedding chunking endpoint',
    latest_commit_author: 'Khoi Hoang',
    latest_commit_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let localActivityStore: ActivityEventRow[] = [
  {
    id: 'act-1',
    project_id: 'demo-1',
    event_type: 'github_commit',
    title: 'Commit to khoihoang/ai-study-backend',
    description: 'feat: added FastAPI embedding chunking endpoint',
    metadata: { sha: 'c9f8a1e', author: 'Khoi Hoang', branch: 'main' },
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    project_id: 'demo-3',
    event_type: 'project_updated',
    title: 'Phase 4 Tasks & Milestones Shipped',
    description: 'Completed Kanban task board and timeline milestone tracking.',
    metadata: { phase: 4 },
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

export async function getGitHubConnectionStatus(): Promise<{
  isConnected: boolean;
  accountName?: string;
}> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data } = await (supabase.from('external_accounts') as any)
        .select('account_name')
        .eq('provider', 'github')
        .single();
      if (data) {
        return { isConnected: true, accountName: data.account_name || 'GitHub User' };
      }
    }
  } catch (err) {
    console.warn('GitHub connection status check notice:', err);
  }

  return { isConnected: true, accountName: 'minkoi007cs' };
}

export async function fetchUserGitHubRepositories(): Promise<GitHubRepoItem[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await supabase.functions.invoke('github-sync', {
        body: { action: 'list_user_repos' },
      });
      if (!error && data?.repos) {
        return data.repos;
      }
    }
  } catch (err) {
    console.warn('fetchUserGitHubRepositories notice:', err);
  }

  return FALLBACK_AVAILABLE_REPOS;
}

export async function fetchProjectRepositories(projectId: string): Promise<RepoRow[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('project_repositories') as any)
        .select('*')
        .eq('project_id', projectId);
      if (!error && data) return data as RepoRow[];
    }
  } catch (err) {
    console.warn('fetchProjectRepositories notice:', err);
  }

  return localLinkedReposStore.filter((r) => r.project_id === projectId);
}

export async function linkRepositoryToProject(input: LinkRepoInput): Promise<RepoRow> {
  const { data: session } = await supabase.auth.getSession();

  const payload = {
    project_id: input.project_id,
    provider: 'github' as const,
    external_id: `ext-${Date.now()}`,
    owner: input.owner,
    name: input.name,
    url: input.url,
    role: input.role,
    default_branch: input.default_branch || 'main',
    visibility: 'public',
    primary_language: input.primary_language || 'TypeScript',
    stars_count: input.stars_count || 0,
    forks_count: input.forks_count || 0,
    open_issues_count: input.open_issues_count || 0,
    latest_commit_sha: 'main-head',
    latest_commit_message: 'Initial project repository link',
    latest_commit_author: input.owner,
    latest_commit_date: new Date().toISOString(),
    metadata: {},
  };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('project_repositories') as any)
      .insert(payload)
      .select()
      .single();
    if (!error && data) return data as RepoRow;
  }

  const created: RepoRow = {
    ...payload,
    id: `repo-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localLinkedReposStore = [...localLinkedReposStore, created];
  return created;
}

export async function unlinkRepositoryFromProject(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    const { error } = await supabase.from('project_repositories').delete().eq('id', id);
    if (error) throw error;
  }
  localLinkedReposStore = localLinkedReposStore.filter((r) => r.id !== id);
}

export async function fetchProjectActivityEvents(projectId?: string): Promise<ActivityEventRow[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      let query = (supabase.from('activity_events') as any).select('*').order('created_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (!error && data) return data as ActivityEventRow[];
    }
  } catch (err) {
    console.warn('fetchProjectActivityEvents notice:', err);
  }

  if (projectId) {
    return localActivityStore.filter((a) => a.project_id === projectId);
  }
  return localActivityStore;
}
