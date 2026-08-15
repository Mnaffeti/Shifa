import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { Vitals } from './ChartContext';
import { consultationsApi } from '../lib/api';
import { useAuth } from './AuthContext';

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
  signConsultation: (id: string, doctor: string) => Promise<void>;
  unlockConsultation: (id: string) => Promise<void>;
  addAddendum: (id: string, text: string, doctor: string) => Promise<void>;
  getPatientConsultations: (patientId: string) => Consultation[];
  findByAppointment: (appointmentId: string) => Consultation | undefined;
  isLoading: boolean;
  error: string | null;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

/** How long to wait after the last keystroke before persisting a draft. */
const AUTOSAVE_MS = 800;

export function ConsultationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pending autosave timers, keyed by consultation id.
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Draft ids currently being created, so a double render can't create twice.
  const creating = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setConsultations([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    consultationsApi.list()
      .then(({ consultations }) => {
        if (cancelled) return;
        setConsultations(consultations);
        setError(null);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chargement impossible');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Flush any pending autosaves when the provider unmounts.
  const timers = saveTimers.current;
  useEffect(() => () => { timers.forEach(clearTimeout); timers.clear(); }, [timers]);

  /**
   * Persists the editable parts of a consultation after a quiet period.
   * SOAP fields are typed character by character, so writing on every change
   * would flood the API; this coalesces a burst of edits into one request.
   */
  const scheduleSave = useCallback((id: string) => {
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    saveTimers.current.set(id, setTimeout(() => {
      saveTimers.current.delete(id);

      setConsultations(current => {
        const c = current.find(x => x.id === id);
        // Signed consultations are immutable server-side; don't attempt a write.
        if (!c || c.status === 'signed') return current;

        consultationsApi.update(id, {
          soap: c.soap,
          diagnoses: c.diagnoses,
          ...(c.constantes ? { constantes: c.constantes } : {}),
          ordonnance: c.ordonnance,
        }).catch(err => {
          setError(err instanceof Error ? err.message : 'Enregistrement impossible');
        });

        return current;
      });
    }, AUTOSAVE_MS));
  }, []);

  const findByAppointment = useCallback(
    (appointmentId: string) => consultations.find(c => c.appointmentId === appointmentId),
    [consultations],
  );

  /**
   * Fire-and-forget by design: callers invoke this during render/effect and
   * read the result from `consultations` on the next pass, exactly as the
   * localStorage implementation behaved.
   */
  const getOrCreateDraft = useCallback((
    appointmentId: string, patientId: string, doctor: string, date: string,
  ) => {
    if (creating.current.has(appointmentId)) return;

    setConsultations(current => {
      if (current.some(c => c.appointmentId === appointmentId)) return current;

      creating.current.add(appointmentId);
      consultationsApi.getOrCreate({ patientId, appointmentId, date, doctor })
        .then(({ consultation }) => {
          setConsultations(prev =>
            prev.some(c => c.id === consultation.id) ? prev : [...prev, consultation],
          );
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Création de la consultation impossible');
        })
        .finally(() => { creating.current.delete(appointmentId); });

      return current;
    });
  }, []);

  // ── Local-first editors: update state now, persist shortly after ──────────

  const updateConsultation = useCallback((id: string, fields: Partial<Consultation>) => {
    setConsultations(prev => prev.map(c => (c.id === id ? { ...c, ...fields } : c)));
    scheduleSave(id);
  }, [scheduleSave]);

  const updateSoap = useCallback((id: string, key: keyof Consultation['soap'], value: string) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, soap: { ...c.soap, [key]: value } } : c)));
    scheduleSave(id);
  }, [scheduleSave]);

  const updateDiagnoses = useCallback((id: string, diagnoses: string[]) => {
    setConsultations(prev => prev.map(c => (c.id === id ? { ...c, diagnoses } : c)));
    scheduleSave(id);
  }, [scheduleSave]);

  const updateOrdonnance = useCallback((id: string, items: OrdonnanceItem[]) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, ordonnance: { ...c.ordonnance, items } } : c)));
    scheduleSave(id);
  }, [scheduleSave]);

  const updateConstantes = useCallback((id: string, constantes: Vitals) => {
    setConsultations(prev => prev.map(c => (c.id === id ? { ...c, constantes } : c)));
    scheduleSave(id);
  }, [scheduleSave]);

  // ── Lifecycle actions: awaited, since they change legal status ────────────

  const signConsultation = useCallback(async (id: string, doctor: string) => {
    // Flush any queued edits first, or they'd be rejected once signed.
    const pending = saveTimers.current.get(id);
    if (pending) {
      clearTimeout(pending);
      saveTimers.current.delete(id);
      const c = consultations.find(x => x.id === id);
      if (c) {
        await consultationsApi.update(id, {
          soap: c.soap,
          diagnoses: c.diagnoses,
          ...(c.constantes ? { constantes: c.constantes } : {}),
          ordonnance: c.ordonnance,
        });
      }
    }

    const { consultation } = await consultationsApi.sign(id, doctor);
    setConsultations(prev => prev.map(c => (c.id === id ? consultation : c)));
  }, [consultations]);

  const unlockConsultation = useCallback(async (id: string) => {
    const { consultation } = await consultationsApi.unlock(id);
    setConsultations(prev => prev.map(c => (c.id === id ? consultation : c)));
  }, []);

  const addAddendum = useCallback(async (id: string, text: string, doctor: string) => {
    const { consultation } = await consultationsApi.addAddendum(id, text, doctor);
    setConsultations(prev => prev.map(c => (c.id === id ? consultation : c)));
  }, []);

  const getPatientConsultations = useCallback((patientId: string) =>
    consultations
      .filter(c => c.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date)),
  [consultations]);

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
      isLoading,
      error,
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
