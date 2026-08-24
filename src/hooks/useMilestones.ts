import { useState, useCallback } from 'react';
import {
  fetchMilestonesByProject,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  MilestoneRow,
  CreateMilestoneInput,
} from '@/services/milestones';

export function useMilestones(projectId: string) {
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMilestonesByProject(projectId);
      setMilestones(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load milestones.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleCreate = async (input: CreateMilestoneInput) => {
    const created = await createMilestone(input);
    setMilestones((prev) => [...prev, created]);
    return created;
  };

  const handleUpdate = async (id: string, updates: Partial<CreateMilestoneInput>) => {
    const updated = await updateMilestone(id, updates);
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
    return updated;
  };

  const handleDelete = async (id: string) => {
    await deleteMilestone(id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    milestones,
    loading,
    error,
    load,
    createMilestone: handleCreate,
    updateMilestone: handleUpdate,
    deleteMilestone: handleDelete,
  };
}
