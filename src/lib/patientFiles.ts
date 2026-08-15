import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Patient } from '../context/PatientContext';
import type { Appointment } from '../context/AppointmentContext';
import type { Consultation } from '../context/ConsultationContext';
import { ymd } from './datetime';

/**
 * Derives the "medical file" view of a patient from the real app data
 * (patients + appointments + consultations). No data is invented here: every
 * field is either read straight off a record or computed from one, and any
 * value that cannot be derived is returned as `null` so the UI can omit it.
 */

export type FileTag = 'review' | 'new' | 'followup';

export interface PatientFile {
  patient: Patient;
  age: number | null;
  /** Most recent completed appointment date (ISO), else the stored lastVisit. */
  lastConsultation: string | null;
  /** Next non-cancelled appointment at or after today (ISO). */
  nextConsultation: string | null;
  /** Most recent signed consultation timestamp for this patient. */
  fileUpdatedAt: string | null;
  consultationCount: number;
  tags: FileTag[];
  /** Sort key: most recent meaningful contact, descending. */
  activityAt: number;
}

export const TAG_LABELS: Record<FileTag, string> = {
  review: 'À revoir',
  new: 'Nouveau',
  followup: 'Suivi',
};

/**
 * Tag chip styles — one brand family, not three competing hues. The tags
 * differ by weight (solid → tinted → outline) rather than by colour, so a
 * card with several of them still reads as a single system.
 */
export const TAG_STYLES: Record<FileTag, string> = {
  // Needs attention: the most present of the three.
  review: 'bg-primary text-white border-primary',
  // Newly created file: brand tint.
  new: 'bg-primary/[0.08] text-primary border-primary/15',
  // Ongoing follow-up: quietest, outline only.
  followup: 'bg-transparent text-primary/70 border-primary/20',
};

export function calcAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

/** "12 août 2026" — returns null for missing/"Never"/unparseable values. */
export function fileDate(iso: string | null | undefined): string | null {
  if (!iso || iso === 'Never') return null;
  try {
    return format(parseISO(iso), 'd MMMM yyyy', { locale: fr });
  } catch {
    return null;
  }
}

/** Day-resolution relative label: "Aujourd'hui" · "Hier" · "il y a 3 jours". */
export function relativeDay(iso: string | null | undefined): string | null {
  if (!iso || iso === 'Never') return null;
  try {
    const days = differenceInCalendarDays(new Date(), parseISO(iso));
    if (days < 0) return fileDate(iso);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `il y a ${days} jours`;
    if (days < 31) {
      const weeks = Math.floor(days / 7);
      return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    return fileDate(iso);
  } catch {
    return null;
  }
}

/** Initials for the avatar fallback — always 2 chars when a name exists. */
export function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—';
}

function timeOf(iso: string | null): number {
  if (!iso || iso === 'Never') return 0;
  const t = parseISO(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Builds the derived file for every patient passed in, sorted by most recent
 * medical activity so the archive opens on the files currently in play.
 */
export function buildPatientFiles(
  patients: Patient[],
  appointments: Appointment[],
  consultations: Consultation[],
): PatientFile[] {
  const today = ymd();

  // Index once instead of scanning the full lists for each patient.
  const aptsByPatient = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    const list = aptsByPatient.get(apt.patientId);
    if (list) list.push(apt);
    else aptsByPatient.set(apt.patientId, [apt]);
  }

  const consByPatient = new Map<string, Consultation[]>();
  for (const c of consultations) {
    const list = consByPatient.get(c.patientId);
    if (list) list.push(c);
    else consByPatient.set(c.patientId, [c]);
  }

  return patients
    .map<PatientFile>(patient => {
      const apts = aptsByPatient.get(patient.id) ?? [];
      const cons = consByPatient.get(patient.id) ?? [];

      const lastCompleted = apts
        .filter(a => a.status === 'Completed' && a.date <= today)
        .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))[0];

      // Prefer a real completed visit; fall back to the stored lastVisit field.
      const lastConsultation =
        lastCompleted?.date ??
        (patient.lastVisit && patient.lastVisit !== 'Never' ? patient.lastVisit : null);

      const nextAppointment = apts
        .filter(a => a.status !== 'Cancelled' && a.status !== 'Completed' && a.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0];

      const lastConsRecord = [...cons].sort((a, b) => b.date.localeCompare(a.date))[0];
      const fileUpdatedAt = lastConsRecord?.signedAt ?? lastConsRecord?.date ?? null;

      const tags: FileTag[] = [];
      if (patient.status === 'New') tags.push('new');

      // "À revoir": an active file with no visit in 90+ days, or a consultation
      // still sitting as an unsigned draft.
      const staleDays = lastConsultation
        ? differenceInCalendarDays(new Date(), parseISO(lastConsultation))
        : null;
      const hasDraft = cons.some(c => c.status === 'draft');
      if (hasDraft || (patient.status === 'Active' && staleDays !== null && staleDays > 90)) {
        tags.push('review');
      }
      if (patient.status === 'Active' && cons.length > 1) tags.push('followup');

      return {
        patient,
        age: calcAge(patient.dob),
        lastConsultation,
        nextConsultation: nextAppointment?.date ?? null,
        fileUpdatedAt,
        consultationCount: cons.length,
        tags,
        activityAt: Math.max(
          timeOf(lastConsultation),
          timeOf(fileUpdatedAt),
          timeOf(nextAppointment?.date ?? null),
          timeOf(patient.createdAt),
        ),
      };
    })
    .sort((a, b) => b.activityAt - a.activityAt);
}

export type SortKey = 'recent' | 'name' | 'lastConsultation';

export const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Activité récente',
  name: 'Nom (A → Z)',
  lastConsultation: 'Dernière consultation',
};

export function sortFiles(files: PatientFile[], key: SortKey): PatientFile[] {
  const out = [...files];
  if (key === 'name') {
    out.sort((a, b) =>
      `${a.patient.lastName} ${a.patient.firstName}`.localeCompare(
        `${b.patient.lastName} ${b.patient.firstName}`,
        'fr',
      ),
    );
  } else if (key === 'lastConsultation') {
    out.sort((a, b) => timeOf(b.lastConsultation) - timeOf(a.lastConsultation));
  }
  return out;
}

export function matchesQuery(file: PatientFile, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const { patient } = file;
  return `${patient.firstName} ${patient.lastName} ${patient.id} ${patient.phone} ${patient.email}`
    .toLowerCase()
    .includes(q);
}
