import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'SECRETARY' | 'DOCTOR';

interface User {
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  specialty?: string;
}

interface Account {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string;
  specialty?: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  specialty?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (data: SignupData) => { ok: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEED_ACCOUNTS: Account[] = [
  {
    email: 'secretary@shifa.com',
    password: 'secretary123',
    name: 'Foulena',
    role: 'SECRETARY',
    avatar: 'https://picsum.photos/seed/secretary-sophie/100/100'
  },
  {
    email: 'doctor@shifa.com',
    password: 'doctor123',
    name: 'Dr. Youssef',
    role: 'DOCTOR',
    specialty: 'Spécialiste',
    avatar: 'https://picsum.photos/seed/doctor-youssef/100/100'
  }
];

function loadAccounts(): Account[] {
  const saved = localStorage.getItem('shifa_accounts');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Account[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through to seed */ }
  }
  return SEED_ACCOUNTS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(loadAccounts);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shifa_auth');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('shifa_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const login = (email: string, password: string) => {
    const account = accounts.find(a => a.email === email && a.password === password);
    if (account) {
      const userData: User = {
        email: account.email,
        name: account.name,
        avatar: account.avatar,
        role: account.role,
        specialty: account.specialty
      };
      setUser(userData);
      localStorage.setItem('shifa_auth', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const signup = (data: SignupData): { ok: boolean; error?: string } => {
    const email = data.email.trim().toLowerCase();
    if (accounts.some(a => a.email.toLowerCase() === email)) {
      return { ok: false, error: 'Un compte existe déjà avec cet email.' };
    }

    // Doctors are addressed as "Dr. …"; keep the prefix if already present.
    const displayName =
      data.role === 'DOCTOR' && !/^dr\.?\s/i.test(data.name.trim())
        ? `Dr. ${data.name.trim()}`
        : data.name.trim();

    const account: Account = {
      email,
      password: data.password,
      name: displayName,
      role: data.role,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`,
      specialty: data.role === 'DOCTOR' ? data.specialty?.trim() || 'Médecin généraliste' : undefined,
    };

    setAccounts(prev => [...prev, account]);

    const userData: User = {
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      role: account.role,
      specialty: account.specialty,
    };
    setUser(userData);
    localStorage.setItem('shifa_auth', JSON.stringify(userData));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shifa_auth');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated: !!user
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
