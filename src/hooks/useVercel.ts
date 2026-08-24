import { useState, useEffect, useCallback } from 'react';
import {
  fetchProjectIntegrations,
  fetchAvailableVercelProjects,
  linkVercelProjectToApp,
  unlinkVercelProjectFromApp,
  IntegrationRow,
  VercelProjectItem,
  LinkVercelInput,
} from '@/services/vercel';

export function useVercelIntegrations(projectId: string) {
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [availableProjects, setAvailableProjects] = useState<VercelProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setError(null);
    try {
      const list = await fetchProjectIntegrations(projectId);
      setIntegrations(list);
      const available = await fetchAvailableVercelProjects();
      setAvailableProjects(available);
    } catch (err: any) {
      setError(err.message || 'Failed to load Vercel integrations.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const handleLink = async (input: LinkVercelInput) => {
    const created = await linkVercelProjectToApp(input);
    setIntegrations((prev) => [...prev, created]);
    return created;
  };

  const handleUnlink = async (id: string) => {
    await unlinkVercelProjectFromApp(id);
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  return {
    integrations,
    availableProjects,
    loading,
    error,
    reload: load,
    linkVercelProject: handleLink,
    unlinkVercelProject: handleUnlink,
  };
}
