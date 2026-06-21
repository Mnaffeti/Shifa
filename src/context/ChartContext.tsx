import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Allergy {
  id: string;
  substance: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
}

export interface Antecedent {
  id: string;
  type: 'medical' | 'surgical' | 'familial';
  description: string;
  date?: string;
}

export interface ActiveProblem {
  id: string;
  cimCode?: string;
  label: string;
  dateOnset: string;
  status: 'active' | 'resolved';
}

export interface ChronicTreatment {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  since: string;
}

export interface MedicalAlert {
  id: string;
  label: string;
}

export interface ClinicalNote {
  id: string;
  text: string;
  author: string;
  createdAt: string; // ISO timestamp
}

export interface Attachment {
  id: string;
  name: string;
  kind: 'scan' | 'photo' | 'document';
  mimeType: string;
  dataUrl: string;   // base64 data URL
  addedAt: string;   // ISO timestamp
  addedBy: string;
}

export interface Vitals {
  date: string;
  weight?: number;
  height?: number;
  bp?: string;
  hr?: number;
  temp?: number;
  spo2?: number;
}

export interface PatientChart {
  patientId: string;
  allergies: Allergy[];
  antecedents: Antecedent[];
  problemesActifs: ActiveProblem[];
  traitements: ChronicTreatment[];
  alertes: MedicalAlert[];
  notes: ClinicalNote[];
  attachments: Attachment[];
  dernieresConstantes?: Vitals;
}

