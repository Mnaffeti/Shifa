import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'SECRETARY' | 'DOCTOR';

interface User {
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  specialty?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCOUNTS = [
  {
    email: 'secretary@medica.com',
    password: 'secretary123',
    name: 'Sophie Martin',
    role: 'SECRETARY' as UserRole,
    avatar: 'https://picsum.photos/seed/sophie/100/100'
  },
  {
    email: 'doctor@medica.com',
    password: 'doctor123',
    name: 'Dr. Renata Moeloek',
    role: 'DOCTOR' as UserRole,
    specialty: 'Specialist',
    avatar: 'https://picsum.photos/seed/foulen/100/100'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shifa_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email: string, password: string) => {
    const account = ACCOUNTS.find(a => a.email === email && a.password === password);
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shifa_auth');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
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
