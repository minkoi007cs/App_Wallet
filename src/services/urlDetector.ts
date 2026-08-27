import { fetchProjectById, updateProject, ProjectWithDetails } from './projects';
import { fetchProjectRepositories, GitHubRepoItem, getGitHubConfig } from './github';
import { fetchProjectIntegrations, fetchAvailableVercelProjects, IntegrationRow, VercelProjectItem } from './vercel';
import { extractSupabaseRef } from './supabaseStatus';
import { getAllManagedSupabaseProjects } from './supabaseAccounts';

export interface DetectedUrlsResult {
  frontend_url?: string;
  backend_url?: string;
  supabase_url?: string;
  sources: {
    frontend?: string;
    backend?: string;
    supabase?: string;
  };
  hasChanges: boolean;
}

/**
 * Normalizes a URL ensuring https protocol
 */
function cleanUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Probes GitHub repository files to find real Supabase configuration & URLs
 */
export async function scanRepoForSupabaseUrl(owner: string, repo: string): Promise<{ url?: string; source?: string } | null> {
  const candidateFiles = [
    'backend/.env.example',
    '.env.example',
    'frontend/.env.example',
    '.env.local.example',
    'supabase/config.toml',
    'src/lib/supabase/client.ts',
    'src/lib/supabase.ts',
    'src/supabase.ts',
    'lib/supabase.ts',
    'README.md',
  ];

  const config = getGitHubConfig();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'App-Wallet-Client',
  };
  if (config.token) {
    headers.Authorization = config.token.startsWith('Bearer ') || config.token.startsWith('token ')
      ? config.token
      : `Bearer ${config.token}`;
  }

  for (const filePath of candidateFiles) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.content && data.encoding === 'base64') {
          // Decode base64 content
          const decoded = typeof atob === 'function'
            ? atob(data.content.replace(/\s/g, ''))
            : Buffer.from(data.content, 'base64').toString('utf8');

          // Regex 1: https://<ref>.supabase.co
          const matchUrl = decoded.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/i);
          if (matchUrl && matchUrl[1]) {
            const ref = extractSupabaseRef(matchUrl[0]);
            if (ref) {
              return {
                url: `https://${ref}.supabase.co`,
                source: `GitHub Repo (${filePath})`,
              };
            }
          }

          // Regex 2: postgresql://postgres.<ref>:... or project_id = "..."
          const matchPostgres = decoded.match(/postgres\.([a-z0-9_-]+):/i);
          if (matchPostgres && matchPostgres[1]) {
            const ref = extractSupabaseRef(matchPostgres[1]);
            if (ref) {
              return {
                url: `https://${ref}.supabase.co`,
                source: `GitHub Repo (${filePath})`,
              };
            }
          }

          const matchProjectId = decoded.match(/project_id\s*=\s*["']([a-z0-9_-]+)["']/i);
          if (matchProjectId && matchProjectId[1]) {
            const ref = extractSupabaseRef(matchProjectId[1]);
            if (ref) {
              return {
                url: `https://${ref}.supabase.co`,
                source: `GitHub Repo (${filePath})`,
              };
            }
          }
        }
      }
    } catch {
      // Continue checking next candidate file
    }
  }

  return null;
}

/**
 * Auto-detects frontend, backend, and Supabase URLs from repo items and integrations
 */
