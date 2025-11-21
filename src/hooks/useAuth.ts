import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { AuthUser } from '../types/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Auth error');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const onAuthChanged = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Auth change handler error:', err);
        setUser(null);
      }
    };

    window.addEventListener('auth-changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);

    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, []);

  return { user, loading, error };
}
