import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, BadgeCheck, Ban, CalendarClock, CheckCircle2, ChevronDown,
  FileClock, Inbox, Pencil, Plus, RefreshCw, RotateCcw, ShieldCheck, Trash2,
  UserCheck, XCircle,
  type LucideIcon,
} from 'lucide-react';
import { adminApi, type AuditAction, type AuditEntry } from '../lib/api';
import { fileDateTime, relativeDay } from '../lib/dates';

/**
 * How each action reads in the log: a verb, an icon and a tint.
 *
 * Colour carries severity, as elsewhere in the app — rose for anything that
 * removes access, emerald for anything that grants it, neutral for edits.
 */
const ACTION_META: Record<AuditAction, { label: string; icon: LucideIcon; tint: string }> = {
  ADMIN_CREATED:         { label: 'Administrateur ajouté',   icon: ShieldCheck, tint: 'bg-indigo-50 text-indigo-600' },
  ADMIN_DELETED:         { label: 'Administrateur supprimé', icon: Trash2,      tint: 'bg-rose-50 text-rose-600' },
  TRIAL_EXTENDED:        { label: 'Essai prolongé',           icon: CalendarClock, tint: 'bg-amber-50 text-amber-600' },
  TRIAL_CONVERTED:       { label: 'Accès illimité accordé',   icon: BadgeCheck,  tint: 'bg-emerald-50 text-emerald-600' },
  DOCTOR_CREATED:        { label: 'Compte créé',              icon: Plus,        tint: 'bg-emerald-50 text-emerald-600' },
  DOCTOR_UPDATED:        { label: 'Informations modifiées',   icon: Pencil,      tint: 'bg-sky-50 text-sky-600' },
  DOCTOR_ACTIVATED:      { label: 'Accès réactivé',           icon: CheckCircle2, tint: 'bg-emerald-50 text-emerald-600' },
  DOCTOR_DEACTIVATED:    { label: 'Accès désactivé',          icon: Ban,         tint: 'bg-rose-50 text-rose-600' },
  DOCTOR_DELETED:        { label: 'Compte supprimé',          icon: Trash2,      tint: 'bg-rose-50 text-rose-600' },
  DOCTOR_PASSWORD_RESET: { label: 'Mot de passe réinitialisé', icon: RotateCcw,  tint: 'bg-amber-50 text-amber-600' },
  REQUEST_ACCEPTED:      { label: 'Demande acceptée',         icon: UserCheck,   tint: 'bg-emerald-50 text-emerald-600' },
  REQUEST_REJECTED:      { label: 'Demande refusée',          icon: XCircle,     tint: 'bg-rose-50 text-rose-600' },
};

const FILTERS: { id: AuditAction | 'all'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'DOCTOR_CREATED', label: 'Créations' },
  { id: 'DOCTOR_UPDATED', label: 'Modifications' },
  { id: 'DOCTOR_DEACTIVATED', label: 'Désactivations' },
  { id: 'DOCTOR_PASSWORD_RESET', label: 'Mots de passe' },
];

/**
 * The back-office action trail.
 *
 * Read-only: entries are written by the server when an action succeeds and are
 * never edited or deleted, here or anywhere else.
 */
