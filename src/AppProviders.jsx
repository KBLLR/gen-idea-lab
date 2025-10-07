/**
 * Global providers wrapper
 * Placeholder to keep host minimal while we migrate to micro-apps.
 */
import '@ui/tokens/index.css'
import '@ui/utilities/index.css'

export default function AppProviders({ children }) {
  // Zustand does not require a Provider; add theme/auth providers here later
  return children
}

