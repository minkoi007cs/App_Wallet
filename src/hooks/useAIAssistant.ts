import { useState, useEffect, useCallback } from 'react';
import {
  getSmartRecommendations,
  generateAIAgentPrompt,
  SmartRecommendationItem,
  AIAgentPromptOptions,
} from '@/services/aiEngine';

export function useSmartRecommendations() {
  const [recommendations, setRecommendations] = useState<SmartRecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getSmartRecommendations();
      setRecommendations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations.');
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
    recommendations,
    topRecommendation: recommendations[0] || null,
    loading,
    error,
    reload: load,
  };
}

export function useAgentPromptGenerator(projectId: string) {
  const [promptText, setPromptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrompt = useCallback(
    async (options?: AIAgentPromptOptions) => {
      if (!projectId) return;
      setGenerating(true);
      setError(null);
      try {
        const text = await generateAIAgentPrompt(projectId, options);
        setPromptText(text);
        return text;
      } catch (err: any) {
        setError(err.message || 'Failed to generate prompt.');
      } finally {
        setGenerating(false);
      }
    },
    [projectId]
  );

  return {
    promptText,
    generating,
    error,
    generatePrompt,
  };
}
