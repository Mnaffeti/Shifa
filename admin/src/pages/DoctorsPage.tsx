import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, IdCard, KeyRound, Phone, Plus, RefreshCw, Search, Stethoscope, Users,
} from 'lucide-react';
import { adminApi, type DoctorAccount } from '../lib/api';
import { relativeDay, fileDate } from '../lib/dates';
import CreateDoctorModal from '../components/CreateDoctorModal';

/**
 * The doctor roster — real Account rows.
 *
 * Distinct from the Activité page, which reads DemoLead: that table is a
 * best-effort registration log written outside the account transaction, so it
 * can drift. Provisioning decisions belong on this list.
 */
export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(d =>
      `${d.name} ${d.matricule ?? ''} ${d.specialty ?? ''} ${d.phone ?? ''}`
        .toLowerCase().includes(q),
    );
  }, [doctors, query]);

  const pendingFirstLogin = doctors.filter(d => d.mustChangePassword).length;

  const stats = [
    { label: 'Comptes médecins', value: doctors.length, icon: Users, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Spécialités', value: new Set(doctors.map(d => d.specialty).filter(Boolean)).size, icon: Stethoscope, tint: 'bg-violet-50 text-violet-600' },
    { label: '1re connexion en attente', value: pendingFirstLogin, icon: KeyRound, tint: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Médecins
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Les comptes médecins actifs sur la plateforme
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-[14px] border border-border-subtle bg-white text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} strokeWidth={1.75} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="group inline-flex items-center gap-2 h-11 px-5 rounded-[14px] bg-primary text-white text-[13px] font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-90" />
            Créer un compte
          </button>
        </div>
      </header>

      {/* Stat tiles — tinted icon chips, as on the doctor dashboard. */}
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

      {/* Search */}
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

      {/* Roster */}
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
              <Stethoscope size={21} className="text-text-muted" strokeWidth={1.5} />
            </span>
            <p className="text-[15px] font-medium text-text-primary mt-4">
              {query ? 'Aucun médecin ne correspond' : 'Aucun compte médecin'}
            </p>
            <p className="text-[13px] text-text-muted font-normal mt-1">
              {query ? 'Essayez un autre terme de recherche.' : 'Créez le premier compte pour commencer.'}
            </p>
          </div>
        )}

        {visible.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            className="group hover-row bg-white rounded-[18px] border border-border-subtle p-5 flex items-center gap-5 flex-wrap"
          >
            <span className="w-12 h-12 rounded-full bg-primary/5 grid place-items-center shrink-0 transition-colors duration-300 group-hover:bg-accent/20">
              <Stethoscope size={20} className="text-primary" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-[15.5px] font-semibold text-text-primary truncate">{d.name}</p>
                {d.mustChangePassword && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-amber-50 text-amber-700 text-[11px] font-semibold">
                    <KeyRound size={11} strokeWidth={2} />
                    1re connexion
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
                {d.phone && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted font-normal">
                    <Phone size={13} strokeWidth={1.75} />
                    {d.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[12.5px] font-medium text-text-secondary">
                {relativeDay(d.createdAt) ?? fileDate(d.createdAt)}
              </p>
              <p className="text-[11px] text-text-muted font-normal mt-0.5">inscrit</p>
            </div>
          </motion.div>
        ))}
      </div>

      <CreateDoctorModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={load}
      />
    </div>
  );
}
