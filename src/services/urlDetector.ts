import { fetchProjectById, updateProject, ProjectWithDetails } from './projects';
import { fetchProjectRepositories, GitHubRepoItem } from './github';
import { fetchProjectIntegrations, fetchAvailableVercelProjects, IntegrationRow } from './vercel';

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
 * Auto-detects frontend, backend, and Supabase URLs from repo items and integrations
 */
export function detectUrlsFromMetadata(
  projectName: string,
  repos: (any | GitHubRepoItem)[] = [],
  integrations: IntegrationRow[] = [],
  availableVercelProjects: { name: string; production_url: string }[] = []
): DetectedUrlsResult {
  let frontend_url: string | undefined;
  let backend_url: string | undefined;
  let supabase_url: string | undefined;

  const sources: DetectedUrlsResult['sources'] = {};

  const cleanProjectName = projectName.toLowerCase().replace(/[-_]/g, '');

  // 1. Check existing Vercel integrations
  for (const integration of integrations) {
    if (integration.provider === 'vercel' && integration.production_url) {
      const url = cleanUrl(integration.production_url);
      const name = (integration.name || '').toLowerCase();
      if (name.includes('backend') || name.includes('api') || name.includes('server')) {
        if (!backend_url) {
          backend_url = url;
          sources.backend = `Vercel Integration (${integration.name})`;
        }
      } else {
        if (!frontend_url) {
          frontend_url = url;
          sources.frontend = `Vercel Integration (${integration.name})`;
        }
      }
    }
  }

  // 2. Check available Vercel projects matching name
  if (!frontend_url && availableVercelProjects.length > 0) {
    for (const vp of availableVercelProjects) {
      const cleanVpName = vp.name.toLowerCase().replace(/[-_]/g, '');
      if (cleanVpName === cleanProjectName || cleanVpName.includes(cleanProjectName) || cleanProjectName.includes(cleanVpName)) {
        if (vp.name.toLowerCase().includes('backend') || vp.name.toLowerCase().includes('api')) {
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

  // 3. Check GitHub Repositories metadata (homepage or common vercel domains)
  for (const repo of repos) {
    // If repo has a homepage URL on GitHub
    const homepage = cleanUrl((repo as any)?.homepage);
    if (homepage) {
      if (!frontend_url) {
        frontend_url = homepage;
        sources.frontend = `GitHub Repo Homepage (${repo.name})`;
      }
    }

    // Check repo name heuristics
    const repoName = (repo.name || '').toLowerCase();
    if (repoName.includes('backend') || repoName.includes('server') || repoName.includes('api')) {
      if (!backend_url && !sources.backend) {
        // e.g. https://<reponame>.vercel.app or similar
        backend_url = `https://${repo.name.toLowerCase().replace(/_/g, '-')}.vercel.app`;
        sources.backend = `Heuristic (${repo.name}.vercel.app)`;
      }
    }
  }

  // 4. Fallback heuristic for frontend if still missing: https://<name>.vercel.app
  if (!frontend_url) {
    const defaultVercel = `https://${projectName.toLowerCase().replace(/_/g, '-')}.vercel.app`;
    frontend_url = defaultVercel;
    sources.frontend = 'Default Vercel domain pattern';
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
 * Scans a project, auto-detects URLs, and saves changes directly to Supabase
 */
export async function autoDetectAndSaveProjectUrls(projectId: string): Promise<ProjectWithDetails> {
  const project = await fetchProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  const repos = await fetchProjectRepositories(projectId).catch(() => []);
  const integrations = await fetchProjectIntegrations(projectId).catch(() => []);
  const vercelProjects = await fetchAvailableVercelProjects().catch(() => []);

  const detected = detectUrlsFromMetadata(project.name, repos, integrations, vercelProjects);

  const updates: Record<string, string | null> = {};
  if (detected.frontend_url && (!project.frontend_url || project.frontend_url !== detected.frontend_url)) {
    updates.frontend_url = detected.frontend_url;
  }
  if (detected.backend_url && (!project.backend_url || project.backend_url !== detected.backend_url)) {
    updates.backend_url = detected.backend_url;
  }
  if (detected.supabase_url && (!project.supabase_url || project.supabase_url !== detected.supabase_url)) {
    updates.supabase_url = detected.supabase_url;
  }

  if (Object.keys(updates).length > 0) {
    return await updateProject(projectId, updates);
  }

  return project;
}
