/**
 * @file useAvailableModels - Hook for fetching and managing AI model availability
 * @license SPDX-License-Identifier: Apache-2.0
 * @deprecated Use @shared/hooks/useAvailableModels instead (this is a re-export for backward compatibility)
 * MIGRATED: Now uses centralized data layer (useQuery)
 */

// Re-export shared hook (avoid code duplication)
export { useAvailableModels } from '@shared/hooks/useAvailableModels';