interface ChartContextType {
  getChart: (patientId: string) => PatientChart;
  updateChart: (patientId: string, fields: Partial<PatientChart>) => void;
  updateVitals: (patientId: string, vitals: Vitals) => void;
  // Active conditions
  addProbleme: (patientId: string, label: string, cimCode?: string) => void;
  removeProbleme: (patientId: string, id: string) => void;
  // Medications
  addTraitement: (patientId: string, t: Omit<ChronicTreatment, 'id'>) => void;
  removeTraitement: (patientId: string, id: string) => void;
  // Medical alerts
  addAlerte: (patientId: string, label: string) => void;
  removeAlerte: (patientId: string, id: string) => void;
  // Notes
  addNote: (patientId: string, text: string, author: string) => void;
  removeNote: (patientId: string, id: string) => void;
  // Attachments
  addAttachment: (patientId: string, a: Omit<Attachment, 'id' | 'addedAt'>) => void;
  removeAttachment: (patientId: string, id: string) => void;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

const SEED_CHARTS: Record<string, PatientChart> = {
  'PT-001': {
    patientId: 'PT-001',
    allergies: [
      { id: 'a1', substance: 'Pénicilline', severity: 'severe', reaction: 'Choc anaphylactique' },
      { id: 'a2', substance: 'Aspirine', severity: 'mild', reaction: 'Urticaire' },
    ],
    antecedents: [
      { id: 'ant1', type: 'medical', description: 'Hypertension artérielle', date: '2018' },
      { id: 'ant2', type: 'medical', description: 'Diabète de type 2', date: '2020' },
      { id: 'ant3', type: 'surgical', description: 'Appendicectomie', date: '2010' },
      { id: 'ant4', type: 'familial', description: 'Cardiopathie ischémique (père)' },
    ],
    problemesActifs: [
      { id: 'p1', cimCode: 'I10', label: 'Hypertension artérielle', dateOnset: '2018-03-01', status: 'active' },
      { id: 'p2', cimCode: 'E11', label: 'Diabète de type 2', dateOnset: '2020-06-15', status: 'active' },
    ],
    traitements: [
      { id: 't1', name: 'Amlodipine', dosage: '5 mg', frequency: '1×/jour', since: '2018-04' },
      { id: 't2', name: 'Metformine', dosage: '850 mg', frequency: '2×/jour', since: '2020-07' },
      { id: 't3', name: 'Périndopril', dosage: '5 mg', frequency: '1×/jour matin', since: '2021-01' },
    ],
    alertes: [
      { id: 'al1', label: 'Allergie Pénicilline' },
      { id: 'al2', label: 'Hypertension' },
      { id: 'al3', label: 'Diabète type 2' },
    ],
    notes: [
      { id: 'n1', text: 'Amélioration de la qualité du sommeil après ajustement du dosage. Surveiller la tension à domicile.', author: 'Dr. Youssef', createdAt: '2024-04-10T11:30:00.000Z' },
    ],
    attachments: [],
    dernieresConstantes: {
      date: '2024-04-10',
      weight: 82,
      height: 175,
      bp: '138/88',
      hr: 76,
      temp: 37.1,
      spo2: 98,
    },
  },
  'PT-002': {
    patientId: 'PT-002',
    allergies: [],
    antecedents: [
      { id: 'ant1', type: 'medical', description: 'Asthme infantile (résolu)', date: '1998' },
    ],
    problemesActifs: [
      { id: 'p1', cimCode: 'F41.1', label: 'Trouble anxieux généralisé', dateOnset: '2022-01-10', status: 'active' },
    ],
    traitements: [],
    alertes: [],
    notes: [],
    attachments: [],
    dernieresConstantes: {
      date: '2024-04-12',
      weight: 58,
      height: 165,
      bp: '110/70',
      hr: 88,
      temp: 36.8,
      spo2: 99,
    },
  },
};

// Ensure a chart object has every array field (backfills older localStorage data)
function normalizeChart(c: PatientChart): PatientChart {
  return {
    ...c,
    allergies: c.allergies ?? [],
    antecedents: c.antecedents ?? [],
    problemesActifs: c.problemesActifs ?? [],
    traitements: c.traitements ?? [],
    alertes: c.alertes ?? [],
    notes: c.notes ?? [],
    attachments: c.attachments ?? [],
  };
}

export function ChartProvider({ children }: { children: ReactNode }) {
  const [charts, setCharts] = useState<Record<string, PatientChart>>(() => {
    const saved = localStorage.getItem('shifa_charts');
    if (saved) {
      const parsed: Record<string, PatientChart> = JSON.parse(saved);
      // Backfill any newly-added array fields for charts saved before this version
      return Object.fromEntries(
        Object.entries(parsed).map(([id, c]) => [id, normalizeChart(c)])
      );
    }
    return SEED_CHARTS;
  });

  useEffect(() => {
    localStorage.setItem('shifa_charts', JSON.stringify(charts));
  }, [charts]);

  const getChart = (patientId: string): PatientChart =>
    charts[patientId] ?? {
      patientId,
      allergies: [],
      antecedents: [],
      problemesActifs: [],
      traitements: [],
      alertes: [],
      notes: [],
      attachments: [],
    };

  const updateChart = (patientId: string, fields: Partial<PatientChart>) => {
    setCharts(prev => ({
      ...prev,
      [patientId]: { ...getChart(patientId), ...fields },
    }));
  };

  const updateVitals = (patientId: string, vitals: Vitals) => {
    updateChart(patientId, { dernieresConstantes: vitals });
  };

  // ── Active conditions ──
  const addProbleme = (patientId: string, label: string, cimCode?: string) => {
    const chart = getChart(patientId);
    const probleme: ActiveProblem = {
      id: uid(),
      label,
      cimCode: cimCode || undefined,
      dateOnset: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    updateChart(patientId, { problemesActifs: [...chart.problemesActifs, probleme] });
  };
  const removeProbleme = (patientId: string, id: string) => {
    const chart = getChart(patientId);
    updateChart(patientId, { problemesActifs: chart.problemesActifs.filter(p => p.id !== id) });
  };

  // ── Medications ──
  const addTraitement = (patientId: string, t: Omit<ChronicTreatment, 'id'>) => {
    const chart = getChart(patientId);
    updateChart(patientId, { traitements: [...chart.traitements, { ...t, id: uid() }] });
  };
  const removeTraitement = (patientId: string, id: string) => {
    const chart = getChart(patientId);
    updateChart(patientId, { traitements: chart.traitements.filter(t => t.id !== id) });
  };

  // ── Medical alerts ──
  const addAlerte = (patientId: string, label: string) => {
    const chart = getChart(patientId);
    updateChart(patientId, { alertes: [...chart.alertes, { id: uid(), label }] });
  };
  const removeAlerte = (patientId: string, id: string) => {
    const chart = getChart(patientId);
    updateChart(patientId, { alertes: chart.alertes.filter(a => a.id !== id) });
  };

  // ── Notes ──
  const addNote = (patientId: string, text: string, author: string) => {
    const chart = getChart(patientId);
    const note: ClinicalNote = { id: uid(), text, author, createdAt: new Date().toISOString() };
    updateChart(patientId, { notes: [note, ...chart.notes] });
  };
  const removeNote = (patientId: string, id: string) => {
    const chart = getChart(patientId);
    updateChart(patientId, { notes: chart.notes.filter(n => n.id !== id) });
  };

  // ── Attachments ──
  const addAttachment = (patientId: string, a: Omit<Attachment, 'id' | 'addedAt'>) => {
    const chart = getChart(patientId);
    const attachment: Attachment = { ...a, id: uid(), addedAt: new Date().toISOString() };
    updateChart(patientId, { attachments: [attachment, ...chart.attachments] });
  };
  const removeAttachment = (patientId: string, id: string) => {
    const chart = getChart(patientId);
    updateChart(patientId, { attachments: chart.attachments.filter(at => at.id !== id) });
  };

  return (
    <ChartContext.Provider value={{
      getChart, updateChart, updateVitals,
      addProbleme, removeProbleme,
      addTraitement, removeTraitement,
      addAlerte, removeAlerte,
      addNote, removeNote,
      addAttachment, removeAttachment,
    }}>
      {children}
    </ChartContext.Provider>
  );
}

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

export function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('useChart must be used within ChartProvider');
  return ctx;
}
