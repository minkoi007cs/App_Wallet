import { supabase } from '@/lib/supabase/client';
import { Database, RepoRole } from '@/types/database';
import { createProject } from '@/services/projects';

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

// Storage for user GitHub credentials (PAT or Username)
let activeGitHubToken: string | null = null;
let activeGitHubUsername: string = 'minkoi007cs';

export function configureGitHubCredentials(config: { token?: string; username?: string }) {
  if (config.token !== undefined) activeGitHubToken = config.token.trim() || null;
  if (config.username) activeGitHubUsername = config.username.trim();
}

export function getGitHubConfig() {
  return {
    token: activeGitHubToken,
    username: activeGitHubUsername,
  };
}

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
];

export async function getGitHubConnectionStatus(): Promise<{
  isConnected: boolean;
  accountName?: string;
}> {
  return { isConnected: true, accountName: activeGitHubUsername };
}

// ──────────────── FETCH REAL GITHUB REPOSITORIES VIA REST API ────────────────

export async function fetchUserGitHubRepositories(): Promise<GitHubRepoItem[]> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'App-Wallet-Client',
    };

    if (activeGitHubToken) {
      headers.Authorization = `token ${activeGitHubToken}`;
    }

    const apiUrl = activeGitHubToken
      ? 'https://api.github.com/user/repos?per_page=100&sort=updated'
      : `https://api.github.com/users/${encodeURIComponent(activeGitHubUsername)}/repos?per_page=100&sort=updated`;

    const res = await fetch(apiUrl, { headers });

    if (res.ok) {
      const rawData = await res.json();
      if (Array.isArray(rawData)) {
        return rawData.map((item: any) => ({
          id: String(item.id),
          owner: item.owner?.login || activeGitHubUsername,
          name: item.name,
          full_name: item.full_name,
          url: item.html_url,
          default_branch: item.default_branch || 'main',
          visibility: item.private ? 'private' : 'public',
          primary_language: item.language || 'TypeScript',
          stars_count: item.stargazers_count || 0,
          forks_count: item.forks_count || 0,
          open_issues_count: item.open_issues_count || 0,
        }));
      }
    }
  } catch (err) {
    console.warn('fetchUserGitHubRepositories API warning:', err);
  }

  // Fallback if network blocks or username has no public repos
  return [
    {
      id: '101',
      owner: activeGitHubUsername,
      name: 'App_Wallet',
      full_name: `${activeGitHubUsername}/App_Wallet`,
      url: `https://github.com/${activeGitHubUsername}/App_Wallet`,
      default_branch: 'main',
      visibility: 'public',
      primary_language: 'TypeScript',
      stars_count: 5,
      forks_count: 0,
      open_issues_count: 0,
    },
  ];
}

// ──────────────── FETCH REAL LATEST COMMIT FOR A REPO ────────────────

export async function fetchRealCommitInfo(owner: string, repo: string): Promise<{
  sha: string;
  message: string;
  author: string;
  date: string;
} | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'App-Wallet-Client',
    };
    if (activeGitHubToken) {
      headers.Authorization = `token ${activeGitHubToken}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
    if (res.ok) {
      const data = await res.json();
      const firstCommit = data?.[0];
      if (firstCommit) {
        return {
          sha: firstCommit.sha?.substring(0, 7) || 'head',
          message: firstCommit.commit?.message || 'Updated repository',
          author: firstCommit.commit?.author?.name || owner,
          date: firstCommit.commit?.author?.date || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('fetchRealCommitInfo warning:', err);
  }
  return null;
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

  // Try fetching real latest commit info from GitHub REST API
  const realCommit = await fetchRealCommitInfo(input.owner, input.name);

  const payload = {
    project_id: input.project_id,
    provider: 'github' as const,
    external_id: `gh-${Date.now()}`,
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
    latest_commit_sha: realCommit?.sha || 'main-head',
    latest_commit_message: realCommit?.message || 'Initial linked GitHub repository',
    latest_commit_author: realCommit?.author || input.owner,
    latest_commit_date: realCommit?.date || new Date().toISOString(),
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

// ──────────────── AUTO-IMPORT ALL REAL GITHUB REPOS AS PROJECTS ────────────────

export async function importAllGitHubReposAsProjects(): Promise<number> {
  const realRepos = await fetchUserGitHubRepositories();
  let importedCount = 0;

  for (const repo of realRepos) {
    try {
      const createdProject = await createProject({
        name: repo.name,
        description: `Imported from GitHub ${repo.full_name} (${repo.primary_language})`,
        status: 'active',
        priority: 'medium',
        progress: 0,
        tags: [repo.primary_language, 'GitHub'],
      });

      await linkRepositoryToProject({
        project_id: createdProject.id,
        owner: repo.owner,
        name: repo.name,
        url: repo.url,
        role: 'frontend',
        default_branch: repo.default_branch,
        primary_language: repo.primary_language,
        stars_count: repo.stars_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
      });

      importedCount++;
    } catch (err) {
      console.warn(`Failed to auto-import ${repo.full_name}:`, err);
    }
  }

  return importedCount;
}
