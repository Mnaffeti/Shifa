import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, Ban, CheckCircle2, IdCard, KeyRound, Pencil, Phone, Plus,
  CalendarClock, RefreshCw, RotateCcw, Search, Stethoscope, Trash2, UserCheck,
} from 'lucide-react';
import { adminApi, ApiError, type DoctorAccount } from '../lib/api';
import { relativeDay, fileDate } from '../lib/dates';
import CreateDoctorModal from '../components/CreateDoctorModal';
import EditDoctorModal from '../components/EditDoctorModal';
import ConfirmDialog from '../components/ConfirmDialog';
import IssuedCredentialsCard from '../components/IssuedCredentialsCard';
import DoctorDetailPanel from '../components/DoctorDetailPanel';
import TrialModal from '../components/TrialModal';

type Filter = 'all' | 'active' | 'inactive';

/**
 * The doctor roster — real Account rows, with the actions the back office
 * needs on an existing account: edit, revoke/restore access, delete.
 *
 * The Activité page shows the same accounts from the sign-in angle; this one
 * is where provisioning decisions are made.
 */
export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorAccount | null>(null);
  const [toggling, setToggling] = useState<DoctorAccount | null>(null);
  const [deleting, setDeleting] = useState<DoctorAccount | null>(null);
  const [resetting, setResetting] = useState<DoctorAccount | null>(null);
  const [selected, setSelected] = useState<DoctorAccount | null>(null);
  const [trialFor, setTrialFor] = useState<DoctorAccount | null>(null);
  // Set once a reset succeeds: the plaintext exists only here, so the card
  // stays up until the admin dismisses it.
  const [issued, setIssued] = useState<
    { name: string; matricule: string; temporaryPassword: string } | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const { doctors } = await adminApi.doctors.list();
      setDoctors(doctors);
      setSelected(prev => (prev ? doctors.find(d => d.id === prev.id) ?? null : null));
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
    return doctors
      .filter(d => filter === 'all'
        || (filter === 'active' ? d.isActive : !d.isActive))
      .filter(d => !q || `${d.name} ${d.matricule ?? ''} ${d.specialty ?? ''} ${d.phone ?? ''}`
        .toLowerCase().includes(q));
  }, [doctors, query, filter]);

  const activeCount = doctors.filter(d => d.isActive).length;

  const stats = [
    { label: 'Comptes actifs', value: activeCount, icon: UserCheck, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Comptes désactivés', value: doctors.length - activeCount, icon: Ban, tint: 'bg-rose-50 text-rose-600' },
    { label: '1re connexion en attente', value: doctors.filter(d => d.mustChangePassword).length, icon: KeyRound, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Essais expirés', value: doctors.filter(d => d.trialDaysLeft === 0).length, icon: CalendarClock, tint: 'bg-violet-50 text-violet-600' },
  ];

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: `Tous (${doctors.length})` },
    { id: 'active', label: `Actifs (${activeCount})` },
    { id: 'inactive', label: `Désactivés (${doctors.length - activeCount})` },
  ];

  const confirmToggle = async () => {
    if (!toggling) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminApi.doctors.update(toggling.id, { isActive: !toggling.isActive });
      setToggling(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async () => {
    if (!resetting) return;
    setBusy(true);
    setActionError(null);
    try {
      const { doctor, temporaryPassword } = await adminApi.doctors.resetPassword(resetting.id);
      setResetting(null);
      setIssued({ name: doctor.name, matricule: doctor.matricule, temporaryPassword });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Réinitialisation impossible.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminApi.doctors.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Médecins
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Gérer les comptes médecins et leur accès à la plateforme
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

      {/* Search + status filter */}
      <div className="flex items-center gap-3 mt-7 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={17} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par nom, matricule, spécialité…"
            className="w-full h-12 pl-11 pr-4 rounded-[14px] border border-border-subtle bg-white text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`h-12 px-4 rounded-[14px] text-[13px] font-medium whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-accent text-primary'
                  : 'bg-white border border-border-subtle text-text-secondary hover:border-accent hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
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
              {query || filter !== 'all' ? 'Aucun médecin ne correspond' : 'Aucun compte médecin'}
            </p>
            <p className="text-[13px] text-text-muted font-normal mt-1">
              {query || filter !== 'all'
                ? 'Essayez un autre filtre ou terme de recherche.'
                : 'Créez le premier compte pour commencer.'}
            </p>
          </div>
        )}

        {visible.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            onClick={() => setSelected(d)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(d); } }}
            className={`group hover-row bg-white rounded-[18px] border border-border-subtle p-5 flex items-center gap-5 flex-wrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
              d.isActive ? '' : 'opacity-70'
            }`}
          >
            <span className={`w-12 h-12 rounded-full grid place-items-center shrink-0 transition-colors duration-300 ${
              d.isActive
                ? 'bg-primary/5 group-hover:bg-accent/20'
                : 'bg-rose-50'
            }`}>
              <Stethoscope size={20} className={d.isActive ? 'text-primary' : 'text-rose-500'} strokeWidth={1.75} />
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
                {d.isActive && d.trialDaysLeft === 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-violet-50 text-violet-700 text-[11px] font-semibold">
                    <CalendarClock size={11} strokeWidth={2} />
                    Essai terminé
                  </span>
                )}
                {d.isActive && d.trialDaysLeft !== null && d.trialDaysLeft > 0 && d.trialDaysLeft <= 3 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-amber-50 text-amber-700 text-[11px] font-semibold">
                    <CalendarClock size={11} strokeWidth={2} />
                    Essai : {d.trialDaysLeft} j
                  </span>
                )}
                {d.isActive && d.mustChangePassword && (
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

            <div className="text-right shrink-0 min-w-[108px]">
              <p className="text-[12.5px] font-medium text-text-secondary">
                {d.lastLoginAt
                  ? relativeDay(d.lastLoginAt) ?? fileDate(d.lastLoginAt)
                  : 'Jamais'}
              </p>
              <p className="text-[11px] text-text-muted font-normal mt-0.5">
                {d.lastLoginAt ? 'dernière connexion' : 'jamais connecté'}
              </p>
            </div>

            {/* Row actions — the row itself opens the detail panel, so each
                button stops the click from bubbling up to it. */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setEditing(d)}
                title="Modifier"
                className="w-9 h-9 rounded-[11px] grid place-items-center text-text-muted hover:bg-bg-soft hover:text-primary transition-all"
              >
                <Pencil size={16} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setTrialFor(d)}
                title="Gérer la période d'essai"
                className={`w-9 h-9 rounded-[11px] grid place-items-center transition-all ${
                  d.trialDaysLeft === 0
                    ? 'text-violet-600 hover:bg-violet-50'
                    : 'text-text-muted hover:bg-bg-soft hover:text-primary'
                }`}
              >
                <CalendarClock size={16} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => { setActionError(null); setResetting(d); }}
                title="Réinitialiser le mot de passe"
                className="w-9 h-9 rounded-[11px] grid place-items-center text-text-muted hover:bg-amber-50 hover:text-amber-600 transition-all"
              >
                <RotateCcw size={16} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => { setActionError(null); setToggling(d); }}
                title={d.isActive ? 'Désactiver l’accès' : 'Réactiver l’accès'}
                className={`w-9 h-9 rounded-[11px] grid place-items-center transition-all ${
                  d.isActive
                    ? 'text-text-muted hover:bg-rose-50 hover:text-rose-600'
                    : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {d.isActive ? <Ban size={16} strokeWidth={1.75} /> : <CheckCircle2 size={16} strokeWidth={1.75} />}
              </button>
              {/* Deleting is only offered for an account that never signed in —
                  the server refuses the rest, so don't invite the click. */}
              {!d.lastLoginAt && (
                <button
                  onClick={() => { setActionError(null); setDeleting(d); }}
                  title="Supprimer"
                  className="w-9 h-9 rounded-[11px] grid place-items-center text-text-muted hover:bg-rose-50 hover:text-rose-600 transition-all"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <TrialModal
        doctor={trialFor}
        onClose={() => setTrialFor(null)}
        onSaved={load}
      />

      <DoctorDetailPanel
        doctor={selected}
        onClose={() => setSelected(null)}
        onEdit={d => { setSelected(null); setEditing(d); }}
        onReset={d => { setSelected(null); setActionError(null); setResetting(d); }}
        onToggle={d => { setSelected(null); setActionError(null); setToggling(d); }}
        onDelete={d => { setSelected(null); setActionError(null); setDeleting(d); }}
      />

      <CreateDoctorModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={load}
      />

      <EditDoctorModal
        doctor={editing}
        onClose={() => setEditing(null)}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!toggling}
        tone={toggling?.isActive ? 'danger' : 'primary'}
        icon={toggling?.isActive ? Ban : CheckCircle2}
        title={toggling?.isActive ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
        body={toggling?.isActive
          ? `${toggling?.name} ne pourra plus se connecter, et sa session en cours sera coupée immédiatement. Ses dossiers patients sont conservés et l'accès peut être rétabli à tout moment.`
          : `${toggling?.name} pourra de nouveau se connecter avec son matricule et son mot de passe habituels.`}
        confirmLabel={toggling?.isActive ? 'Désactiver' : 'Réactiver'}
        busy={busy}
        error={actionError}
        onCancel={() => { setToggling(null); setActionError(null); }}
        onConfirm={confirmToggle}
      />

      <ConfirmDialog
        open={!!resetting}
        tone="primary"
        icon={RotateCcw}
        title="Réinitialiser le mot de passe ?"
        body={`Un nouveau mot de passe temporaire sera généré pour ${resetting?.name}. Son mot de passe actuel cessera aussitôt de fonctionner, et il devra en choisir un nouveau à sa prochaine connexion.`}
        confirmLabel="Réinitialiser"
        busy={busy}
        error={actionError}
        onCancel={() => { setResetting(null); setActionError(null); }}
        onConfirm={confirmReset}
      />

      {/* The plaintext lives only in this state, so keep it up until dismissed. */}
      <AnimatePresence>
        {issued && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl p-8"
            >
              <IssuedCredentialsCard
                doctorName={issued.name}
                matricule={issued.matricule}
                temporaryPassword={issued.temporaryPassword}
                variant="reset"
                onDone={() => setIssued(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        icon={Trash2}
        title="Supprimer ce compte ?"
        body={`Le compte de ${deleting?.name} sera définitivement supprimé. Cette action est irréversible — elle n'est possible que parce que ce compte ne s'est jamais connecté.`}
        confirmLabel="Supprimer"
        busy={busy}
        error={actionError}
        onCancel={() => { setDeleting(null); setActionError(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
