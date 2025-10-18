/**
 * @file useAvailableModels - Shared hook for fetching and managing AI model availability
 * @license SPDX-License-Identifier: Apache-2.0
 * MIGRATED: Now uses centralized data layer (useQuery)
 */

import { useMemo } from 'react';
import { useQuery } from '@shared/hooks/useQuery';
import { api, queryKeys } from '@shared/lib/dataLayer/endpoints';

/**
 * Fallback models when API fails
 */
const FALLBACK_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Gemini', category: 'text', available: true },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', provider: 'Gemini', category: 'text', available: true }
];

/**
 * Fetch and manage available AI models across all connected services
 * @returns {Object} Models data with loading/error states and category helpers
 */
export function useAvailableModels() {
  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useQuery(
    queryKeys.models,
    api.models.list,
    {
      context: 'Fetching available AI models',
      showToast: false, // Silent error with fallback
      staleTime: 30000, // Consider fresh for 30 seconds
      refetchOnWindowFocus: true, // Refetch when user returns to tab
    }
  );

  // Extract models from response or use fallback
  const models = useMemo(() => {
    if (error || !data) {
      return FALLBACK_MODELS;
    }
    return data.models || [];
  }, [data, error]);

  // Filter models by category (memoized)
  const getModelsByCategory = useMemo(() => {
    return (category) => models.filter(model => model.category === category);
  }, [models]);

  // Get text models specifically (for workflow auto-titling)
  const textModels = useMemo(() => {
    return models.filter(model => model.category === 'text');
  }, [models]);

  return {
    models,
    textModels,
    loading,
    error,
    refetch,
    getModelsByCategory
  };
}
