import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Date helpers for the back office.
 *
 * Copied from the doctor app rather than imported: there, `relativeDay` lives
 * in `lib/patientFiles.ts` alongside chart-building logic the admin console has
 * no business pulling in.
 */

/** "12 mars 2026" */
export function fileDate(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

/** "12 mars 2026, 14:30" */
export function fileDateTime(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM yyyy, HH:mm', { locale: fr });
  } catch {
    return iso;
  }
}

/** "Aujourd'hui" / "Hier" / "il y a 3 jours" / an absolute date beyond a month. */
export function relativeDay(iso: string | null | undefined): string | null {
  if (!iso || iso === 'Never') return null;
  try {
    const days = differenceInCalendarDays(new Date(), parseISO(iso));
    if (days < 0) return fileDate(iso);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `il y a ${days} jours`;
    if (days < 31) return `il y a ${Math.floor(days / 7)} sem.`;
    return fileDate(iso);
  } catch {
    return null;
  }
}
