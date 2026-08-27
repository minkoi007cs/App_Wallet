import { extractSupabaseRef, getSupabaseDashboardUrl } from './supabaseStatus';

export interface SupabaseManagedProject {
  id: string; // Project ref, e.g. "ymunwzjmemxifjxsiugz"
  name: string; // Project display name, e.g. "App Wallet DB"
  region: string; // Region, e.g. "aws-0-us-west-2"
  status: 'ACTIVE_HEALTHY' | 'PAUSED' | 'INACTIVE' | 'RESTORING' | 'UNKNOWN';
  url: string; // "https://ymunwzjmemxifjxsiugz.supabase.co"
  dashboardUrl: string;
  accountEmail: string;
  updatedAt?: string;
}

export interface SupabaseAccount {
  id: string;
  emailLabel: string;
  token?: string; // Supabase Personal Access Token (sbp_...)
  projects: SupabaseManagedProject[];
  lastSyncedAt?: string;
  error?: string;
}

const STORAGE_KEY = 'app_wallet_multi_supabase_accounts';

let cachedAccounts: SupabaseAccount[] | null = null;

// ──────────────── STORAGE & RETRIEVAL ────────────────

export function getSupabaseAccounts(): SupabaseAccount[] {
  if (cachedAccounts !== null) return cachedAccounts;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        cachedAccounts = JSON.parse(raw);
        return cachedAccounts || [];
      }
    } catch {
      // ignore
    }
  }

  // Default seed with primary account
  cachedAccounts = [
    {
      id: 'acc_primary',
      emailLabel: 'minkoi007.cs@gmail.com',
      projects: [
        {
          id: 'ymunwzjmemxifjxsiugz',
          name: 'App Wallet DB',
          region: 'aws-0-us-west-2',
          status: 'ACTIVE_HEALTHY',
          url: 'https://ymunwzjmemxifjxsiugz.supabase.co',
          dashboardUrl: 'https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz',
          accountEmail: 'minkoi007.cs@gmail.com',
        },
      ],
      lastSyncedAt: new Date().toISOString(),
    },
  ];

  saveAccounts(cachedAccounts);
  return cachedAccounts;
}

function saveAccounts(accounts: SupabaseAccount[]) {
  cachedAccounts = accounts;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  }
}

// ──────────────── SUPABASE MANAGEMENT REST API ────────────────

/**
 * Fetches real projects from Supabase Management API using Personal Access Token
 * https://api.supabase.com/v1/projects
 */
export async function fetchSupabaseProjectsFromToken(token: string, emailLabel: string): Promise<SupabaseManagedProject[]> {
  const cleanToken = token.trim();
  const res = await fetch('https://api.supabase.com/v1/projects', {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Supabase API error (${res.status}): ${errorBody || res.statusText}`);
  }

  const projects = await res.json();
  if (!Array.isArray(projects)) return [];

  return projects.map((p: any) => ({
    id: p.id,
    name: p.name || `Project ${p.id}`,
    region: p.region || 'unknown',
    status: (p.status?.toUpperCase() || 'UNKNOWN') as SupabaseManagedProject['status'],
    url: `https://${p.id}.supabase.co`,
    dashboardUrl: `https://supabase.com/dashboard/project/${p.id}`,
    accountEmail: emailLabel,
    updatedAt: new Date().toISOString(),
  }));
}

// ──────────────── ACCOUNT MANAGEMENT ────────────────

/**
 * Adds or updates a Supabase account with Personal Access Token
 */
