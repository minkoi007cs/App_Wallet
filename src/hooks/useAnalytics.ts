import { useState, useEffect, useCallback } from 'react';
import { getComprehensiveAnalytics, ComprehensiveAnalytics } from '@/services/analytics';

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getComprehensiveAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  return {
    analytics,
    loading,
    error,
    reload: load,
  };
}
