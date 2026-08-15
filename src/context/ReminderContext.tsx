import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { UserRole } from './AuthContext';
import { useAuth } from './AuthContext';
import { remindersApi } from '../lib/api';

export interface Reminder {
  id: string;
  text: string;
  dueTime?: string;          // "HH:MM"
  authorRole: UserRole;      // who created it — DOCTOR or SECRETARY
  authorName: string;
  done: boolean;
  createdAt: string;         // ISO datetime
}

type NewReminder = Pick<Reminder, 'text' | 'authorRole' | 'authorName'> & { dueTime?: string };

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (input: NewReminder) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    remindersApi.list()
      .then(({ reminders }) => {
        if (cancelled) return;
        setReminders(reminders);
        setError(null);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chargement impossible');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const addReminder = useCallback(async (input: NewReminder) => {
    const { reminder } = await remindersApi.create(input);
    setReminders(prev => [reminder, ...prev]);
  }, []);

  const toggleReminder = useCallback(async (id: string) => {
    // Flip optimistically so the checkbox responds instantly, then reconcile
    // with the server's record — or roll back if the write failed.
    const current = reminders.find(r => r.id === id);
    if (!current) return;

    const next = !current.done;
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, done: next } : r)));

    try {
      const { reminder } = await remindersApi.update(id, { done: next });
      setReminders(prev => prev.map(r => (r.id === id ? reminder : r)));
    } catch (err) {
      setReminders(prev => prev.map(r => (r.id === id ? { ...r, done: current.done } : r)));
      throw err;
    }
  }, [reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    await remindersApi.remove(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <ReminderContext.Provider value={{
      reminders, addReminder, toggleReminder, deleteReminder, isLoading, error,
    }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}
