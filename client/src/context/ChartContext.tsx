import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { chartsApi } from '../lib/api';
import { useAuth } from './AuthContext';

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
  /** Last read/write failure, if any. */
  error: string | null;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

/** Ensures every collection field exists, guarding against partial payloads. */
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

function emptyChart(patientId: string): PatientChart {
  return {
    patientId,
    allergies: [],
    antecedents: [],
    problemesActifs: [],
    traitements: [],
    alertes: [],
    notes: [],
    attachments: [],
  };
}

/**
 * Charts are cached per patient and fetched on demand.
 *
 * `getChart` stays synchronous because components call it during render. It
 * returns whatever is cached (an empty chart on first call) and triggers a
 * background fetch; the component re-renders with real data once it lands.
 * Mutations apply locally first, then persist — so the UI never waits on the
 * network for a checkbox.
 */
export function ChartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [charts, setCharts] = useState<Record<string, PatientChart>>({});
  const [error, setError] = useState<string | null>(null);

  // Patient ids already fetched or in flight, so render loops don't re-request.
  const requested = useRef<Set<string>>(new Set());

  // Drop every cached chart on sign-out so the next user starts clean.
  useEffect(() => {
    if (!isAuthenticated) {
      setCharts({});
      requested.current.clear();
    }
  }, [isAuthenticated]);

  const fetchChart = useCallback((patientId: string) => {
    if (!isAuthenticated || requested.current.has(patientId)) return;
    requested.current.add(patientId);

    chartsApi.get(patientId)
      .then(({ chart }) => {
        setCharts(prev => ({ ...prev, [patientId]: normalizeChart(chart) }));
      })
      .catch(err => {
        // Allow a later retry for this patient.
        requested.current.delete(patientId);
        setError(err instanceof Error ? err.message : 'Chargement du dossier impossible');
      });
  }, [isAuthenticated]);

  const getChart = useCallback((patientId: string): PatientChart => {
    const cached = charts[patientId];
    if (cached) return cached;

    // Kick off the load outside render to avoid a setState-during-render warning.
    queueMicrotask(() => fetchChart(patientId));
    return emptyChart(patientId);
  }, [charts, fetchChart]);

  /** Applies a local patch immediately and returns the resulting chart. */
  const applyLocal = useCallback((
    patientId: string,
    mutate: (chart: PatientChart) => PatientChart,
  ): PatientChart => {
    const next = mutate(charts[patientId] ?? emptyChart(patientId));
    setCharts(prev => ({ ...prev, [patientId]: next }));
    return next;
  }, [charts]);

  const reportError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err.message : 'Enregistrement impossible');
  }, []);

  const updateChart = useCallback((patientId: string, fields: Partial<PatientChart>) => {
    const next = applyLocal(patientId, chart => ({ ...chart, ...fields }));
    // Only the server-writable collections are sent; notes and attachments
    // have their own endpoints because they append rather than replace.
    chartsApi.update(patientId, {
      allergies: next.allergies,
      antecedents: next.antecedents,
      problemesActifs: next.problemesActifs,
      traitements: next.traitements,
      alertes: next.alertes,
      ...(next.dernieresConstantes ? { dernieresConstantes: next.dernieresConstantes } : {}),
    }).catch(reportError);
  }, [applyLocal, reportError]);

  const updateVitals = useCallback((patientId: string, vitals: Vitals) => {
    applyLocal(patientId, chart => ({ ...chart, dernieresConstantes: vitals }));
    chartsApi.updateVitals(patientId, vitals).catch(reportError);
  }, [applyLocal, reportError]);

  // ── Active conditions ──
  const addProbleme = useCallback((patientId: string, label: string, cimCode?: string) => {
    const probleme: ActiveProblem = {
      id: uid(),
      label,
      cimCode: cimCode || undefined,
      dateOnset: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    updateChart(patientId, {
      problemesActifs: [...getChart(patientId).problemesActifs, probleme],
    });
  }, [getChart, updateChart]);

  const removeProbleme = useCallback((patientId: string, id: string) => {
    updateChart(patientId, {
      problemesActifs: getChart(patientId).problemesActifs.filter(p => p.id !== id),
    });
  }, [getChart, updateChart]);

  // ── Medications ──
  const addTraitement = useCallback((patientId: string, t: Omit<ChronicTreatment, 'id'>) => {
    updateChart(patientId, {
      traitements: [...getChart(patientId).traitements, { ...t, id: uid() }],
    });
  }, [getChart, updateChart]);

  const removeTraitement = useCallback((patientId: string, id: string) => {
    updateChart(patientId, {
      traitements: getChart(patientId).traitements.filter(t => t.id !== id),
    });
  }, [getChart, updateChart]);

  // ── Medical alerts ──
  const addAlerte = useCallback((patientId: string, label: string) => {
    updateChart(patientId, {
      alertes: [...getChart(patientId).alertes, { id: uid(), label }],
    });
  }, [getChart, updateChart]);

  const removeAlerte = useCallback((patientId: string, id: string) => {
    updateChart(patientId, {
      alertes: getChart(patientId).alertes.filter(a => a.id !== id),
    });
  }, [getChart, updateChart]);

  // ── Notes (append-only endpoint) ──
  const addNote = useCallback((patientId: string, text: string, author: string) => {
    const optimisticId = uid();
    applyLocal(patientId, chart => ({
      ...chart,
      notes: [{ id: optimisticId, text, author, createdAt: new Date().toISOString() }, ...chart.notes],
    }));

    chartsApi.addNote(patientId, text, author)
      // Swap the temporary id for the server's, so a later delete targets the
      // real row rather than a client-only placeholder.
      .then(({ note }) => setCharts(prev => {
        const chart = prev[patientId];
        if (!chart) return prev;
        return {
          ...prev,
          [patientId]: {
            ...chart,
            notes: chart.notes.map(n => (n.id === optimisticId ? note : n)),
          },
        };
      }))
      .catch(err => {
        applyLocal(patientId, chart => ({
          ...chart,
          notes: chart.notes.filter(n => n.id !== optimisticId),
        }));
        reportError(err);
      });
  }, [applyLocal, reportError]);

  const removeNote = useCallback((patientId: string, id: string) => {
    applyLocal(patientId, chart => ({
      ...chart,
      notes: chart.notes.filter(n => n.id !== id),
    }));
    chartsApi.removeNote(patientId, id).catch(reportError);
  }, [applyLocal, reportError]);

  // ── Attachments (append-only endpoint) ──
  const addAttachment = useCallback((patientId: string, a: Omit<Attachment, 'id' | 'addedAt'>) => {
    const optimisticId = uid();
    applyLocal(patientId, chart => ({
      ...chart,
      attachments: [
        { ...a, id: optimisticId, addedAt: new Date().toISOString() },
        ...chart.attachments,
      ],
    }));

    chartsApi.addAttachment(patientId, a)
      .then(({ attachment }) => setCharts(prev => {
        const chart = prev[patientId];
        if (!chart) return prev;
        return {
          ...prev,
          [patientId]: {
            ...chart,
            // Keep the local dataUrl: the server omits blobs in its response.
            attachments: chart.attachments.map(at =>
              at.id === optimisticId ? { ...attachment, dataUrl: a.dataUrl } : at),
          },
        };
      }))
      .catch(err => {
        applyLocal(patientId, chart => ({
          ...chart,
          attachments: chart.attachments.filter(at => at.id !== optimisticId),
        }));
        reportError(err);
      });
  }, [applyLocal, reportError]);

  const removeAttachment = useCallback((patientId: string, id: string) => {
    applyLocal(patientId, chart => ({
      ...chart,
      attachments: chart.attachments.filter(at => at.id !== id),
    }));
    chartsApi.removeAttachment(patientId, id).catch(reportError);
  }, [applyLocal, reportError]);

  return (
    <ChartContext.Provider value={{
      getChart, updateChart, updateVitals,
      addProbleme, removeProbleme,
      addTraitement, removeTraitement,
      addAlerte, removeAlerte,
      addNote, removeNote,
      addAttachment, removeAttachment,
      error,
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
