import { useState, useCallback } from 'react';
import {
  fetchJournalByProject,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  JournalRow,
  CreateJournalInput,
} from '@/services/journal';

export function useJournal(projectId: string) {
  const [entries, setEntries] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJournalByProject(projectId);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load journal.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleCreate = async (input: CreateJournalInput) => {
    const created = await createJournalEntry(input);
    setEntries((prev) => [created, ...prev]);
    return created;
  };

  const handleUpdate = async (id: string, updates: Partial<CreateJournalInput>) => {
    const updated = await updateJournalEntry(id, updates);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    return updated;
  };

  const handleDelete = async (id: string) => {
    await deleteJournalEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return {
    entries,
    loading,
    error,
    load,
    createEntry: handleCreate,
    updateEntry: handleUpdate,
    deleteEntry: handleDelete,
  };
}