export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuditAction | 'all'>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { entries, nextCursor } = await adminApi.audit.list(
        filter === 'all' ? undefined : { action: filter },
      );
      setEntries(entries);
      setCursor(nextCursor);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const loadMore = async () => {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { entries: more, nextCursor } = await adminApi.audit.list({
        ...(filter === 'all' ? {} : { action: filter }),
        cursor,
      });
      setEntries(prev => [...prev, ...more]);
      setCursor(nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Group by calendar day so a long trail stays scannable.
  const grouped = useMemo(() => {
    const out: { day: string; label: string; items: AuditEntry[] }[] = [];
    for (const e of entries) {
      const day = e.createdAt.slice(0, 10);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(e);
      else out.push({ day, label: relativeDay(e.createdAt) ?? day, items: [e] });
    }
    return out;
  }, [entries]);

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Journal
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Toutes les actions effectuées sur les comptes, par qui et quand
          </p>
        </div>

        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-[14px] border border-border-subtle bg-white text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} strokeWidth={1.75} className={isLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </header>

      <div className="flex items-center gap-1.5 mt-7 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`h-11 px-4 rounded-[14px] text-[13px] font-medium whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-accent text-primary'
                : 'bg-white border border-border-subtle text-text-secondary hover:border-accent hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="flex items-start gap-2.5 mt-5 px-4 py-3 rounded-[14px] bg-bg-soft border border-border-subtle text-[12.5px] text-text-muted font-normal leading-relaxed">
        <ShieldCheck size={15} className="text-text-muted shrink-0 mt-0.5" strokeWidth={1.75} />
        Ce journal est en lecture seule : les entrées sont enregistrées automatiquement
        et ne peuvent être ni modifiées ni supprimées. Les mots de passe n'y figurent jamais.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-3 p-4 rounded-[16px] bg-rose-50 border border-rose-100">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-[13.5px] font-medium text-rose-700">{error}</p>
        </div>
      )}

      {isLoading && entries.length === 0 && (
        <div className="py-16 text-center">
          <span className="inline-block w-7 h-7 rounded-full border-2 border-border-subtle border-t-primary animate-spin" />
          <p className="text-[13px] font-medium text-text-muted mt-3">Chargement…</p>
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="mt-5 py-16 text-center bg-white rounded-[20px] border border-border-subtle">
          <span className="w-12 h-12 rounded-full bg-bg-soft grid place-items-center mx-auto">
            <Inbox size={21} className="text-text-muted" strokeWidth={1.5} />
          </span>
          <p className="text-[15px] font-medium text-text-primary mt-4">
            {filter === 'all' ? 'Aucune action enregistrée' : 'Aucune action de ce type'}
          </p>
          <p className="text-[13px] text-text-muted font-normal mt-1">
            Les actions sur les comptes apparaîtront ici.
          </p>
        </div>
      )}

      {grouped.map(group => (
        <section key={group.day} className="mt-7">
          <div className="flex items-center gap-3">
            <FileClock size={14} className="text-text-muted" strokeWidth={1.75} />
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.14em]">
              {group.label}
            </h2>
            <span className="tabular text-[11px] font-medium text-text-muted">
              {group.items.length}
            </span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <div className="flex flex-col gap-2.5 mt-3.5">
            {group.items.map((e, i) => {
              const meta = ACTION_META[e.action];
              const Icon = meta?.icon ?? Pencil;

              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.2) }}
                  className="hover-row bg-white rounded-[18px] border border-border-subtle p-5 flex items-start gap-4"
                >
                  <span className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${
                    meta?.tint ?? 'bg-bg-soft text-text-muted'
                  }`}>
                    <Icon size={17} strokeWidth={1.75} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold text-text-primary">
                      {meta?.label ?? e.action}
                      <span className="font-normal text-text-muted"> — </span>
                      <span className="font-medium text-text-secondary">{e.targetLabel}</span>
                    </p>
                    {e.details && (
                      <p className="text-[12.5px] text-text-muted font-normal mt-1 leading-relaxed break-words">
                        {e.details}
                      </p>
                    )}
                    <p className="text-[11.5px] text-text-muted font-normal mt-1.5">
                      par <span className="font-medium text-text-secondary">{e.actorName}</span>
                    </p>
                  </div>

                  <p className="tabular text-[12px] text-text-muted font-normal shrink-0 text-right">
                    {fileDateTime(e.createdAt).split(', ')[1] ?? fileDateTime(e.createdAt)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={isLoadingMore}
          className="w-full mt-6 h-12 rounded-[14px] border border-border-subtle bg-white text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ChevronDown size={16} strokeWidth={1.75} />
          {isLoadingMore ? 'Chargement…' : 'Afficher les entrées plus anciennes'}
        </button>
      )}
    </div>
  );
}
