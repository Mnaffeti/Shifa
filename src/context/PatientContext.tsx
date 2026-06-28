import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  profession: string;
  cin: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentComments?: string;
  assignedDoctor: string;
  bloodType: string;
  status: 'Active' | 'New' | 'Inactive';
  lastVisit: string;
  avatar: string;
  createdAt: string;
}

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'lastVisit' | 'avatar' | 'createdAt'>) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  totalPatients: number;
  activePatients: number;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('shifa_patients');
    if (saved) {
      const parsed: Patient[] = JSON.parse(saved);
      // Backfill createdAt for existing patients that don't have it
      return parsed.map(p => p.createdAt ? p : { ...p, createdAt: p.lastVisit !== 'Never' ? p.lastVisit : new Date().toISOString().split('T')[0] });
    }

    return [
      {
        id: 'PT-001',
        firstName: 'Ahmed',
        lastName: 'Mansour',
        dob: '1985-05-15',
        gender: 'Male',
        phone: '123-456-7890',
        email: 'ahmed.mansour@example.com',
        address: '123 Main St, Tunis',
        profession: 'Ingénieur',
        cin: '08123456',
        assignedDoctor: 'Dr. Youssef',
        bloodType: 'A+',
        status: 'Active',
        lastVisit: '2024-04-10',
        avatar: 'https://picsum.photos/seed/patient-ahmed/100/100',
        createdAt: '2024-04-10'
      },
      {
        id: 'PT-002',
        firstName: 'Sarah',
        lastName: 'Ben Ammar',
        dob: '1992-08-22',
        gender: 'Female',
        phone: '098-765-4321',
        email: 'sarah.ben@example.com',
        address: '456 Oak Ave, Sousse',
        profession: 'Enseignante',
        cin: '09234567',
        assignedDoctor: 'Dr. Youssef',
        bloodType: 'O-',
        status: 'New',
        lastVisit: '2024-04-12',
        avatar: 'https://picsum.photos/seed/patient-sarah/100/100',
        createdAt: '2024-04-12'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('shifa_patients', JSON.stringify(patients));
  }, [patients]);

  const addPatient = (patient: Omit<Patient, 'id' | 'lastVisit' | 'avatar' | 'createdAt'>) => {
    const newPatient: Patient = {
      ...patient,
      id: `PT-${(patients.length + 1).toString().padStart(3, '0')}`,
      lastVisit: 'Never',
      avatar: `https://picsum.photos/seed/patient-${patient.firstName.toLowerCase()}-${patient.lastName.toLowerCase()}/100/100`,
      status: 'New',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPatients(prev => [newPatient, ...prev]);
  };

  const updatePatient = (id: string, updatedFields: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  return (
    <PatientContext.Provider value={{
      patients,
      addPatient,
      updatePatient,
      deletePatient,
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.status === 'Active').length
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
