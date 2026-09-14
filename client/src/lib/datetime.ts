import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Single date/time formatting utility for the whole app.
 * Locale is fr-FR; all clock times are rendered for display with
 * tabular-nums applied at the component level (`.tabular` / [font-variant-numeric]).
 *
 * Times in the data model are wall-clock "HH:MM" strings for the clinic's local
 * day — we treat them as local time and do not shift across timezones.
 */

export const LOCALE = 'fr-FR';

/** "Mercredi 23 juillet" */
export function longDate(d: Date): string {
  return format(d, 'EEEE d MMMM', { locale: fr });
}

/** "23 juillet 2026" */
export function fullDate(d: Date): string {
  return format(d, 'd MMMM yyyy', { locale: fr });
}

/** "mer. 23 juil." */
export function shortDate(d: Date): string {
  return format(d, 'EEE d MMM', { locale: fr });
}

/** Minutes since midnight for an "HH:MM" string. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes-since-midnight number → "HH:MM". */
export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Current wall-clock minutes since midnight (local). */
export function nowMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** ISO yyyy-MM-dd for a date (local calendar day). */
export function ymd(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

/**
 * Human, minute-resolution relative time, French.
 * negative/zero → "maintenant". e.g. 12 → "dans 12 min", 75 → "dans 1 h 15".
 */
export function relativeFromNow(deltaMin: number): string {
  if (deltaMin <= 0) return 'maintenant';
  if (deltaMin < 60) return `dans ${deltaMin} min`;
  const h = Math.floor(deltaMin / 60);
  const m = deltaMin % 60;
  return m === 0 ? `dans ${h} h` : `dans ${h} h ${m.toString().padStart(2, '0')}`;
}

/** Signed minutes → "+18 min" / "−5 min" (for late/early deltas). */
export function signedMinutes(delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}${Math.abs(delta)} min`;
}
