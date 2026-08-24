import { supabase } from '@/lib/supabase/client';
import { Database, TaskStatus, ProjectPriority } from '@/types/database';

export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
export type SubtaskRow = Database['public']['Tables']['task_subtasks']['Row'];

export interface TaskWithSubtasks extends TaskRow {
  subtasks?: SubtaskRow[];
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  due_date?: string;
  tags: string[];
  notes?: string;
}

// ──────────────── LOCAL STORE (offline / preview fallback) ────────────────

let localTaskStore: TaskWithSubtasks[] = [
  {
    id: 'task-demo-1',
    project_id: 'demo-1',
    title: 'Implement vector search endpoint',
    description: 'Create FastAPI endpoint for document chunk similarity search',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-09-05',
    tags: ['backend', 'RAG'],
    notes: 'Uses pgvector with cosine similarity threshold 0.78',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    subtasks: [
      { id: 'sub-1', task_id: 'task-demo-1', title: 'Add pgvector extension', is_completed: true, created_at: new Date().toISOString() },
      { id: 'sub-2', task_id: 'task-demo-1', title: 'Write similarity search function', is_completed: true, created_at: new Date().toISOString() },
      { id: 'sub-3', task_id: 'task-demo-1', title: 'Add rate limiting middleware', is_completed: false, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'task-demo-2',
    project_id: 'demo-1',
    title: 'Design quiz generation UI',
    description: 'Build the quiz mode interface with multiple choice and flashcard layouts',
    status: 'todo',
    priority: 'medium',
    due_date: '2026-09-10',
    tags: ['frontend', 'UI'],
    notes: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    subtasks: [],
  },
  {
    id: 'task-demo-3',
    project_id: 'demo-3',
    title: 'Implement Phase 4 Tasks & Milestones',
    description: 'Build Tasks CRUD, Milestones timeline and Journal screen for App Wallet',
    status: 'in_progress',
    priority: 'critical',
    due_date: '2026-08-25',
    tags: ['App Wallet', 'Phase 4'],
    notes: 'Currently in progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subtasks: [
      { id: 'sub-4', task_id: 'task-demo-3', title: 'Tasks service & hook', is_completed: false, created_at: new Date().toISOString() },
      { id: 'sub-5', task_id: 'task-demo-3', title: 'Milestones service & hook', is_completed: false, created_at: new Date().toISOString() },
      { id: 'sub-6', task_id: 'task-demo-3', title: 'Journal service & hook', is_completed: false, created_at: new Date().toISOString() },
    ],
  },
];

// ──────────────── TASKS CRUD ────────────────

export async function fetchTasksByProject(projectId: string): Promise<TaskWithSubtasks[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('tasks') as any)
        .select('*, subtasks:task_subtasks(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (!error && data) return data as TaskWithSubtasks[];
    }
  } catch (err) {
    console.warn('fetchTasksByProject notice:', err);
  }
  return localTaskStore.filter((t) => t.project_id === projectId);
}

export async function createTask(input: CreateTaskInput): Promise<TaskWithSubtasks> {
  const { data: session } = await supabase.auth.getSession();

  const payload: TaskInsert = {
    project_id: input.project_id,
    title: input.title,
    description: input.description || null,
    status: input.status,
    priority: input.priority,
    due_date: input.due_date || null,
    tags: input.tags,
    notes: input.notes || null,
  };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('tasks') as any)
      .insert(payload)
      .select()
      .single();
    if (!error && data) return { ...data, subtasks: [] } as TaskWithSubtasks;
  }

  const created: TaskWithSubtasks = {
    ...payload,
    id: `task-${Date.now()}`,
    project_id: input.project_id,
    title: input.title,
    description: input.description || null,
    status: input.status,
    priority: input.priority,
    due_date: input.due_date || null,
    tags: input.tags,
    notes: input.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subtasks: [],
  };
  localTaskStore = [...localTaskStore, created];
  return created;
}

export async function updateTask(id: string, updates: Partial<CreateTaskInput>): Promise<TaskWithSubtasks> {
  const { data: session } = await supabase.auth.getSession();
  const payload: TaskUpdate = { ...updates };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('tasks') as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data as TaskWithSubtasks;
  }

  const idx = localTaskStore.findIndex((t) => t.id === id);
  if (idx !== -1) {
    localTaskStore[idx] = { ...localTaskStore[idx], ...payload, updated_at: new Date().toISOString() };
    return localTaskStore[idx];
  }
  throw new Error(`Task ${id} not found.`);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskWithSubtasks> {
  return updateTask(id, { status });
}

export async function deleteTask(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }
  localTaskStore = localTaskStore.filter((t) => t.id !== id);
}

// ──────────────── SUBTASKS ────────────────

export async function addSubtask(taskId: string, title: string): Promise<SubtaskRow> {
  const { data: session } = await supabase.auth.getSession();
  const payload = { task_id: taskId, title, is_completed: false };

  if (session?.session?.user) {
    const { data, error } = await (supabase.from('task_subtasks') as any)
      .insert(payload)
      .select()
      .single();
    if (!error && data) return data as SubtaskRow;
  }

  const created: SubtaskRow = {
    id: `sub-${Date.now()}`,
    task_id: taskId,
    title,
    is_completed: false,
    created_at: new Date().toISOString(),
  };
  const taskIdx = localTaskStore.findIndex((t) => t.id === taskId);
  if (taskIdx !== -1) {
    localTaskStore[taskIdx].subtasks = [...(localTaskStore[taskIdx].subtasks || []), created];
  }
  return created;
}

export async function toggleSubtask(subtaskId: string, taskId: string, isCompleted: boolean): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    await (supabase.from('task_subtasks') as any)
      .update({ is_completed: isCompleted })
      .eq('id', subtaskId);
    return;
  }
  const taskIdx = localTaskStore.findIndex((t) => t.id === taskId);
  if (taskIdx !== -1) {
    const subIdx = localTaskStore[taskIdx].subtasks?.findIndex((s) => s.id === subtaskId) ?? -1;
    if (subIdx !== -1) {
      localTaskStore[taskIdx].subtasks![subIdx].is_completed = isCompleted;
    }
  }
}
