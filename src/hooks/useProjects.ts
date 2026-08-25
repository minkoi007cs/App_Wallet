import { useState, useEffect, useCallback } from 'react';
import {
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  fetchDashboardStats,
  ProjectWithDetails,
  ProjectFilterOptions,
  DashboardStats,
} from '@/services/projects';
import { CreateProjectInput } from '@/lib/validation/project';

export function useProjects(initialFilters: ProjectFilterOptions = {}) {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    paused: 0,
    completed: 0,
    ideas: 0,
    needsAttention: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery, status, priority, healthStatus, sortBy, sortOrder } = initialFilters;

  const executeFetch = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchProjects({ searchQuery, status, priority, healthStatus, sortBy, sortOrder });
      setProjects(data);
      const dashboardStats = await fetchDashboardStats();
      setStats(dashboardStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, status, priority, healthStatus, sortBy, sortOrder]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        await executeFetch();
      }
    })();
    return () => {
      active = false;
    };
  }, [executeFetch]);

  const handleCreate = async (input: CreateProjectInput) => {
    const created = await createProject(input);
    await executeFetch();
    return created;
  };

  const handleUpdate = async (id: string, updates: Partial<CreateProjectInput>) => {
    const updated = await updateProject(id, updates);
    await executeFetch();
    return updated;
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    await executeFetch();
  };

  return {
    projects,
    stats,
    loading,
    error,
    filters: initialFilters,
    reload: () => executeFetch(),
    createProject: handleCreate,
    updateProject: handleUpdate,
    deleteProject: handleDelete,
  };
}

export function useProjectDetail(id: string) {
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const executeFetchDetail = useCallback(async (targetId: string) => {
    if (!targetId) return;
    setError(null);
    try {
      const data = await fetchProjectById(targetId);
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active && id) {
        await executeFetchDetail(id);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, executeFetchDetail]);

  return {
    project,
    loading,
    error,
    reload: () => executeFetchDetail(id),
  };
}
