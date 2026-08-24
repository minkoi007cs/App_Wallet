import { useState, useEffect, useCallback } from 'react';
import {
  getGitHubConnectionStatus,
  fetchUserGitHubRepositories,
  fetchProjectRepositories,
  linkRepositoryToProject,
  unlinkRepositoryFromProject,
  fetchProjectActivityEvents,
  GitHubRepoItem,
  RepoRow,
  ActivityEventRow,
  LinkRepoInput,
} from '@/services/github';

export function useGitHubAccount() {
  const [isConnected, setIsConnected] = useState(false);
  const [accountName, setAccountName] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const status = await getGitHubConnectionStatus();
      setIsConnected(status.isConnected);
      setAccountName(status.accountName);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await checkStatus();
    })();
    return () => {
      active = false;
    };
  }, [checkStatus]);

  return { isConnected, accountName, loading, refresh: checkStatus };
}

export function useProjectRepositories(projectId: string) {
  const [repositories, setRepositories] = useState<RepoRow[]>([]);
  const [availableRepos, setAvailableRepos] = useState<GitHubRepoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setError(null);
    try {
      const linked = await fetchProjectRepositories(projectId);
      setRepositories(linked);
      const userRepos = await fetchUserGitHubRepositories();
      setAvailableRepos(userRepos);
    } catch (err: any) {
      setError(err.message || 'Failed to load GitHub repositories.');
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

  const handleLink = async (input: LinkRepoInput) => {
    const linked = await linkRepositoryToProject(input);
    setRepositories((prev) => [...prev, linked]);
    return linked;
  };

  const handleUnlink = async (id: string) => {
    await unlinkRepositoryFromProject(id);
    setRepositories((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    repositories,
    availableRepos,
    loading,
    error,
    reload: load,
    linkRepository: handleLink,
    unlinkRepository: handleUnlink,
  };
}

export function useActivityStream(projectId?: string) {
  const [activities, setActivities] = useState<ActivityEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const events = await fetchProjectActivityEvents(projectId);
      setActivities(events);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity stream.');
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

  return { activities, loading, error, reload: load };
}
