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

    // ── Demo seed data ─────────────────────────────────────────────────────
    // Dates are computed relative to "now" so the demo always looks current.
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };
    const avatar = (first: string, last: string) =>
      `https://picsum.photos/seed/patient-${`${first} ${last}`.toLowerCase().replace(/\s+/g, '-')}/100/100`;

    return [
      {
        id: 'PT-001', firstName: 'Ahmed', lastName: 'Mansour', dob: '1985-05-15', gender: 'Homme',
        phone: '+216 22 345 678', email: 'ahmed.mansour@example.com', address: '12 Rue de Carthage, Tunis',
        profession: 'Ingénieur', cin: '08123456', assignedDoctor: 'Dr. Youssef', bloodType: 'A+',
        status: 'Active', lastVisit: daysAgo(9), avatar: avatar('Ahmed', 'Mansour'), createdAt: daysAgo(210),
      },
      {
        id: 'PT-002', firstName: 'Sarah', lastName: 'Ben Ammar', dob: '1992-08-22', gender: 'Femme',
        phone: '+216 98 765 432', email: 'sarah.benammar@example.com', address: '45 Avenue Habib Bourguiba, Sousse',
        profession: 'Enseignante', cin: '09234567', assignedDoctor: 'Dr. Youssef', bloodType: 'O-',
        status: 'New', lastVisit: 'Never', avatar: avatar('Sarah', 'Ben Ammar'), createdAt: daysAgo(0),
      },
      {
        id: 'PT-003', firstName: 'Youssef', lastName: 'Trabelsi', dob: '1978-11-03', gender: 'Homme',
        phone: '+216 55 112 998', email: 'youssef.trabelsi@example.com', address: '7 Rue Ibn Khaldoun, Sfax',
        profession: 'Comptable', cin: '05987321', assignedDoctor: 'Dr. Youssef', bloodType: 'B+',
        status: 'Active', lastVisit: daysAgo(4), avatar: avatar('Youssef', 'Trabelsi'), createdAt: daysAgo(160),
      },
      {
        id: 'PT-004', firstName: 'Leila', lastName: 'Haddad', dob: '1996-02-17', gender: 'Femme',
        phone: '+216 24 668 100', email: 'leila.haddad@example.com', address: '30 Rue de la Liberté, Bizerte',
        profession: 'Architecte', cin: '11445566', assignedDoctor: 'Dr. Youssef', bloodType: 'A-',
        status: 'Active', lastVisit: daysAgo(1), avatar: avatar('Leila', 'Haddad'), createdAt: daysAgo(95),
      },
      {
        id: 'PT-005', firstName: 'Karim', lastName: 'Bouazizi', dob: '2001-06-29', gender: 'Homme',
        phone: '+216 50 334 221', email: 'karim.bouazizi@example.com', address: '18 Avenue de Paris, Tunis',
        profession: 'Étudiant', cin: '14778899', assignedDoctor: 'Dr. Youssef', bloodType: 'AB+',
        status: 'New', lastVisit: 'Never', avatar: avatar('Karim', 'Bouazizi'), createdAt: daysAgo(2),
      },
      {
        id: 'PT-006', firstName: 'Nour', lastName: 'Gharbi', dob: '1988-09-12', gender: 'Femme',
        phone: '+216 21 909 887', email: 'nour.gharbi@example.com', address: '5 Rue du Lac, Tunis',
        profession: 'Pharmacienne', cin: '07665544', assignedDoctor: 'Dr. Youssef', bloodType: 'O+',
        status: 'Active', lastVisit: daysAgo(6), avatar: avatar('Nour', 'Gharbi'), createdAt: daysAgo(140),
      },
      {
        id: 'PT-007', firstName: 'Mehdi', lastName: 'Khelifi', dob: '1970-12-05', gender: 'Homme',
        phone: '+216 97 445 663', email: 'mehdi.khelifi@example.com', address: '22 Rue Alain Savary, Ariana',
        profession: 'Retraité', cin: '02334455', assignedDoctor: 'Dr. Youssef', bloodType: 'B-',
        status: 'Inactive', lastVisit: daysAgo(85), avatar: avatar('Mehdi', 'Khelifi'), createdAt: daysAgo(300),
      },
      {
        id: 'PT-008', firstName: 'Emna', lastName: 'Jaziri', dob: '1999-04-08', gender: 'Femme',
        phone: '+216 26 771 200', email: 'emna.jaziri@example.com', address: '9 Rue de Rome, Nabeul',
        profession: 'Infirmière', cin: '13221100', assignedDoctor: 'Dr. Youssef', bloodType: 'A+',
        status: 'Active', lastVisit: daysAgo(3), avatar: avatar('Emna', 'Jaziri'), createdAt: daysAgo(70),
      },
      {
        id: 'PT-009', firstName: 'Rania', lastName: 'Sassi', dob: '1983-07-25', gender: 'Femme',
        phone: '+216 52 118 334', email: 'rania.sassi@example.com', address: '61 Avenue de la République, Monastir',
        profession: 'Avocate', cin: '06554433', assignedDoctor: 'Dr. Youssef', bloodType: 'AB-',
        status: 'Active', lastVisit: daysAgo(12), avatar: avatar('Rania', 'Sassi'), createdAt: daysAgo(180),
      },
      {
        id: 'PT-010', firstName: 'Hedi', lastName: 'Belhaj', dob: '1965-03-19', gender: 'Homme',
        phone: '+216 23 556 778', email: 'hedi.belhaj@example.com', address: '3 Rue Farhat Hached, Gabès',
        profession: 'Commerçant', cin: '01998877', assignedDoctor: 'Dr. Youssef', bloodType: 'O+',
        status: 'Active', lastVisit: daysAgo(20), avatar: avatar('Hedi', 'Belhaj'), createdAt: daysAgo(240),
      },
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
