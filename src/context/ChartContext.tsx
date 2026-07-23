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
  'PT-003': {
    patientId: 'PT-003',
    allergies: [
      { id: 'a1', substance: 'Iode', severity: 'moderate', reaction: 'Éruption cutanée' },
    ],
    antecedents: [
      { id: 'ant1', type: 'medical', description: 'Hypercholestérolémie', date: '2019' },
      { id: 'ant2', type: 'surgical', description: 'Hernie inguinale', date: '2015' },
    ],
    problemesActifs: [
      { id: 'p1', cimCode: 'E78.0', label: 'Hypercholestérolémie', dateOnset: '2019-09-01', status: 'active' },
    ],
    traitements: [
      { id: 't1', name: 'Atorvastatine', dosage: '20 mg', frequency: '1×/jour soir', since: '2019-10' },
    ],
    alertes: [
      { id: 'al1', label: 'Allergie Iode' },
      { id: 'al2', label: 'Cholestérol élevé' },
    ],
    notes: [
      { id: 'n1', text: 'Bilan lipidique à recontrôler dans 3 mois. Conseils diététiques donnés.', author: 'Dr. Youssef', createdAt: '2024-05-02T09:15:00.000Z' },
    ],
    attachments: [],
    dernieresConstantes: { date: '2024-05-02', weight: 88, height: 180, bp: '132/85', hr: 72, temp: 36.9, spo2: 97 },
  },
  'PT-004': {
    patientId: 'PT-004',
    allergies: [],
    antecedents: [
      { id: 'ant1', type: 'familial', description: 'Migraine (mère)' },
    ],
    problemesActifs: [
      { id: 'p1', cimCode: 'G43.9', label: 'Migraine', dateOnset: '2021-04-20', status: 'active' },
    ],
    traitements: [
      { id: 't1', name: 'Sumatriptan', dosage: '50 mg', frequency: 'Si crise', since: '2021-05' },
    ],
    alertes: [{ id: 'al1', label: 'Migraine chronique' }],
    notes: [],
    attachments: [],
    dernieresConstantes: { date: '2024-06-18', weight: 62, height: 168, bp: '118/76', hr: 70, temp: 37.0, spo2: 99 },
  },
  'PT-005': {
    patientId: 'PT-005',
    allergies: [{ id: 'a1', substance: 'Arachides', severity: 'severe', reaction: 'Œdème de Quincke' }],
    antecedents: [{ id: 'ant1', type: 'medical', description: 'Asthme allergique', date: '2010' }],
    problemesActifs: [
      { id: 'p1', cimCode: 'J45', label: 'Asthme', dateOnset: '2010-03-01', status: 'active' },
    ],
    traitements: [
      { id: 't1', name: 'Salbutamol', dosage: '100 µg', frequency: 'Si besoin', since: '2010-04' },
      { id: 't2', name: 'Budésonide', dosage: '200 µg', frequency: '2×/jour', since: '2018-01' },
    ],
    alertes: [
      { id: 'al1', label: 'Allergie Arachides' },
      { id: 'al2', label: 'Asthme' },
    ],
    notes: [],
    attachments: [],
    dernieresConstantes: { date: '2024-06-30', weight: 74, height: 178, bp: '124/78', hr: 80, temp: 36.7, spo2: 96 },
  },
  'PT-006': {
    patientId: 'PT-006',
    allergies: [],
    antecedents: [{ id: 'ant1', type: 'medical', description: 'Anémie ferriprive', date: '2022' }],
    problemesActifs: [],
    traitements: [
      { id: 't1', name: 'Fer (Tardyferon)', dosage: '80 mg', frequency: '1×/jour', since: '2022-11' },
    ],
    alertes: [{ id: 'al1', label: 'Anémie' }],
    notes: [
      { id: 'n1', text: 'Ferritine en amélioration. Poursuivre supplémentation 2 mois.', author: 'Dr. Youssef', createdAt: '2024-05-20T10:00:00.000Z' },
    ],
    attachments: [],
    dernieresConstantes: { date: '2024-05-20', weight: 60, height: 170, bp: '108/68', hr: 76, temp: 36.8, spo2: 99 },
  },
  'PT-008': {
    patientId: 'PT-008',
    allergies: [],
    antecedents: [],
    problemesActifs: [],
    traitements: [],
    alertes: [],
    notes: [],
    attachments: [],
    dernieresConstantes: { date: '2024-07-01', weight: 55, height: 162, bp: '112/72', hr: 68, temp: 36.6, spo2: 100 },
  },
  'PT-009': {
    patientId: 'PT-009',
    allergies: [{ id: 'a1', substance: 'Pollen', severity: 'mild', reaction: 'Rhinite saisonnière' }],
    antecedents: [{ id: 'ant1', type: 'medical', description: 'Hypothyroïdie', date: '2017' }],
    problemesActifs: [
      { id: 'p1', cimCode: 'E03.9', label: 'Hypothyroïdie', dateOnset: '2017-02-01', status: 'active' },
    ],
    traitements: [
      { id: 't1', name: 'Lévothyroxine', dosage: '75 µg', frequency: '1×/jour à jeun', since: '2017-03' },
    ],
    alertes: [{ id: 'al1', label: 'Hypothyroïdie' }],
    notes: [],
    attachments: [],
    dernieresConstantes: { date: '2024-04-28', weight: 67, height: 166, bp: '120/80', hr: 74, temp: 36.9, spo2: 98 },
  },
  'PT-010': {
    patientId: 'PT-010',
    allergies: [],
    antecedents: [
      { id: 'ant1', type: 'medical', description: 'Diabète de type 2', date: '2012' },
      { id: 'ant2', type: 'medical', description: 'Hypertension artérielle', date: '2014' },
    ],
    problemesActifs: [
      { id: 'p1', cimCode: 'E11', label: 'Diabète de type 2', dateOnset: '2012-06-01', status: 'active' },
      { id: 'p2', cimCode: 'I10', label: 'Hypertension artérielle', dateOnset: '2014-01-01', status: 'active' },
    ],
    traitements: [
      { id: 't1', name: 'Metformine', dosage: '1000 mg', frequency: '2×/jour', since: '2012-07' },
      { id: 't2', name: 'Ramipril', dosage: '5 mg', frequency: '1×/jour', since: '2014-02' },
    ],
    alertes: [
      { id: 'al1', label: 'Diabète type 2' },
      { id: 'al2', label: 'Hypertension' },
    ],
    notes: [
      { id: 'n1', text: 'HbA1c à 7,2%. Renforcer l\'activité physique. Contrôle podologique conseillé.', author: 'Dr. Youssef', createdAt: '2024-06-05T11:00:00.000Z' },
    ],
    attachments: [],
    dernieresConstantes: { date: '2024-06-05', weight: 92, height: 174, bp: '145/90', hr: 78, temp: 37.0, spo2: 96 },
  },
  'PT-011': {
    patientId: 'PT-011',
    allergies: [],
    antecedents: [],
    problemesActifs: [{ id: 'p1', cimCode: 'M54.5', label: 'Lombalgie', dateOnset: '2023-11-01', status: 'active' }],
    traitements: [{ id: 't1', name: 'Ibuprofène', dosage: '400 mg', frequency: 'Si douleur', since: '2023-11' }],
    alertes: [{ id: 'al1', label: 'Lombalgie chronique' }],
    notes: [],
    attachments: [],
    dernieresConstantes: { date: '2024-07-10', weight: 79, height: 182, bp: '126/82', hr: 71, temp: 36.8, spo2: 98 },
  },
  'PT-013': {
    patientId: 'PT-013',
    allergies: [{ id: 'a1', substance: 'Pénicilline', severity: 'moderate', reaction: 'Urticaire' }],
    antecedents: [
      { id: 'ant1', type: 'medical', description: 'BPCO', date: '2016' },
      { id: 'ant2', type: 'surgical', description: 'Pontage coronarien', date: '2019' },
    ],
    problemesActifs: [
      { id: 'p1', cimCode: 'J44', label: 'BPCO', dateOnset: '2016-05-01', status: 'active' },
      { id: 'p2', cimCode: 'I25', label: 'Cardiopathie ischémique', dateOnset: '2019-08-01', status: 'active' },
    ],
    traitements: [
      { id: 't1', name: 'Tiotropium', dosage: '18 µg', frequency: '1×/jour', since: '2016-06' },
      { id: 't2', name: 'Aspirine', dosage: '100 mg', frequency: '1×/jour', since: '2019-09' },
      { id: 't3', name: 'Bisoprolol', dosage: '5 mg', frequency: '1×/jour', since: '2019-09' },
    ],
    alertes: [
      { id: 'al1', label: 'Allergie Pénicilline' },
      { id: 'al2', label: 'BPCO' },
      { id: 'al3', label: 'Cardiopathie' },
    ],
    notes: [
      { id: 'n1', text: 'Dyspnée d\'effort stable. Vaccination antigrippale à jour.', author: 'Dr. Youssef', createdAt: '2024-06-22T08:30:00.000Z' },
    ],
    attachments: [],
    dernieresConstantes: { date: '2024-06-22', weight: 70, height: 172, bp: '138/86', hr: 82, temp: 36.9, spo2: 93 },
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
    const saved = localStorage.getItem('shifa_charts_v2');
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
    localStorage.setItem('shifa_charts_v2', JSON.stringify(charts));
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
