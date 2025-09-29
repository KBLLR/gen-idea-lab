/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import useStore from '../lib/store';

export function useAvailableModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const connectedServices = useStore.use.connectedServices();

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/models', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      setModels(data.models || []);
    } catch (err) {
      console.error('Error fetching available models:', err);
      setError(err.message);
      // Fallback to basic Gemini models if API fails
      setModels([
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Gemini', category: 'text', available: true },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', provider: 'Gemini', category: 'text', available: true }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch models when component mounts or when connected services change
  useEffect(() => {
    fetchModels();
  }, [fetchModels, connectedServices]);

  // Filter models by category
  const getModelsByCategory = useCallback((category) => {
    return models.filter(model => model.category === category);
  }, [models]);

  // Get text models specifically (for workflow auto-titling)
  const textModels = getModelsByCategory('text');

  return {
    models,
    textModels,
    loading,
    error,
    refetch: fetchModels,
    getModelsByCategory
  };
}