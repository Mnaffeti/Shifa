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
  dernieresConstantes?: Vitals;
}

interface ChartContextType {
  getChart: (patientId: string) => PatientChart;
  updateChart: (patientId: string, fields: Partial<PatientChart>) => void;
  updateVitals: (patientId: string, vitals: Vitals) => void;
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

export function ChartProvider({ children }: { children: ReactNode }) {
  const [charts, setCharts] = useState<Record<string, PatientChart>>(() => {
    const saved = localStorage.getItem('shifa_charts');
    if (saved) return JSON.parse(saved);
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

  return (
    <ChartContext.Provider value={{ getChart, updateChart, updateVitals }}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('useChart must be used within ChartProvider');
  return ctx;
}
