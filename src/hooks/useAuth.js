import { useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to access authentication context.
 * Decouples components from direct context imports.
 */
export function useAuth() {
  return useAuthContext();
}
