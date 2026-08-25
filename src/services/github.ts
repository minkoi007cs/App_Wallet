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

// ──────────────── GITHUB CREDENTIALS (in-memory, will move to OAuth) ────────────────

let activeGitHubToken: string | null = null;
let activeGitHubUsername: string = '';

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

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) throw new Error('Not authenticated. Please sign in.');
}

// ──────────────── CONNECTION STATUS (real check, not hardcoded) ────────────────

export async function getGitHubConnectionStatus(): Promise<{
  isConnected: boolean;
  accountName?: string;
}> {
  // Check if we have a token and it works
  if (!activeGitHubToken) {
    return { isConnected: false };
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${activeGitHubToken}`,
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
    // Token invalid or network error
  }

  return { isConnected: false };
}

// ──────────────── FETCH REAL GITHUB REPOSITORIES VIA REST API ────────────────

export async function fetchUserGitHubRepositories(): Promise<GitHubRepoItem[]> {
  if (!activeGitHubToken && !activeGitHubUsername) {
    throw new Error('GitHub not connected. Please enter your GitHub username or connect via OAuth.');
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'App-Wallet-Client',
  };

  if (activeGitHubToken) {
    headers.Authorization = `token ${activeGitHubToken}`;
  }

  const apiUrl = activeGitHubToken
    ? 'https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member&sort=updated'
    : `https://api.github.com/users/${encodeURIComponent(activeGitHubUsername)}/repos?per_page=100&sort=updated`;

  const res = await fetch(apiUrl, { headers });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const rawData = await res.json();
  if (!Array.isArray(rawData)) return [];

  return rawData.map((item: any) => ({
    id: String(item.id),
    owner: item.owner?.login || activeGitHubUsername,
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
  } catch {
    // Non-critical — commit info is supplementary
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
