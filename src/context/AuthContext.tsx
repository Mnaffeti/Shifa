import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ApiError, authApi, type ApiUser } from '../lib/api';

export type UserRole = 'SECRETARY' | 'DOCTOR' | 'ADMIN';

interface User {
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  specialty?: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  /** ADMIN is provisioned server-side, never through the public signup form. */
  role: Exclude<UserRole, 'ADMIN'>;
  specialty?: string;
}

interface AuthContextType {
  user: User | null;
  /** Async: credentials are verified by the server, not in the browser. */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  /** True while the initial session probe is in flight. */
  isLoading: boolean;
  /** Re-reads the session from the server, e.g. after the demo signs a visitor in. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session from the httpOnly cookie on boot. The user object is
  // never persisted client-side — the server is the only source of truth for
  // identity and role, so a tampered browser store can't escalate privileges.
  useEffect(() => {
    let cancelled = false;

    authApi.me()
      .then(({ user }) => { if (!cancelled) setUser(user as User | null); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user } = await authApi.login(email, password);
      setUser(user as User);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Connexion impossible. Réessayez.';
      return { ok: false, error: message };
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    try {
      const { user } = await authApi.signup({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role,
        specialty: data.role === 'DOCTOR'
          ? (data.specialty?.trim() || 'Médecin généraliste')
          : undefined,
      });
      setUser(user as User);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Création du compte impossible. Réessayez.';
      return { ok: false, error: message };
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user } = await authApi.me();
      setUser(user as User | null);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    // Clear locally even if the network call fails, so the UI never gets
    // stuck in a signed-in state the server has already dropped.
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
      isLoading,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { ApiUser };
