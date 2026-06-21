import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Vitals } from './ChartContext';

export type { Vitals };

export interface OrdonnanceItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Addendum {
  text: string;
  addedBy: string;
  addedAt: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  appointmentId: string;
  date: string;
  doctor: string;
  soap: {
    subjectif: string;
    objectif: string;
    assessment: string;
    plan: string;
  };
  diagnoses: string[];
  constantes?: Vitals;
  ordonnance: {
    items: OrdonnanceItem[];
    renewedFromId?: string;
    templateName?: string;
  };
  status: 'draft' | 'signed';
  signedAt?: string;
  signedBy?: string;
  addenda: Addendum[];
}

interface ConsultationContextType {
  consultations: Consultation[];
  getOrCreateDraft: (appointmentId: string, patientId: string, doctor: string, date: string) => void;
  updateConsultation: (id: string, fields: Partial<Consultation>) => void;
  updateSoap: (id: string, key: keyof Consultation['soap'], value: string) => void;
  updateDiagnoses: (id: string, diagnoses: string[]) => void;
  updateOrdonnance: (id: string, items: OrdonnanceItem[]) => void;
  updateConstantes: (id: string, constantes: Vitals) => void;
  signConsultation: (id: string, doctor: string) => void;
  unlockConsultation: (id: string) => void;
  addAddendum: (id: string, text: string, doctor: string) => void;
  getPatientConsultations: (patientId: string) => Consultation[];
  findByAppointment: (appointmentId: string) => Consultation | undefined;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

const TODAY = new Date().toISOString().split('T')[0];

const SEED: Consultation[] = [
  {
    id: 'cons-seed-001',
    patientId: 'PT-001',
    appointmentId: 'seed-apt-001',
    date: '2024-04-10',
    doctor: 'Dr. Youssef',
    soap: {
      subjectif: 'Patient de 39 ans suivi pour HTA et diabète de type 2. Se plaint de céphalées matinales depuis 1 semaine et de fatigue progressive. Bonne observance thérapeutique déclarée.',
      objectif: 'PA : 148/92 mmHg, FC : 82 bpm, Poids : 83 kg, SpO2 : 97%.\nExamen cardiovasculaire : bruits du cœur réguliers, pas de souffle audible.\nExamen neurologique : sans particularité. Fond d\'œil non réalisé ce jour.',
      assessment: 'I10 — Hypertension artérielle mal contrôlée\nE11.9 — Diabète de type 2 stable\nR51 — Céphalées à évaluer',
      plan: 'Ajustement thérapeutique : augmentation Amlodipine 5→10 mg/j.\nContrôle tensionnel à J+15.\nBilan biologique : HbA1c, créatinine, ionogramme, bilan lipidique.\nRDV cardiologue si pas d\'amélioration à 1 mois.\nRégime hyposodé rappelé.',
    },
    diagnoses: ['Hypertension artérielle', 'Diabète de type 2', 'Céphalées'],
    constantes: { date: '2024-04-10', weight: 83, height: 175, bp: '148/92', hr: 82, temp: 36.9, spo2: 97 },
    ordonnance: {
      items: [
        { id: 'rx1', medication: 'Amlodipine', dosage: '10 mg', frequency: '1 comprimé/jour', duration: '1 mois', instructions: 'Le matin à jeun' },
        { id: 'rx2', medication: 'Metformine', dosage: '850 mg', frequency: '2 comprimés/jour', duration: '1 mois', instructions: 'Pendant les repas (midi et soir)' },
        { id: 'rx3', medication: 'Périndopril', dosage: '5 mg', frequency: '1 comprimé/jour', duration: '1 mois', instructions: 'Le matin' },
      ],
    },
    status: 'signed',
    signedAt: '2024-04-10T11:30:00.000Z',
    signedBy: 'Dr. Youssef',
    addenda: [],
  },
  {
    id: 'cons-seed-002',
    patientId: 'PT-001',
    appointmentId: 'seed-apt-002',
    date: '2024-02-15',
    doctor: 'Dr. Youssef',
    soap: {
      subjectif: 'Consultation de suivi bimensuel. Patient asymptomatique, auto-mesures tensionnelles à domicile régulières (moyenne 130/82). Pas d\'effets indésirables signalés.',
      objectif: 'PA : 132/84 mmHg, FC : 74 bpm, Poids : 82 kg.\nGlycémie capillaire : 1,28 g/L à jeun.\nExamen clinique sans anomalie.',
      assessment: 'I10 — HTA équilibrée sous traitement\nE11.9 — Diabète type 2 bien contrôlé',
      plan: 'Maintien du traitement en cours. Renouvellement 3 mois.\nHbA1c à 3 mois. Rappel activité physique 30 min/jour.',
    },
    diagnoses: ['Hypertension artérielle', 'Diabète de type 2'],
    constantes: { date: '2024-02-15', weight: 82, bp: '132/84', hr: 74, temp: 36.7, spo2: 98 },
    ordonnance: {
      items: [
        { id: 'rx4', medication: 'Amlodipine', dosage: '5 mg', frequency: '1 comprimé/jour', duration: '3 mois', instructions: 'Le matin' },
        { id: 'rx5', medication: 'Metformine', dosage: '850 mg', frequency: '2 comprimés/jour', duration: '3 mois', instructions: 'Pendant les repas' },
        { id: 'rx6', medication: 'Périndopril', dosage: '5 mg', frequency: '1 comprimé/jour', duration: '3 mois', instructions: 'Le matin' },
      ],
    },
    status: 'signed',
    signedAt: '2024-02-15T10:15:00.000Z',
    signedBy: 'Dr. Youssef',
    addenda: [],
  },
];

export function ConsultationProvider({ children }: { children: ReactNode }) {
  const [consultations, setConsultations] = useState<Consultation[]>(() => {
    const saved = localStorage.getItem('shifa_consultations');
    if (saved) {
      const parsed: Consultation[] = JSON.parse(saved);
      // Backfill diagnoses for records saved before this field existed
      return parsed.map(c => c.diagnoses ? c : { ...c, diagnoses: [] });
    }
    return SEED;
  });

  useEffect(() => {
    localStorage.setItem('shifa_consultations', JSON.stringify(consultations));
  }, [consultations]);

  const findByAppointment = (appointmentId: string) =>
    consultations.find(c => c.appointmentId === appointmentId);

  const getOrCreateDraft = (appointmentId: string, patientId: string, doctor: string, date: string) => {
    if (consultations.find(c => c.appointmentId === appointmentId)) return;
    const draft: Consultation = {
      id: `cons-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      appointmentId,
      date,
      doctor,
      soap: { subjectif: '', objectif: '', assessment: '', plan: '' },
      diagnoses: [],
      ordonnance: { items: [] },
      status: 'draft',
      addenda: [],
    };
    setConsultations(prev => [...prev, draft]);
  };

  const updateConsultation = (id: string, fields: Partial<Consultation>) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, ...fields } : c))
    );
  };

  const updateSoap = (id: string, key: keyof Consultation['soap'], value: string) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, soap: { ...c.soap, [key]: value } } : c))
    );
  };

  const updateDiagnoses = (id: string, diagnoses: string[]) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, diagnoses } : c))
    );
  };

  const updateOrdonnance = (id: string, items: OrdonnanceItem[]) => {
    setConsultations(prev =>
      prev.map(c =>
        c.id === id ? { ...c, ordonnance: { ...c.ordonnance, items } } : c
      )
    );
  };

  const updateConstantes = (id: string, constantes: Vitals) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, constantes } : c))
    );
  };

  const signConsultation = (id: string, doctor: string) => {
    setConsultations(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: 'signed', signedAt: new Date().toISOString(), signedBy: doctor }
          : c
      )
    );
  };

  const unlockConsultation = (id: string) => {
    setConsultations(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: 'draft', signedAt: undefined, signedBy: undefined }
          : c
      )
    );
  };

  const addAddendum = (id: string, text: string, doctor: string) => {
    setConsultations(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, addenda: [...c.addenda, { text, addedBy: doctor, addedAt: new Date().toISOString() }] }
          : c
      )
    );
  };

  const getPatientConsultations = (patientId: string) =>
    consultations
      .filter(c => c.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ConsultationContext.Provider value={{
      consultations,
      getOrCreateDraft,
      updateConsultation,
      updateSoap,
      updateDiagnoses,
      updateOrdonnance,
      updateConstantes,
      signConsultation,
      unlockConsultation,
      addAddendum,
      getPatientConsultations,
      findByAppointment,
    }}>
      {children}
    </ConsultationContext.Provider>
  );
}

export function useConsultations() {
  const ctx = useContext(ConsultationContext);
  if (!ctx) throw new Error('useConsultations must be used within ConsultationProvider');
  return ctx;
}
