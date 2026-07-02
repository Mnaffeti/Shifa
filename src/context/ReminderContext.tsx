import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole } from './AuthContext';

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
  addReminder: (input: NewReminder) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

function seed(): Reminder[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'rem-1',
      text: 'Transmettre les résultats de laboratoire à Ahmed Mansour',
      dueTime: '14:00',
      authorRole: 'SECRETARY',
      authorName: 'Foulena',
      done: false,
      createdAt: now,
    },
    {
      id: 'rem-2',
      text: 'Revoir la posologie avant la prochaine consultation',
      authorRole: 'DOCTOR',
      authorName: 'Dr. Youssef',
      done: false,
      createdAt: now,
    },
  ];
}

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('shifa_reminders');
    return saved ? JSON.parse(saved) : seed();
  });

  useEffect(() => {
    localStorage.setItem('shifa_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = (input: NewReminder) => {
    const reminder: Reminder = {
      ...input,
      id: `rem-${Math.random().toString(36).slice(2, 9)}`,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setReminders(prev => [reminder, ...prev]);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, done: !r.done } : r)));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <ReminderContext.Provider value={{ reminders, addReminder, toggleReminder, deleteReminder }}>
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
