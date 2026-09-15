import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, CalendarDays, Mail, Phone, RefreshCw, Repeat, Search, Users,
} from 'lucide-react';
import { adminApi, type DemoLead } from '../lib/api';
import { relativeDay, fileDateTime } from '../lib/dates';

/**
 * Sign-in activity, read from DemoLead.
 *
 * DemoLead is a registration/activity log written outside the account
 * transaction (best-effort — see provisionDoctorAccount), so it can lag behind
 * the real roster. Treat this page as analytics, not as the account list:
 * provisioning decisions belong on the Médecins page.
 */
export default function ActivityPage() {
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const { leads } = await adminApi.leads();
      setLeads(leads);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l =>
      `${l.name} ${l.phone} ${l.specialty ?? ''} ${l.email ?? ''}`.toLowerCase().includes(q),
    );
  }, [leads, query]);

  const totalVisits = useMemo(() => leads.reduce((n, l) => n + l.visits, 0), [leads]);
  // Accounts that came back at least once after the first sign-in.
  const returning = useMemo(() => leads.filter(l => l.visits > 1).length, [leads]);

  const stats = [
    { label: 'Inscrits', value: leads.length, icon: Users, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Connexions totales', value: totalVisits, icon: CalendarDays, tint: 'bg-teal-50 text-teal-600' },
    { label: 'Comptes récurrents', value: returning, icon: Repeat, tint: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Activité
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Les inscriptions et la fréquence de connexion
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-7">
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
          placeholder="Rechercher par nom, téléphone, spécialité…"
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
        {isLoading && leads.length === 0 && (
          <div className="py-16 text-center">
            <span className="inline-block w-7 h-7 rounded-full border-2 border-border-subtle border-t-primary animate-spin" />
            <p className="text-[13px] font-medium text-text-muted mt-3">Chargement…</p>
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="py-16 text-center bg-white rounded-[20px] border border-border-subtle">
            <span className="w-12 h-12 rounded-full bg-bg-soft grid place-items-center mx-auto">
              <Users size={21} className="text-text-muted" strokeWidth={1.5} />
            </span>
            <p className="text-[15px] font-medium text-text-primary mt-4">
              {query ? 'Aucun résultat' : 'Aucune activité enregistrée'}
            </p>
          </div>
        )}

        {visible.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            className="group hover-row bg-white rounded-[18px] border border-border-subtle p-5 flex items-center gap-5 flex-wrap"
          >
            <span className="w-12 h-12 rounded-full bg-primary/5 grid place-items-center shrink-0 transition-colors duration-300 group-hover:bg-accent/20">
              <Users size={20} className="text-primary" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-semibold text-text-primary truncate">{l.name}</p>
              <div className="flex items-center gap-4 flex-wrap mt-1.5">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted font-normal">
                  <Phone size={13} strokeWidth={1.75} />
                  {l.phone}
                </span>
                {l.specialty && (
                  <span className="text-[12.5px] text-text-muted font-normal">{l.specialty}</span>
                )}
                {l.email && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted font-normal truncate">
                    <Mail size={13} strokeWidth={1.75} />
                    {l.email}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <p className="tabular text-[17px] font-semibold text-primary leading-none">{l.visits}</p>
                <p className="text-[11px] text-text-muted font-normal mt-1">connexions</p>
              </div>
              <div className="text-right min-w-[110px]">
                <p className="text-[12.5px] font-medium text-text-secondary">
                  {relativeDay(l.lastSeenAt) ?? fileDateTime(l.lastSeenAt)}
                </p>
                <p className="text-[11px] text-text-muted font-normal mt-0.5">dernière visite</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
