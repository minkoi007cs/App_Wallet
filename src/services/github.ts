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

// ──────────────── GITHUB CREDENTIALS (persisted in AsyncStorage & external_accounts) ────────────────

const GITHUB_STORAGE_KEY = 'app_wallet_github_config';

let activeGitHubToken: string | null = null;
let activeGitHubUsername: string = '';

export async function configureGitHubCredentials(config: { token?: string; username?: string }) {
  if (config.token !== undefined) activeGitHubToken = config.token.trim() || null;
  if (config.username !== undefined) activeGitHubUsername = config.username.trim();

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        GITHUB_STORAGE_KEY,
        JSON.stringify({ token: activeGitHubToken, username: activeGitHubUsername })
      );
    } catch {
      // Non-critical local storage fallback
    }
  }
}

export function getGitHubConfig() {
  if (!activeGitHubUsername && typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(GITHUB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token) activeGitHubToken = parsed.token;
        if (parsed.username) activeGitHubUsername = parsed.username;
      }
    } catch {
      // ignore
    }
  }

  return {
    token: activeGitHubToken,
    username: activeGitHubUsername,
  };
}

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) throw new Error('Not authenticated. Please sign in.');
}

// ──────────────── CONNECTION STATUS (real check with token or public user) ────────────────

export async function getGitHubConnectionStatus(): Promise<{
  isConnected: boolean;
  accountName?: string;
}> {
  const config = getGitHubConfig();
  const token = config.token;
  const username = config.username;

  if (token) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'App-Wallet-Client',
        },
      });
      if (res.ok) {
        const user = await res.json();
        activeGitHubUsername = user.login;
        return { isConnected: true, accountName: user.login };
      }
    } catch {
      // Token invalid
    }
  }

  if (username) {
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'App-Wallet-Client',
        },
      });
      if (res.ok) {
        const user = await res.json();
        return { isConnected: true, accountName: user.login };
      }
    } catch {
      // Network error
    }
  }

  return { isConnected: false };
}

// ──────────────── FETCH REAL GITHUB REPOSITORIES VIA REST API ────────────────

export async function fetchUserGitHubRepositories(): Promise<GitHubRepoItem[]> {
  const config = getGitHubConfig();
  const token = config.token?.trim();
  const username = config.username?.trim() || 'minkoi007cs';

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'App-Wallet-Client',
  };

  let rawData: any[] = [];

  // 1. Try authenticated endpoint if token is provided
  if (token) {
    try {
      const authHeaders = {
        ...headers,
        Authorization: token.startsWith('Bearer ') || token.startsWith('token ') ? token : `Bearer ${token}`,
      };
      const res = await fetch(
        'https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member&sort=updated',
        { headers: authHeaders }
      );
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) rawData = json;
      }
    } catch {
      // Fallback to public endpoint below
    }
  }

  // 2. Fallback to public repos by username if token wasn't provided or returned 401
  if (!rawData || rawData.length === 0) {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      { headers }
    );

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`GitHub user "${username}" was not found.`);
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (Array.isArray(json)) rawData = json;
  }

  if (!Array.isArray(rawData)) return [];

  return rawData.map((item: any) => ({
    id: String(item.id),
    owner: item.owner?.login || username,
    name: item.name,
    full_name: item.full_name,
    url: item.html_url,
    default_branch: item.default_branch || 'main',
    visibility: item.private ? 'private' : 'public',
    primary_language: item.language || 'Unknown',
    stars_count: item.stargazers_count || 0,
    forks_count: item.forks_count || 0,
    open_issues_count: item.open_issues_count || 0,
  }));
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
    const config = getGitHubConfig();
    if (config.token) {
      headers.Authorization =
        config.token.startsWith('Bearer ') || config.token.startsWith('token ')
          ? config.token
          : `Bearer ${config.token}`;
    }

    let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
    if (!res.ok && res.status === 401 && headers.Authorization) {
      // Retry without invalid token for public repos
      delete headers.Authorization;
      res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
    }

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
  } catch {
    // Commit info optional
  }

  return null;
}

// ──────────────── REPOSITORY CRUD ────────────────

export async function fetchProjectRepositories(projectId: string): Promise<RepoRow[]> {
  await requireAuth();

  const { data, error } = await (supabase.from('project_repositories') as any)
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;
  return (data || []) as RepoRow[];
}

export async function linkRepositoryToProject(input: LinkRepoInput): Promise<RepoRow> {
  await requireAuth();

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

  const { data, error } = await (supabase.from('project_repositories') as any)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as RepoRow;
}

export async function unlinkRepositoryFromProject(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase.from('project_repositories').delete().eq('id', id);
  if (error) throw error;
}

// ──────────────── ACTIVITY EVENTS ────────────────

export async function fetchProjectActivityEvents(projectId?: string): Promise<ActivityEventRow[]> {
  await requireAuth();

  let query = (supabase.from('activity_events') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ActivityEventRow[];
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
        tags: [repo.primary_language, 'GitHub'].filter(Boolean),
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
