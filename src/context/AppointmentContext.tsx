import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  addAppointment: (apt: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, apt: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  confirmAppointment: (id: string) => void;
  cancelAppointment: (id: string) => void;
  markAsCompleted: (id: string) => void;
  totalAppointments: number;
  recoveryRate: number;
  currentPatientAptId: string | null;
  setCurrentPatientApt: (id: string | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('shifa_appointments');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        patientId: 'PT-001',
        patientName: 'Ahmed Mansour',
        doctor: 'Dr. Youssef',
        date: TODAY,
        startTime: '09:00',
        endTime: '09:30',
        duration: 30,
        type: 'Consultation',
        status: 'Completed'
      },
      {
        id: '2',
        patientId: 'PT-002',
        patientName: 'Sarah Ben Ammar',
        doctor: 'Dr. Youssef',
        date: TODAY,
        startTime: '10:00',
        endTime: '10:30',
        duration: 30,
        type: 'Consultation',
        status: 'Confirmed'
      },
      {
        id: '3',
        patientId: 'PT-001',
        patientName: 'Ahmed Mansour',
        doctor: 'Dr. Youssef',
        date: TODAY,
        startTime: '11:00',
        endTime: '11:30',
        duration: 30,
        type: 'Follow-up',
        status: 'Confirmed'
      }
    ];
  });

  const [currentPatientAptId, setCurrentPatientApt] = useState<string | null>(() => {
    const saved = localStorage.getItem('shifa_current_patient');
    return saved || null;
  });

  useEffect(() => {
    localStorage.setItem('shifa_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    if (currentPatientAptId) {
      localStorage.setItem('shifa_current_patient', currentPatientAptId);
    } else {
      localStorage.removeItem('shifa_current_patient');
    }
  }, [currentPatientAptId]);

  useEffect(() => {
    if (!currentPatientAptId) return;
    const current = appointments.find(a => a.id === currentPatientAptId);
    if (current && current.status === 'Completed') {
      setCurrentPatientApt(firstConfirmedToday(appointments));
    }
  }, [appointments]);

  const addAppointment = (apt: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = { ...apt, id: Math.random().toString(36).substr(2, 9) };
    setAppointments(prev => [...prev, newApt]);
  };

  const updateAppointment = (id: string, updatedFields: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
  };

  const confirmAppointment = (id: string) => updateAppointment(id, { status: 'Confirmed' });
  const cancelAppointment = (id: string) => updateAppointment(id, { status: 'Cancelled' });
  const markAsCompleted = (id: string) => updateAppointment(id, { status: 'Completed' });

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

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
      setIsModalOpen
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
