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

let localJournalStore: JournalRow[] = [
  {
    id: 'journal-demo-1',
    project_id: 'demo-1',
    title: 'RAG pipeline is now working end-to-end',
    content: `## Summary
Finally got the full RAG pipeline working today. The document ingestion, chunking strategy, and vector similarity search are all functioning as expected.

## What I built
- FastAPI endpoint at \`/api/v1/search\` accepting a natural language query
- Embedding generation via OpenAI text-embedding-3-small model
- pgvector similarity search with cosine distance < 0.22 threshold

## Decisions made
- Chose chunking strategy: 512 tokens with 64-token overlap for better context preservation
- cosine similarity threshold set at 0.78 based on empirical testing

## Next steps
- Add rate limiting to the search endpoint
- Build the quiz generation prompt chain`,
    tags: ['RAG', 'FastAPI', 'milestone'],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'journal-demo-2',
    project_id: 'demo-3',
    title: 'Phase 3 Project Management shipped',
    content: `## Summary
Completed Phase 3 of App Wallet — full Project CRUD, detail views, filters, and search.

## Highlights
- Built project domain service with Supabase + offline fallback
- Created Add Project wizard with status & priority chips
- Implemented Edit Project with delete confirmation
- Project Detail with sub-tabs: Overview, Repositories, Integrations

## Challenges
- ESLint react-hooks/set-state-in-effect errors needed refactoring EditProjectForm as a child component initialized with project props directly.

## Next steps
- Phase 4: Tasks, Milestones, Journal`,
    tags: ['Phase 3', 'App Wallet', 'milestone'],
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export async function fetchJournalByProject(projectId: string): Promise<JournalRow[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('journal_entries') as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as JournalRow[];
    }
  } catch (err) {
    console.warn('fetchJournalByProject notice:', err);
  }
  return localJournalStore.filter((j) => j.project_id === projectId);
}

export async function createJournalEntry(input: CreateJournalInput): Promise<JournalRow> {
  const { data: session } = await supabase.auth.getSession();
  const payload: JournalInsert = {
    project_id: input.project_id,
    title: input.title,
    content: input.content,
    tags: input.tags,
  };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('journal_entries') as any)
      .insert(payload)
      .select()
      .single();
    if (!error && data) return data as JournalRow;
  }

  const created: JournalRow = {
    ...payload,
    id: `journal-${Date.now()}`,
    project_id: input.project_id,
    title: input.title,
    content: input.content,
    tags: input.tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localJournalStore = [created, ...localJournalStore];
  return created;
}

export async function updateJournalEntry(id: string, updates: Partial<CreateJournalInput>): Promise<JournalRow> {
  const { data: session } = await supabase.auth.getSession();
  const payload: JournalUpdate = { ...updates };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('journal_entries') as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as JournalRow;
  }

  const idx = localJournalStore.findIndex((j) => j.id === id);
  if (idx !== -1) {
    localJournalStore[idx] = { ...localJournalStore[idx], ...payload, updated_at: new Date().toISOString() };
    return localJournalStore[idx];
  }
  throw new Error(`Journal entry ${id} not found.`);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) throw error;
  }
  localJournalStore = localJournalStore.filter((j) => j.id !== id);
}
