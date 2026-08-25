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

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) throw new Error('Not authenticated. Please sign in.');
}

// ──────────────── MILESTONES CRUD ────────────────

export async function fetchMilestonesByProject(projectId: string): Promise<MilestoneRow[]> {
  await requireAuth();

  const { data, error } = await (supabase.from('milestones') as any)
    .select('*')
    .eq('project_id', projectId)
    .order('target_date', { ascending: true });

  if (error) throw error;
  return (data || []) as MilestoneRow[];
}

export async function createMilestone(input: CreateMilestoneInput): Promise<MilestoneRow> {
  await requireAuth();

  const payload: MilestoneInsert = {
    project_id: input.project_id,
    name: input.name,
    description: input.description || null,
    status: input.status,
    target_date: input.target_date || null,
  };

  const { data, error } = await (supabase.from('milestones') as any)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as MilestoneRow;
}

export async function updateMilestone(id: string, updates: Partial<CreateMilestoneInput>): Promise<MilestoneRow> {
  await requireAuth();

  const payload: MilestoneUpdate = { ...updates };
  const { data, error } = await (supabase.from('milestones') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as MilestoneRow;
}

export async function deleteMilestone(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase.from('milestones').delete().eq('id', id);
  if (error) throw error;
}
