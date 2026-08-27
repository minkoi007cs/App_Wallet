import { extractSupabaseRef, getSupabaseDashboardUrl, checkSupabaseHealth } from './supabaseStatus';

export interface SupabaseManagedProject {
  id: string; // Project ref, e.g. "ymunwzjmemxifjxsiugz"
  name: string; // Project display name, e.g. "App Wallet DB"
  region: string; // Region, e.g. "aws-0-us-west-2"
  status: 'ACTIVE_HEALTHY' | 'PAUSED' | 'INACTIVE' | 'RESTORING' | 'UNKNOWN';
  url: string; // "https://ymunwzjmemxifjxsiugz.supabase.co"
  dashboardUrl: string;
  accountEmail: string;
  latencyMs?: number;
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

const EDGE_FUNCTION_URL = 'https://ymunwzjmemxifjxsiugz.supabase.co/functions/v1/supabase-sync';
const ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdW53emptZW14aWZqeHNpdWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODE4MzMsImV4cCI6MjEwMzE1NzgzM30.EZSp-mKu2_OSxJEU4ggHas8FPXAkkTttVNygh0hsoZ8';

/**
 * Fetches real projects from Supabase Management API using Personal Access Token
 * Tries Edge Function proxy first to bypass browser CORS restrictions.
 */
export async function fetchSupabaseProjectsFromToken(token: string, emailLabel: string): Promise<SupabaseManagedProject[]> {
  const cleanToken = token.trim();

  // 1. Try Supabase Edge Function proxy (Server-to-Server, 0 CORS issues)
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ token: cleanToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.projects && Array.isArray(data.projects)) {
        return data.projects.map((p: any) => ({
          id: p.id,
          name: p.name || `Project ${p.id}`,
          region: p.region || 'unknown',
          status: (p.status?.toUpperCase() === 'ACTIVE_HEALTHY' || p.status?.toUpperCase() === 'ACTIVE'
            ? 'ACTIVE_HEALTHY'
            : p.status?.toUpperCase() === 'PAUSED'
            ? 'PAUSED'
            : 'ACTIVE_HEALTHY') as SupabaseManagedProject['status'],
          url: `https://${p.id}.supabase.co`,
          dashboardUrl: `https://supabase.com/dashboard/project/${p.id}`,
          accountEmail: emailLabel,
          updatedAt: new Date().toISOString(),
        }));
      }
    }
  } catch {
    // Continue to direct fetch attempt
  }

  // 2. Direct fetch attempt
  try {
    const res = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const projects = await res.json();
      if (Array.isArray(projects)) {
        return projects.map((p: any) => ({
          id: p.id,
          name: p.name || `Project ${p.id}`,
          region: p.region || 'unknown',
          status: (p.status?.toUpperCase() === 'ACTIVE_HEALTHY' || p.status?.toUpperCase() === 'ACTIVE'
            ? 'ACTIVE_HEALTHY'
            : p.status?.toUpperCase() === 'PAUSED'
            ? 'PAUSED'
            : 'ACTIVE_HEALTHY') as SupabaseManagedProject['status'],
          url: `https://${p.id}.supabase.co`,
          dashboardUrl: `https://supabase.com/dashboard/project/${p.id}`,
          accountEmail: emailLabel,
          updatedAt: new Date().toISOString(),
        }));
      }
    }
  } catch {
    // Throws clear error with actionable guidance
    throw new Error(
      'Browser CORS blocked direct token request. Please use "Add Database by Ref" below (e.g. paste your project ref like lnuijfoohwvunatwuqjx) to register your database directly!'
    );
  }

  throw new Error('Could not fetch projects. Please enter project ref directly.');
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
 * Adds a project manually under an account email (without PAT) and checks live health probe
 */
export async function addManualSupabaseProject(
  accountEmail: string,
  projectName: string,
  refOrUrl: string
): Promise<SupabaseManagedProject> {
  const ref = extractSupabaseRef(refOrUrl);
  if (!ref) throw new Error('Invalid Supabase URL or Ref. Must be 20 characters or *.supabase.co');

  const cleanEmail = accountEmail.trim() || 'Custom Account';
  const cleanName = projectName.trim() || `Supabase DB (${ref.slice(0, 6)})`;

  // Probe live status
  const health = await checkSupabaseHealth(`https://${ref}.supabase.co`).catch(() => null);

  const newProject: SupabaseManagedProject = {
    id: ref,
    name: cleanName,
    region: 'cloud',
    status: health?.status === 'paused' ? 'PAUSED' : 'ACTIVE_HEALTHY',
    url: `https://${ref}.supabase.co`,
    dashboardUrl: getSupabaseDashboardUrl(ref) || `https://supabase.com/dashboard/project/${ref}`,
    accountEmail: cleanEmail,
    latencyMs: health?.latencyMs,
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
    for (const p of acc.projects) {
      try {
        const health = await checkSupabaseHealth(p.url);
        p.status = health.status === 'paused' ? 'PAUSED' : 'ACTIVE_HEALTHY';
        p.latencyMs = health.latencyMs;
        p.updatedAt = new Date().toISOString();
      } catch {
        // ignore probe error
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
