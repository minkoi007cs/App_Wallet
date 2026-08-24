import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type MilestoneRow = Database['public']['Tables']['milestones']['Row'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];

export type MilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'missed';

export interface CreateMilestoneInput {
  project_id: string;
  name: string;
  description?: string;
  status: MilestoneStatus;
  target_date?: string;
}

let localMilestoneStore: MilestoneRow[] = [
  {
    id: 'ms-demo-1',
    project_id: 'demo-1',
    name: 'MVP Launch',
    description: 'Core RAG pipeline complete, quiz generation working, deployed to Vercel.',
    status: 'in_progress',
    target_date: '2026-08-30',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ms-demo-2',
    project_id: 'demo-1',
    name: 'Beta Testing',
    description: 'Invite 10 university users for closed beta testing and collect feedback.',
    status: 'planned',
    target_date: '2026-09-10',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ms-demo-3',
    project_id: 'demo-3',
    name: 'Phase 3 Complete',
    description: 'Project CRUD, Detail view, Add/Edit wizard fully shipped.',
    status: 'completed',
    target_date: '2026-08-24',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchMilestonesByProject(projectId: string): Promise<MilestoneRow[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('milestones') as any)
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });
      if (!error && data) return data as MilestoneRow[];
    }
  } catch (err) {
    console.warn('fetchMilestonesByProject notice:', err);
  }
  return localMilestoneStore.filter((m) => m.project_id === projectId);
}

export async function createMilestone(input: CreateMilestoneInput): Promise<MilestoneRow> {
  const { data: session } = await supabase.auth.getSession();
  const payload: MilestoneInsert = {
    project_id: input.project_id,
    name: input.name,
    description: input.description || null,
    status: input.status,
    target_date: input.target_date || null,
  };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('milestones') as any)
      .insert(payload)
      .select()
      .single();
    if (!error && data) return data as MilestoneRow;
  }

  const created: MilestoneRow = {
    ...payload,
    id: `ms-${Date.now()}`,
    project_id: input.project_id,
    name: input.name,
    description: input.description || null,
    status: input.status,
    target_date: input.target_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localMilestoneStore = [...localMilestoneStore, created];
  return created;
}

export async function updateMilestone(id: string, updates: Partial<CreateMilestoneInput>): Promise<MilestoneRow> {
  const { data: session } = await supabase.auth.getSession();
  const payload: MilestoneUpdate = { ...updates };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('milestones') as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as MilestoneRow;
  }

  const idx = localMilestoneStore.findIndex((m) => m.id === id);
  if (idx !== -1) {
    localMilestoneStore[idx] = { ...localMilestoneStore[idx], ...payload, updated_at: new Date().toISOString() };
    return localMilestoneStore[idx];
  }
  throw new Error(`Milestone ${id} not found.`);
}

export async function deleteMilestone(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    const { error } = await supabase.from('milestones').delete().eq('id', id);
    if (error) throw error;
  }
  localMilestoneStore = localMilestoneStore.filter((m) => m.id !== id);
}