export function detectUrlsFromMetadata(
  projectName: string,
  repos: (any | GitHubRepoItem)[] = [],
  integrations: IntegrationRow[] = [],
  availableVercelProjects: VercelProjectItem[] = []
): DetectedUrlsResult {
  let frontend_url: string | undefined;
  let backend_url: string | undefined;
  let supabase_url: string | undefined;

  const sources: DetectedUrlsResult['sources'] = {};

  const cleanProjectName = projectName.toLowerCase().replace(/[-_]/g, '');

  // 1. Check existing Vercel integrations linked to this project
  for (const integration of integrations) {
    if (integration.provider === 'vercel' && integration.production_url) {
      const url = cleanUrl(integration.production_url);
      const name = (integration.name || '').toLowerCase();
      if (name.includes('backend') || name.includes('api') || name.includes('server')) {
        if (!backend_url) {
          backend_url = url;
          sources.backend = `Linked Vercel Integration (${integration.name})`;
        }
      } else {
        if (!frontend_url) {
          frontend_url = url;
          sources.frontend = `Linked Vercel Integration (${integration.name})`;
        }
      }
    }
  }

  // 2. Check available Vercel projects (exact Git repo link or name matching)
  if (availableVercelProjects.length > 0) {
    // 2a. Match by connected GitHub repo
    for (const repo of repos) {
      const repoNameClean = (repo.name || '').toLowerCase().replace(/[-_]/g, '');
      for (const vp of availableVercelProjects) {
        const vpRepoClean = (vp.gitRepo || '').toLowerCase().replace(/[-_]/g, '');
        if (vpRepoClean && (vpRepoClean === repoNameClean || vpRepoClean.includes(repoNameClean))) {
          const vpName = vp.name.toLowerCase();
          if (vpName.includes('backend') || vpName.includes('api') || vpName.includes('server')) {
            if (!backend_url) {
              backend_url = cleanUrl(vp.production_url);
              sources.backend = `Vercel Git Link (${vp.name})`;
            }
          } else {
            if (!frontend_url) {
              frontend_url = cleanUrl(vp.production_url);
              sources.frontend = `Vercel Git Link (${vp.name})`;
            }
          }
        }
      }
    }

    // 2b. Match by Vercel project name similarity
    for (const vp of availableVercelProjects) {
      const cleanVpName = vp.name.toLowerCase().replace(/[-_]/g, '');
      if (cleanVpName === cleanProjectName || cleanVpName.includes(cleanProjectName) || cleanProjectName.includes(cleanVpName)) {
        const vpName = vp.name.toLowerCase();
        if (vpName.includes('backend') || vpName.includes('api') || vpName.includes('server')) {
          if (!backend_url) {
            backend_url = cleanUrl(vp.production_url);
            sources.backend = `Vercel Project Match (${vp.name})`;
          }
        } else {
          if (!frontend_url) {
            frontend_url = cleanUrl(vp.production_url);
            sources.frontend = `Vercel Project Match (${vp.name})`;
          }
        }
      }
    }
  }

  // 3. Check GitHub Repositories metadata (homepage set on GitHub)
  for (const repo of repos) {
    const homepage = cleanUrl((repo as any)?.homepage);
    if (homepage && !frontend_url) {
      frontend_url = homepage;
      sources.frontend = `GitHub Repo Homepage (${repo.name})`;
    }
  }

  return {
    frontend_url,
    backend_url,
    supabase_url,
    sources,
    hasChanges: Boolean(frontend_url || backend_url || supabase_url),
  };
}

/**
 * Scans a project, auto-detects ONLY confirmed URLs (Vercel integrations & repo config files),
 * and saves changes directly to Supabase
 */
export async function autoDetectAndSaveProjectUrls(projectId: string): Promise<ProjectWithDetails> {
  const project = await fetchProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  const repos = await fetchProjectRepositories(projectId).catch(() => []);
  const integrations = await fetchProjectIntegrations(projectId).catch(() => []);
  const vercelProjects = await fetchAvailableVercelProjects().catch(() => []);

  const detected = detectUrlsFromMetadata(project.name, repos, integrations, vercelProjects);

  // 1. Cross-reference connected Supabase accounts (across all Gmails)
  if (!project.supabase_url) {
    const managedProjects = getAllManagedSupabaseProjects();
    const cleanProjectName = project.name.toLowerCase().replace(/[-_]/g, '');

    for (const mp of managedProjects) {
      const cleanMpName = mp.name.toLowerCase().replace(/[-_]/g, '');
      if (
        cleanMpName === cleanProjectName ||
        cleanMpName.includes(cleanProjectName) ||
        cleanProjectName.includes(cleanMpName)
      ) {
        detected.supabase_url = mp.url;
        detected.sources.supabase = `Connected Supabase Account (${mp.accountEmail})`;
        break;
      }
    }
  }

  // 2. Deep scan GitHub repos for Supabase URL if still not set
  if (!project.supabase_url && !detected.supabase_url) {
    for (const repo of repos) {
      if (repo.owner && repo.name) {
        const found = await scanRepoForSupabaseUrl(repo.owner, repo.name);
        if (found?.url) {
          detected.supabase_url = found.url;
          detected.sources.supabase = found.source;
          break;
        }
      }
    }
  }

  const updates: Record<string, string | null> = {};
  if (detected.frontend_url && project.frontend_url !== detected.frontend_url) {
    updates.frontend_url = detected.frontend_url;
  }
  if (detected.backend_url && project.backend_url !== detected.backend_url) {
    updates.backend_url = detected.backend_url;
  }
  if (detected.supabase_url && project.supabase_url !== detected.supabase_url) {
    updates.supabase_url = detected.supabase_url;
  }

  if (Object.keys(updates).length > 0) {
    return await updateProject(projectId, updates);
  }

  return project;
}

/**
 * Resets/clears all deployment URLs (frontend, backend, supabase) for a project
 */
export async function resetProjectDeploymentUrls(projectId: string): Promise<ProjectWithDetails> {
  return await updateProject(projectId, {
    frontend_url: null,
    backend_url: null,
    supabase_url: null,
  });
}

/**
 * Resets deployment URLs for all active user projects
 */
export async function resetAllProjectsDeploymentUrls(): Promise<number> {
  const { fetchProjects } = await import('./projects');
  const projects = await fetchProjects();
  let count = 0;

  for (const p of projects) {
    try {
      await updateProject(p.id, {
        frontend_url: null,
        backend_url: null,
        supabase_url: null,
      });
      count++;
    } catch {
      // ignore
    }
  }

  return count;
}
