import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ApiError, authApi, type ApiUser } from '../lib/api';

/**
 * Back-office session.
 *
 * Narrower than the doctor app's context on purpose: an admin does not edit a
 * profile or change a password from here, so those actions are absent rather
 * than present and unused.
 */

export type UserRole = 'DOCTOR' | 'ADMIN';

interface User {
  email?: string;
  matricule?: string;
  name: string;
  avatar: string;
  role: UserRole;
  specialty?: string;
  phone?: string;
  mustChangePassword: boolean;
}

interface AuthContextType {
  user: User | null;
  /** Async: credentials are verified by the server, not in the browser. */
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  /** True while the initial session probe is in flight. */
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session from the httpOnly cookie on boot. The user object is
  // never persisted client-side — the server is the only source of truth for
  // identity and role, so a tampered browser store can't escalate privileges.
  //
  // The role check matters here, not just on login: cookies ignore the port,
  // so a doctor signed in to the app on :8080 sends the very same session to
  // this console on :8081. Without this, the back office would treat that
  // doctor as signed in and then 403 on every request it made.
  useEffect(() => {
    let cancelled = false;

    authApi.me()
      .then(({ user }) => {
        if (cancelled) return;
        setUser(user && user.role === 'ADMIN' ? (user as User) : null);
      })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const { user } = await authApi.login(identifier, password);

      // The back office is admin-only. A doctor's credentials are valid against
      // the API, so without this check they would land in a console whose every
      // request then returns 403 — a confusing dead end. Refuse it up front and
      // drop the session we just opened.
      if (user.role !== 'ADMIN') {
        await authApi.logout().catch(() => {});
        return { ok: false, error: "Ce compte n'est pas un compte administrateur." };
      }

      setUser(user as User);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Connexion impossible. Réessayez.';
      return { ok: false, error: message };
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
      logout,
      isAuthenticated: !!user,
      isLoading,
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
