import { useState, useCallback } from 'react';
import {
  fetchTasksByProject,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addSubtask,
  toggleSubtask,
  TaskWithSubtasks,
  CreateTaskInput,
} from '@/services/tasks';
import { TaskStatus } from '@/types/database';

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasksByProject(projectId);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleCreate = async (input: CreateTaskInput) => {
    const created = await createTask(input);
    setTasks((prev) => [...prev, created]);
    return created;
  };

  const handleUpdate = async (id: string, updates: Partial<CreateTaskInput>) => {
    const updated = await updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    return updated;
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const updated = await updateTaskStatus(id, status);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    return updated;
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    const sub = await addSubtask(taskId, title);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), sub] } : t
      )
    );
    return sub;
  };

  const handleToggleSubtask = async (subtaskId: string, taskId: string, isCompleted: boolean) => {
    await toggleSubtask(subtaskId, taskId, isCompleted);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks || []).map((s) =>
                s.id === subtaskId ? { ...s, is_completed: isCompleted } : s
              ),
            }
          : t
      )
    );
  };

  return {
    tasks,
    loading,
    error,
    load,
    createTask: handleCreate,
    updateTask: handleUpdate,
    updateTaskStatus: handleStatusChange,
    deleteTask: handleDelete,
    addSubtask: handleAddSubtask,
    toggleSubtask: handleToggleSubtask,
  };
}
