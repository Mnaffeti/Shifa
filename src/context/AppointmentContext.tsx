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

// ── Demo seed generator ───────────────────────────────────────────────────
// Builds a realistic schedule across the *current* week so the demo always
// looks current: past days completed, today a mix, upcoming days confirmed.
const DEMO_ROSTER = [
  { id: 'PT-001', name: 'Ahmed Mansour' },
  { id: 'PT-002', name: 'Sarah Ben Ammar' },
  { id: 'PT-003', name: 'Youssef Trabelsi' },
  { id: 'PT-004', name: 'Leila Haddad' },
  { id: 'PT-005', name: 'Karim Bouazizi' },
  { id: 'PT-006', name: 'Nour Gharbi' },
  { id: 'PT-008', name: 'Emna Jaziri' },
  { id: 'PT-009', name: 'Rania Sassi' },
  { id: 'PT-010', name: 'Hedi Belhaj' },
];

const DEMO_TYPES: AppointmentType[] = ['Consultation', 'Follow-up', 'Surgery'];
const DEMO_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

function addMinutesTo(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

function ymdUTC(d: Date): string {
  return d.toISOString().split('T')[0];
}

function generateDemoWeek(): Appointment[] {
  const out: Appointment[] = [];
  const todayUTC = new Date(TODAY + 'T00:00:00Z');
  const dow = (todayUTC.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(todayUTC);
  monday.setUTCDate(todayUTC.getUTCDate() - dow);

  let counter = 1;
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    const dateStr = ymdUTC(day);
    const isPast = dateStr < TODAY;
    const isToday = dateStr === TODAY;
    const count = i >= 5 ? 2 : isToday ? 6 : 4; // lighter weekends

    for (let j = 0; j < count; j++) {
      const patient = DEMO_ROSTER[(counter - 1) % DEMO_ROSTER.length];
      const type = DEMO_TYPES[(i + j) % DEMO_TYPES.length];
      const startTime = DEMO_SLOTS[j % DEMO_SLOTS.length];
      const duration = type === 'Surgery' ? 60 : 30;

      let status: Appointment['status'];
      if (isPast) status = 'Completed';
      else if (isToday) status = j < 2 ? 'Completed' : j === 5 ? 'Pending' : 'Confirmed';
      else status = 'Confirmed';

      out.push({
        id: String(counter),
        patientId: patient.id,
        patientName: patient.name,
        doctor: 'Dr. Youssef',
        date: dateStr,
        startTime,
        endTime: addMinutesTo(startTime, duration),
        duration,
        type,
        status,
      });
      counter++;
    }
  }
  return out;
}

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
    return generateDemoWeek();
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
