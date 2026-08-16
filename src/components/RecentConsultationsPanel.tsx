import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarDays, CheckCircle2, ChevronRight, Clock, FileText, PenLine, Pill, Search, X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Consultation } from '../context/ConsultationContext';
import type { Patient } from '../context/PatientContext';
import type { Appointment } from '../context/AppointmentContext';
import { initials, relativeDay } from '../lib/patientFiles';

interface Props {
  open: boolean;
  onClose: () => void;
  consultations: Consultation[];
  patients: Patient[];
  appointments: Appointment[];
  /** Opens the consultation record itself. */
  onOpen: (appointment: Appointment) => void;
}

type Filter = 'all' | 'signed' | 'draft';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Toutes',
  signed: 'Signées',
  draft: 'Brouillons',
};

function fullDate(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMMM yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

/**
 * Slide-over listing the doctor's consultations, most recent first.
 *
 * Each row is a record summary — who, when, the diagnoses recorded and how
 * many medications were prescribed — so the doctor can find the right visit
 * without opening several in turn.
 */
export default function RecentConsultationsPanel({
  open, onClose, consultations, patients, appointments, onOpen,
}: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const patientById = useMemo(
    () => new Map(patients.map(p => [p.id, p])),
    [patients],
  );
  const appointmentById = useMemo(
    () => new Map(appointments.map(a => [a.id, a])),
    [appointments],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return consultations
      .filter(c => filter === 'all' || c.status === filter)
      .filter(c => {
        if (!q) return true;
        const p = patientById.get(c.patientId);
        const name = p ? `${p.firstName} ${p.lastName}` : c.patientId;
        return `${name} ${c.diagnoses.join(' ')} ${c.soap.assessment}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(c => ({
        consultation: c,
        patient: patientById.get(c.patientId),
        appointment: c.appointmentId ? appointmentById.get(c.appointmentId) : undefined,
      }));
  }, [consultations, filter, query, patientById, appointmentById]);

  const counts = useMemo(() => ({
    all: consultations.length,
    signed: consultations.filter(c => c.status === 'signed').length,
    draft: consultations.filter(c => c.status === 'draft').length,
  }), [consultations]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            role="dialog"
            aria-modal="true"
            aria-label="Consultations récentes"
            className="relative w-full max-w-[560px] h-full bg-bg-soft/40 backdrop-blur-xl border-l border-border-subtle flex flex-col"
          >
            {/* Head */}
            <div className="bg-white px-6 py-5 border-b border-border-subtle shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-primary/5 grid place-items-center shrink-0">
                    <Clock size={18} className="text-primary" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h2 className="text-[19px] font-semibold text-text-primary tracking-tight">
                      Consultations récentes
                    </h2>
                    <p className="text-[13px] text-text-muted font-normal mt-0.5">
                      Retrouvez et révisez vos dernières consultations
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="p-1.5 rounded-full text-text-muted hover:bg-bg-soft hover:text-primary transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="relative mt-4">
                <Search
                  size={16}
                  strokeWidth={1.75}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher un patient ou un diagnostic..."
                  className="w-full h-11 pl-11 pr-4 rounded-[14px] bg-bg-soft/60 border border-border-subtle text-[14px] font-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 mt-3">
                {(Object.keys(FILTER_LABELS) as Filter[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-medium transition-all ${
                      filter === key
                        ? 'bg-primary text-white'
                        : 'bg-bg-soft/70 text-text-secondary hover:text-primary'
                    }`}
                  >
                    {FILTER_LABELS[key]}
                    <span className={`tabular ${filter === key ? 'text-white/70' : 'text-text-muted'}`}>
                      {counts[key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center text-center py-16">
                  <span className="w-12 h-12 rounded-2xl bg-white border border-border-subtle grid place-items-center">
                    <FileText size={20} className="text-text-muted" strokeWidth={1.5} />
                  </span>
                  <h3 className="text-[15px] font-semibold text-text-primary tracking-tight mt-4">
                    {consultations.length === 0
                      ? 'Aucune consultation enregistrée'
                      : 'Aucun résultat'}
                  </h3>
                  <p className="text-[13px] text-text-muted font-normal mt-1.5 max-w-[34ch] leading-relaxed">
                    {consultations.length === 0
                      ? 'Vos consultations apparaîtront ici une fois la première terminée.'
                      : 'Essayez un autre nom, diagnostic ou statut.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {rows.map(({ consultation: c, patient, appointment }) => {
                    const name = patient
                      ? `${patient.firstName} ${patient.lastName}`
                      : c.patientId;
                    const signed = c.status === 'signed';
                    const medCount = c.ordonnance.items.length;
                    const when = relativeDay(c.date);

                    return (
                      <button
                        key={c.id}
                        onClick={() => appointment && onOpen(appointment)}
                        disabled={!appointment}
                        title={appointment ? undefined : 'Rendez-vous associé introuvable'}
                        className="group w-full text-left bg-white rounded-[18px] border border-border-subtle p-4 transition-all duration-300 hover:border-accent hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:border-border-subtle"
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Monogram */}
                          <span className="w-11 h-11 rounded-xl bg-primary/[0.06] border border-border-subtle grid place-items-center shrink-0 text-[13px] font-semibold text-primary/75 transition-colors duration-300 group-hover:border-accent">
                            {patient ? initials(patient.firstName, patient.lastName) : '—'}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[15px] font-semibold text-text-primary tracking-tight truncate transition-colors duration-200 group-hover:text-primary">
                                {name}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${
                                  signed
                                    ? 'bg-primary/[0.08] text-primary border-primary/15'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}
                              >
                                {signed
                                  ? <><CheckCircle2 size={10} strokeWidth={2.5} /> Signée</>
                                  : <><PenLine size={10} strokeWidth={2.5} /> Brouillon</>}
                              </span>
                            </div>

                            <p className="text-[12px] text-text-muted font-normal mt-0.5 tabular flex items-center gap-1.5">
                              <CalendarDays size={12} strokeWidth={1.75} className="shrink-0" />
                              {fullDate(c.date)}
                              {when && <span className="text-text-muted/60">· {when}</span>}
                            </p>

                            {/* Diagnoses recorded on the visit */}
                            {c.diagnoses.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {c.diagnoses.slice(0, 3).map(d => (
                                  <span
                                    key={d}
                                    className="px-2 py-0.5 rounded-md bg-bg-soft border border-border-subtle text-[11px] font-medium text-text-secondary"
                                  >
                                    {d}
                                  </span>
                                ))}
                                {c.diagnoses.length > 3 && (
                                  <span className="text-[11px] font-medium text-text-muted self-center">
                                    +{c.diagnoses.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Fall back to the assessment when no coded diagnosis exists */}
                            {c.diagnoses.length === 0 && c.soap.assessment.trim() && (
                              <p className="text-[12px] text-text-secondary font-normal mt-1.5 line-clamp-2">
                                {c.soap.assessment}
                              </p>
                            )}

                            {medCount > 0 && (
                              <p className="text-[11.5px] text-text-muted font-normal mt-2 inline-flex items-center gap-1.5">
                                <Pill size={12} strokeWidth={1.75} />
                                {medCount} médicament{medCount > 1 ? 's' : ''} prescrit{medCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>

                          <ChevronRight
                            size={16}
                            strokeWidth={2}
                            className="text-text-muted shrink-0 mt-1 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
