import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { patientsApi, type NewPatientInput } from '../lib/api';
import { useAuth } from './AuthContext';

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
  addPatient: (patient: NewPatientInput) => Promise<void>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  totalPatients: number;
  activePatients: number;
  isLoading: boolean;
  error: string | null;
  /** Re-fetches from the server; useful after an error or an external change. */
  refresh: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setPatients([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { patients } = await patientsApi.list();
      setPatients(patients);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement des patients impossible');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Each mutation returns the server's canonical record and merges it into
  // local state, so generated fields (id, avatar, createdAt) stay authoritative.
  const addPatient = useCallback(async (input: NewPatientInput) => {
    const { patient } = await patientsApi.create(input);
    setPatients(prev => [patient, ...prev]);
  }, []);

  const updatePatient = useCallback(async (id: string, fields: Partial<Patient>) => {
    const { patient } = await patientsApi.update(id, fields);
    setPatients(prev => prev.map(p => (p.id === id ? patient : p)));
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    await patientsApi.remove(id);
    setPatients(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <PatientContext.Provider value={{
      patients,
      addPatient,
      updatePatient,
      deletePatient,
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.status === 'Active').length,
      isLoading,
      error,
      refresh,
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
