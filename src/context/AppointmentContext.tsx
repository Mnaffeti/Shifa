import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppointmentType = 'Consultation' | 'Follow-up' | 'Surgery' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: AppointmentType;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  notes?: string;
  revenue?: number;
}

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (apt: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, apt: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  confirmAppointment: (id: string) => void;
  cancelAppointment: (id: string) => void;
  markAsCompleted: (id: string, revenue?: number) => void;
  totalAppointments: number;
  totalRevenue: number;
  recoveryRate: number;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('shifa_appointments');
    if (saved) return JSON.parse(saved);

    return [
      { 
        id: '1', 
        patientId: 'PT-001', 
        patientName: 'John Doe', 
        doctor: 'Dr. Youssef', 
        date: new Date().toISOString().split('T')[0], 
        startTime: '10:00', 
        endTime: '10:45', 
        type: 'Consultation', 
        status: 'Completed',
        revenue: 150
      },
      { 
        id: '1689234', 
        patientId: 'PT-001', 
        patientName: 'John Doe', 
        doctor: 'Dr. Youssef', 
        date: new Date().toISOString().split('T')[0], 
        startTime: '14:30', 
        endTime: '15:15', 
        type: 'Consultation', 
        status: 'Confirmed'
      },
      { 
        id: '2', 
        patientId: 'PT-002', 
        patientName: 'Jane Roe', 
        doctor: 'Dr. Aymen', 
        date: new Date().toISOString().split('T')[0], 
        startTime: '11:30', 
        endTime: '12:00', 
        type: 'Follow-up', 
        status: 'Pending' 
      },
      { 
        id: '3', 
        patientId: 'PT-001', 
        patientName: 'John Doe', 
        doctor: 'Dr. Youssef', 
        date: '2024-04-16', 
        startTime: '09:00', 
        endTime: '10:30', 
        type: 'Surgery', 
        status: 'Completed',
        revenue: 1200
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('shifa_appointments', JSON.stringify(appointments));
  }, [appointments]);

  const addAppointment = (apt: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...apt,
      id: Math.random().toString(36).substr(2, 9)
    };
    setAppointments(prev => [newApt, ...prev]);
  };

  const updateAppointment = (id: string, updatedFields: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
  };

  const confirmAppointment = (id: string) => {
    updateAppointment(id, { status: 'Confirmed' });
  };

  const cancelAppointment = (id: string) => {
    updateAppointment(id, { status: 'Cancelled' });
  };

  const markAsCompleted = (id: string, revenue: number = 150) => {
    updateAppointment(id, { status: 'Completed', revenue });
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.revenue || 0), 0);
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
      totalRevenue,
      recoveryRate,
      isModalOpen,
      setIsModalOpen
    }}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}
