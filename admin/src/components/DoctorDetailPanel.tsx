import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ban, CalendarDays, CheckCircle2, ClipboardList, Clock, IdCard, KeyRound,
  Pencil, Phone, RotateCcw, Stethoscope, Trash2, Users, X,
} from 'lucide-react';
import { adminApi, type DoctorAccount, type DoctorStats } from '../lib/api';
import { fileDateTime, relativeDay } from '../lib/dates';

interface Props {
  doctor: DoctorAccount | null;
  onClose: () => void;
  onEdit: (d: DoctorAccount) => void;
  onToggle: (d: DoctorAccount) => void;
  onReset: (d: DoctorAccount) => void;
  onDelete: (d: DoctorAccount) => void;
}

/**
 * Everything the back office knows about one doctor, plus every action on it.
 *
 * The counters come from the server as numbers only — an admin must never see
 * patient names or clinical content, so this panel shows how much an account
 * is used without showing what it holds.
 */
export default function DoctorDetailPanel({
  doctor, onClose, onEdit, onToggle, onReset, onDelete,
}: Props) {
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    let cancelled = false;

    setStats(null);
    setStatsError(false);
    adminApi.doctors.stats(doctor.id)
      .then(({ stats }) => { if (!cancelled) setStats(stats); })
      .catch(() => { if (!cancelled) setStatsError(true); });

    return () => { cancelled = true; };
  }, [doctor]);

  // Close on Escape, as a drawer should.
  useEffect(() => {
    if (!doctor) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doctor, onClose]);

  const tiles = [
    { label: 'Patients', value: stats?.patients, icon: Users, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Rendez-vous', value: stats?.appointments, icon: CalendarDays, tint: 'bg-violet-50 text-violet-600' },
    { label: 'Consultations', value: stats?.consultations, icon: ClipboardList, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'RDV à venir', value: stats?.upcoming, icon: Clock, tint: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <AnimatePresence>
      {doctor && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-[460px] bg-white shadow-2xl overflow-y-auto"
          >
            <header className="sticky top-0 bg-white border-b border-border-subtle px-7 py-5 flex items-start justify-between gap-4 z-10">
              <div className="flex items-center gap-4 min-w-0">
                <span className={`w-12 h-12 rounded-full grid place-items-center shrink-0 ${
                  doctor.isActive ? 'bg-primary/5' : 'bg-rose-50'
                }`}>
                  <Stethoscope
                    size={21}
                    className={doctor.isActive ? 'text-primary' : 'text-rose-500'}
                    strokeWidth={1.75}
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[19px] font-semibold text-text-primary tracking-tight truncate">
                    {doctor.name}
                  </h2>
                  <p className="text-[12.5px] text-text-muted font-normal mt-0.5">
                    {doctor.specialty ?? 'Spécialité non renseignée'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-[11px] grid place-items-center text-text-muted hover:bg-bg-soft hover:text-text-primary transition-all shrink-0"
              >
                <X size={19} strokeWidth={1.75} />
              </button>
            </header>

            <div className="px-7 py-6">
              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[12px] font-semibold ${
                  doctor.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {doctor.isActive
                    ? <><CheckCircle2 size={12} strokeWidth={2} /> Actif</>
                    : <><Ban size={12} strokeWidth={2} /> Désactivé</>}
                </span>
                {doctor.mustChangePassword && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-amber-50 text-amber-700 text-[12px] font-semibold">
                    <KeyRound size={12} strokeWidth={2} />
                    Mot de passe à changer
                  </span>
                )}
              </div>

              {/* Identity */}
              <dl className="mt-6 space-y-3.5">
                <Field icon={IdCard} label="Matricule" value={doctor.matricule ?? '—'} mono />
                <Field icon={Phone} label="Téléphone" value={doctor.phone ?? '—'} />
                <Field
                  icon={Clock}
                  label="Dernière connexion"
                  value={doctor.lastLoginAt
                    ? `${relativeDay(doctor.lastLoginAt) ?? ''} · ${fileDateTime(doctor.lastLoginAt)}`
                    : 'Jamais connecté'}
                />
                <Field icon={CalendarDays} label="Compte créé le" value={fileDateTime(doctor.createdAt)} />
              </dl>

              {/* Activity — counters only, never patient data */}
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.14em] mt-8">
                Activité
              </h3>
              <div className="grid grid-cols-2 gap-3 mt-3.5">
                {tiles.map(t => (
                  <div key={t.label} className="bg-white rounded-[16px] border border-border-subtle p-4">
                    <span className={`w-9 h-9 rounded-full grid place-items-center ${t.tint}`}>
                      <t.icon size={16} strokeWidth={1.75} />
                    </span>
                    <p className="tabular text-[22px] font-semibold text-text-primary leading-none mt-3">
                      {statsError ? '—' : t.value ?? '·'}
                    </p>
                    <p className="text-[12px] text-text-muted font-normal mt-1.5">{t.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11.5px] text-text-muted font-normal mt-3 leading-relaxed">
                Les dossiers patients ne sont pas consultables depuis
                l'administration — seuls ces totaux le sont.
              </p>

              {/* Actions */}
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.14em] mt-8">
                Actions
              </h3>
              <div className="flex flex-col gap-2 mt-3.5">
                <Action
                  icon={Pencil}
                  label="Modifier les informations"
                  hint="Nom, matricule, spécialité, téléphone"
                  onClick={() => onEdit(doctor)}
                />
                <Action
                  icon={RotateCcw}
                  label="Réinitialiser le mot de passe"
                  hint="Génère un mot de passe temporaire à transmettre"
                  onClick={() => onReset(doctor)}
                />
                <Action
                  icon={doctor.isActive ? Ban : CheckCircle2}
                  label={doctor.isActive ? "Désactiver l'accès" : "Réactiver l'accès"}
                  hint={doctor.isActive
                    ? 'Coupe la connexion immédiatement ; les dossiers sont conservés'
                    : 'Le médecin pourra se reconnecter normalement'}
                  tone={doctor.isActive ? 'danger' : 'default'}
                  onClick={() => onToggle(doctor)}
                />
                {/* The server refuses to delete an account that has been used,
                    so only offer it where it can actually succeed. */}
                {!doctor.lastLoginAt && (
                  <Action
                    icon={Trash2}
                    label="Supprimer le compte"
                    hint="Possible uniquement car ce compte ne s'est jamais connecté"
                    tone="danger"
                    onClick={() => onDelete(doctor)}
                  />
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon: Icon, label, value, mono = false,
}: {
  icon: typeof IdCard; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-[10px] bg-bg-soft grid place-items-center shrink-0 mt-0.5">
        <Icon size={15} className="text-text-muted" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{label}</dt>
        <dd className={`text-[14px] font-medium text-text-primary mt-0.5 break-words ${mono ? 'tabular' : ''}`}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function Action({
  icon: Icon, label, hint, onClick, tone = 'default',
}: {
  icon: typeof Pencil;
  label: string;
  hint: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-[14px] border border-border-subtle p-4 flex items-start gap-3.5 transition-all duration-200 hover:border-accent ${
        tone === 'danger' ? 'hover:border-rose-200 hover:bg-rose-50/40' : ''
      }`}
    >
      <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 transition-colors duration-200 ${
        tone === 'danger'
          ? 'bg-rose-50 text-rose-600'
          : 'bg-primary/5 text-primary group-hover:bg-accent/20'
      }`}>
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className={`text-[13.5px] font-semibold ${tone === 'danger' ? 'text-rose-700' : 'text-text-primary'}`}>
          {label}
        </p>
        <p className="text-[12px] text-text-muted font-normal mt-0.5 leading-relaxed">{hint}</p>
      </div>
    </button>
  );
}