export async function addOrUpdateSupabaseAccount(emailLabel: string, token: string): Promise<SupabaseAccount> {
  const cleanEmail = emailLabel.trim();
  const cleanToken = token.trim();

  if (!cleanEmail) throw new Error('Account email label is required.');
  if (!cleanToken) throw new Error('Personal Access Token is required.');

  // Fetch real projects from Supabase Management API
  const projects = await fetchSupabaseProjectsFromToken(cleanToken, cleanEmail);

  const accounts = getSupabaseAccounts();
  const existingIndex = accounts.findIndex(
    (a) => a.emailLabel.toLowerCase() === cleanEmail.toLowerCase()
  );

  const newAccount: SupabaseAccount = {
    id: existingIndex >= 0 ? accounts[existingIndex].id : `acc_${Date.now()}`,
    emailLabel: cleanEmail,
    token: cleanToken,
    projects,
    lastSyncedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    accounts[existingIndex] = newAccount;
  } else {
    accounts.push(newAccount);
  }

  saveAccounts(accounts);
  return newAccount;
}

/**
 * Adds a project manually under an account email (without PAT)
 */
export function addManualSupabaseProject(
  accountEmail: string,
  projectName: string,
  refOrUrl: string
): SupabaseManagedProject {
  const ref = extractSupabaseRef(refOrUrl);
  if (!ref) throw new Error('Invalid Supabase URL or Ref. Must be 20 chars or *.supabase.co');

  const cleanEmail = accountEmail.trim() || 'Custom Account';
  const cleanName = projectName.trim() || `Supabase DB (${ref.slice(0, 6)})`;

  const newProject: SupabaseManagedProject = {
    id: ref,
    name: cleanName,
    region: 'cloud',
    status: 'ACTIVE_HEALTHY',
    url: `https://${ref}.supabase.co`,
    dashboardUrl: getSupabaseDashboardUrl(ref) || `https://supabase.com/dashboard/project/${ref}`,
    accountEmail: cleanEmail,
    updatedAt: new Date().toISOString(),
  };

  const accounts = getSupabaseAccounts();
  let account = accounts.find((a) => a.emailLabel.toLowerCase() === cleanEmail.toLowerCase());

  if (!account) {
    account = {
      id: `acc_${Date.now()}`,
      emailLabel: cleanEmail,
      projects: [newProject],
      lastSyncedAt: new Date().toISOString(),
    };
    accounts.push(account);
  } else {
    const existingPIndex = account.projects.findIndex((p) => p.id === ref);
    if (existingPIndex >= 0) {
      account.projects[existingPIndex] = newProject;
    } else {
      account.projects.push(newProject);
    }
  }

  saveAccounts(accounts);
  return newProject;
}

/**
 * Removes a Supabase account and its projects
 */
export function removeSupabaseAccount(accountId: string): void {
  const accounts = getSupabaseAccounts().filter((a) => a.id !== accountId);
  saveAccounts(accounts);
}

/**
 * Removes a single project
 */
export function removeManagedProject(projectRef: string): void {
  const accounts = getSupabaseAccounts();
  for (const acc of accounts) {
    acc.projects = acc.projects.filter((p) => p.id !== projectRef);
  }
  saveAccounts(accounts);
}

/**
 * Syncs and probes live status for all projects across all Supabase accounts
 */
export async function syncAllSupabaseAccounts(): Promise<{ totalAccounts: number; totalProjects: number }> {
  const accounts = getSupabaseAccounts();
  let totalProjects = 0;

  for (const acc of accounts) {
    if (acc.token) {
      try {
        const freshProjects = await fetchSupabaseProjectsFromToken(acc.token, acc.emailLabel);
        acc.projects = freshProjects;
        acc.lastSyncedAt = new Date().toISOString();
        acc.error = undefined;
      } catch (err: any) {
        acc.error = err.message || 'Sync failed';
      }
    }
    totalProjects += acc.projects.length;
  }

  saveAccounts(accounts);
  return { totalAccounts: accounts.length, totalProjects };
}

/**
 * Returns all Supabase projects flattened from all accounts
 */
export function getAllManagedSupabaseProjects(): SupabaseManagedProject[] {
  const accounts = getSupabaseAccounts();
  const all: SupabaseManagedProject[] = [];
  for (const acc of accounts) {
    for (const p of acc.projects) {
      all.push({ ...p, accountEmail: acc.emailLabel });
    }
  }
  return all;
}
