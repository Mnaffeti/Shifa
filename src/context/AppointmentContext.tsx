import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { appointmentsApi } from '../lib/api';
import { useAuth } from './AuthContext';

export type AppointmentType = 'Consultation' | 'Follow-up' | 'Surgery' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  type: AppointmentType;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  notes?: string;
}

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (apt: Omit<Appointment, 'id'> & { id?: string }) => Promise<void>;
  updateAppointment: (id: string, apt: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  markAsCompleted: (id: string) => Promise<void>;
  totalAppointments: number;
  recoveryRate: number;
  currentPatientAptId: string | null;
  setCurrentPatientApt: (id: string | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

const TODAY = new Date().toISOString().split('T')[0];

function firstConfirmedToday(apts: Appointment[]): string | null {
  const sorted = apts
    .filter(a => a.date === TODAY && (a.status === 'Confirmed' || a.status === 'Pending'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  return sorted.length > 0 ? sorted[0].id : null;
}

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Currently in consultation" is a UI-local pointer, not clinical data, so
  // it stays in localStorage rather than becoming a server concern.
  const [currentPatientAptId, setCurrentPatientApt] = useState<string | null>(() =>
    localStorage.getItem('shifa_current_patient') || null,
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { appointments } = await appointmentsApi.list();
      setAppointments(appointments);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement des rendez-vous impossible');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (currentPatientAptId) {
      localStorage.setItem('shifa_current_patient', currentPatientAptId);
    } else {
      localStorage.removeItem('shifa_current_patient');
    }
  }, [currentPatientAptId]);

  // When the active consultation completes, advance to the next patient.
  useEffect(() => {
    if (!currentPatientAptId) return;
    const current = appointments.find(a => a.id === currentPatientAptId);
    if (current && current.status === 'Completed') {
      setCurrentPatientApt(firstConfirmedToday(appointments));
    }
  }, [appointments, currentPatientAptId]);

  const addAppointment = useCallback(async (apt: Omit<Appointment, 'id'> & { id?: string }) => {
    // The server assigns the id; any client-supplied one is ignored.
    const { id: _ignored, ...payload } = apt;
    const { appointment } = await appointmentsApi.create(payload);
    setAppointments(prev => [...prev, appointment]);
  }, []);

  const updateAppointment = useCallback(async (id: string, fields: Partial<Appointment>) => {
    const { appointment } = await appointmentsApi.update(id, fields);
    setAppointments(prev => prev.map(a => (a.id === id ? appointment : a)));
  }, []);

  const confirmAppointment = useCallback(
    (id: string) => updateAppointment(id, { status: 'Confirmed' }), [updateAppointment]);
  const cancelAppointment = useCallback(
    (id: string) => updateAppointment(id, { status: 'Cancelled' }), [updateAppointment]);
  const markAsCompleted = useCallback(
    (id: string) => updateAppointment(id, { status: 'Completed' }), [updateAppointment]);

  const deleteAppointment = useCallback(async (id: string) => {
    await appointmentsApi.remove(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  const completed = appointments.filter(a => a.status === 'Completed').length;
  const recoveryRate = appointments.length > 0 ? (completed / appointments.length) * 100 : 0;

  return (
    <AppointmentContext.Provider value={{
      appointments,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      confirmAppointment,
      cancelAppointment,
      markAsCompleted,
      totalAppointments: appointments.length,
      recoveryRate,
      currentPatientAptId,
      setCurrentPatientApt,
      isModalOpen,
      setIsModalOpen,
      isLoading,
      error,
      refresh,
    }}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) throw new Error('useAppointments must be used within an AppointmentProvider');
  return context;
}
