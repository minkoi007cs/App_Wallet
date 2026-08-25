import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type JournalRow = Database['public']['Tables']['journal_entries']['Row'];
export type JournalInsert = Database['public']['Tables']['journal_entries']['Insert'];
export type JournalUpdate = Database['public']['Tables']['journal_entries']['Update'];

export interface CreateJournalInput {
  project_id: string;
  title: string;
  content: string;
  tags: string[];
}

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) throw new Error('Not authenticated. Please sign in.');
}

// ──────────────── JOURNAL CRUD ────────────────

export async function fetchJournalByProject(projectId: string): Promise<JournalRow[]> {
  await requireAuth();

  const { data, error } = await (supabase.from('journal_entries') as any)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as JournalRow[];
}

export async function createJournalEntry(input: CreateJournalInput): Promise<JournalRow> {
  await requireAuth();

  const payload: JournalInsert = {
    project_id: input.project_id,
    title: input.title,
    content: input.content,
    tags: input.tags,
  };

  const { data, error } = await (supabase.from('journal_entries') as any)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as JournalRow;
}

export async function updateJournalEntry(id: string, updates: Partial<CreateJournalInput>): Promise<JournalRow> {
  await requireAuth();

  const payload: JournalUpdate = { ...updates };
  const { data, error } = await (supabase.from('journal_entries') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as JournalRow;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}
