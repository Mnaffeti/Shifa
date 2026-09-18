import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, Ban, CalendarDays, Clock, IdCard, LogIn, Moon, RefreshCw,
  Search, Stethoscope, UserCheck,
} from 'lucide-react';
import { adminApi, type DoctorAccount } from '../lib/api';
import { relativeDay, fileDateTime } from '../lib/dates';

/** Accounts that have not signed in for this long are surfaced as dormant. */
const DORMANT_DAYS = 30;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86_400_000);
}

/**
 * Sign-in activity, read from the doctor accounts themselves.
 *
 * This used to read DemoLead — a registration log written outside the account
 * transaction, which could silently drift: a doctor could sign in every day
 * and still never appear here. lastLoginAt and loginCount live on Account, so
 * the figures cannot diverge from the accounts they describe.
 */
export default function ActivityPage() {
  const [doctors, setDoctors] = useState<DoctorAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const { doctors } = await adminApi.doctors.list();
      setDoctors(doctors);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // Most recently seen first; accounts that never signed in sink to the bottom.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors
      .filter(d => !q || `${d.name} ${d.matricule ?? ''} ${d.specialty ?? ''} ${d.phone ?? ''}`
        .toLowerCase().includes(q))
      .sort((a, b) => {
        if (!a.lastLoginAt && !b.lastLoginAt) return a.name.localeCompare(b.name);
        if (!a.lastLoginAt) return 1;
        if (!b.lastLoginAt) return -1;
        return b.lastLoginAt.localeCompare(a.lastLoginAt);
      });
  }, [doctors, query]);

  const totalLogins = useMemo(
    () => doctors.reduce((n, d) => n + d.loginCount, 0), [doctors]);
  const neverSignedIn = doctors.filter(d => !d.lastLoginAt).length;
  const dormant = doctors.filter(d => {
    const n = daysSince(d.lastLoginAt);
    return n !== null && n >= DORMANT_DAYS;
  }).length;

  const stats = [
    { label: 'Comptes médecins', value: doctors.length, icon: Stethoscope, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Connexions totales', value: totalLogins, icon: LogIn, tint: 'bg-teal-50 text-teal-600' },
    { label: 'Jamais connectés', value: neverSignedIn, icon: Clock, tint: 'bg-amber-50 text-amber-600' },
    { label: `Inactifs > ${DORMANT_DAYS} j`, value: dormant, icon: Moon, tint: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Activité
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Qui se connecte, à quelle fréquence, et qui ne vient plus
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
        {stats.map(s => (
          <div key={s.label} className="hover-card bg-white rounded-[20px] border border-border-subtle p-5 flex items-center gap-4">
            <span className={`w-11 h-11 rounded-full grid place-items-center shrink-0 ${s.tint}`}>
              <s.icon size={19} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="tabular text-[26px] font-semibold text-text-primary leading-none">{s.value}</p>
              <p className="text-[12.5px] text-text-muted font-normal mt-1.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-7">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={17} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher par nom, matricule, spécialité…"
          className="w-full h-12 pl-11 pr-4 rounded-[14px] border border-border-subtle bg-white text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
        />
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 p-4 rounded-[16px] bg-rose-50 border border-rose-100">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-[13.5px] font-medium text-rose-700">{error}</p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {isLoading && doctors.length === 0 && (
          <div className="py-16 text-center">
            <span className="inline-block w-7 h-7 rounded-full border-2 border-border-subtle border-t-primary animate-spin" />
            <p className="text-[13px] font-medium text-text-muted mt-3">Chargement…</p>
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="py-16 text-center bg-white rounded-[20px] border border-border-subtle">
            <span className="w-12 h-12 rounded-full bg-bg-soft grid place-items-center mx-auto">
              <LogIn size={21} className="text-text-muted" strokeWidth={1.5} />
            </span>
            <p className="text-[15px] font-medium text-text-primary mt-4">
              {query ? 'Aucun résultat' : 'Aucun compte médecin'}
            </p>
          </div>
        )}

        {visible.map((d, i) => {
          const idle = daysSince(d.lastLoginAt);
          const isDormant = idle !== null && idle >= DORMANT_DAYS;

          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              className={`group hover-row bg-white rounded-[18px] border border-border-subtle p-5 flex items-center gap-5 flex-wrap ${
                d.isActive ? '' : 'opacity-70'
              }`}
            >
              <span className={`w-12 h-12 rounded-full grid place-items-center shrink-0 transition-colors duration-300 ${
                d.isActive ? 'bg-primary/5 group-hover:bg-accent/20' : 'bg-rose-50'
              }`}>
                <Stethoscope
                  size={20}
                  className={d.isActive ? 'text-primary' : 'text-rose-500'}
                  strokeWidth={1.75}
                />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="text-[15.5px] font-semibold text-text-primary truncate">{d.name}</p>
                  {!d.isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-rose-50 text-rose-700 text-[11px] font-semibold">
                      <Ban size={11} strokeWidth={2} />
                      Désactivé
                    </span>
                  )}
                  {d.isActive && !d.lastLoginAt && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-amber-50 text-amber-700 text-[11px] font-semibold">
                      <Clock size={11} strokeWidth={2} />
                      Jamais connecté
                    </span>
                  )}
                  {d.isActive && isDormant && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-violet-50 text-violet-700 text-[11px] font-semibold">
                      <Moon size={11} strokeWidth={2} />
                      Inactif {idle} j
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap mt-1.5">
                  {d.matricule && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted font-normal">
                      <IdCard size={13} strokeWidth={1.75} />
                      <span className="tabular">{d.matricule}</span>
                    </span>
                  )}
                  {d.specialty && (
                    <span className="text-[12.5px] text-text-muted font-normal">{d.specialty}</span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted font-normal">
                    <CalendarDays size={13} strokeWidth={1.75} />
                    inscrit {relativeDay(d.createdAt) ?? fileDateTime(d.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="tabular text-[17px] font-semibold text-primary leading-none">
                    {d.loginCount}
                  </p>
                  <p className="text-[11px] text-text-muted font-normal mt-1">connexions</p>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-[12.5px] font-medium text-text-secondary">
                    {d.lastLoginAt
                      ? relativeDay(d.lastLoginAt) ?? fileDateTime(d.lastLoginAt)
                      : '—'}
                  </p>
                  <p className="text-[11px] text-text-muted font-normal mt-0.5">
                    {d.lastLoginAt ? 'dernière connexion' : 'jamais venu'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* The dormant count is the actionable signal here: it is what a free-trial
          or licence review would act on. */}
      {dormant > 0 && (
        <div className="mt-5 flex items-start gap-3 p-4 rounded-[16px] bg-violet-50 border border-violet-100">
          <UserCheck size={18} className="text-violet-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-[13px] font-medium text-violet-900">
            {dormant} compte{dormant > 1 ? 's' : ''} sans connexion depuis plus de {DORMANT_DAYS} jours.
            Vous pouvez les désactiver depuis la page Médecins.
          </p>
        </div>
      )}
    </div>
  );
}
