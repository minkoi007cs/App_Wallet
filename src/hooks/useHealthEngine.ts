import { useState, useCallback } from 'react';
import { evaluateAndSaveProjectHealth, HealthDiagnosticResult } from '@/services/healthEngine';

export function useProjectHealth(projectId: string) {
  const [evaluating, setEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<HealthDiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reevaluateHealth = useCallback(async () => {
    if (!projectId) return;
    setEvaluating(true);
    setError(null);
    try {
      const res = await evaluateAndSaveProjectHealth(projectId);
      setLastResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Health evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  }, [projectId]);

  return {
    evaluating,
    lastResult,
    error,
    reevaluateHealth,
  };
}
