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

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) throw new Error('Not authenticated. Please sign in.');
}

// ──────────────── TASKS CRUD ────────────────

export async function fetchTasksByProject(projectId: string): Promise<TaskWithSubtasks[]> {
  await requireAuth();

  const { data, error } = await (supabase.from('tasks') as any)
    .select('*, subtasks:task_subtasks(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as TaskWithSubtasks[];
}

export async function createTask(input: CreateTaskInput): Promise<TaskWithSubtasks> {
  await requireAuth();

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

  const { data, error } = await (supabase.from('tasks') as any)
    .insert(payload)
    .select('*, subtasks:task_subtasks(*)')
    .single();

  if (error) throw error;
  return data as TaskWithSubtasks;
}

export async function updateTask(id: string, updates: Partial<CreateTaskInput>): Promise<TaskWithSubtasks> {
  await requireAuth();

  const payload: TaskUpdate = { ...updates };
  const { data, error } = await (supabase.from('tasks') as any)
    .update(payload)
    .eq('id', id)
    .select('*, subtasks:task_subtasks(*)')
    .single();

  if (error) throw error;
  return data as TaskWithSubtasks;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskWithSubtasks> {
  return updateTask(id, { status });
}

export async function deleteTask(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ──────────────── SUBTASKS ────────────────

export async function addSubtask(taskId: string, title: string): Promise<SubtaskRow> {
  await requireAuth();

  const { data, error } = await (supabase.from('task_subtasks') as any)
    .insert({ task_id: taskId, title, is_completed: false })
    .select()
    .single();

  if (error) throw error;
  return data as SubtaskRow;
}

export async function toggleSubtask(subtaskId: string, _taskId: string, isCompleted: boolean): Promise<void> {
  await requireAuth();

  const { error } = await (supabase.from('task_subtasks') as any)
    .update({ is_completed: isCompleted })
    .eq('id', subtaskId);

  if (error) throw error;
}
