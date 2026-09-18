import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BadgeCheck, CalendarClock, Infinity as InfinityIcon, X } from 'lucide-react';
import { adminApi, ApiError, type DoctorAccount } from '../lib/api';
import { fileDate } from '../lib/dates';

interface Props {
  doctor: DoctorAccount | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRESETS = [7, 14, 30];

/**
 * Grants more trial time, or converts an account to unlimited access.
 *
 * This is the way back from an expired trial: expiry blocks sign-in outright,
 * so a doctor locked out of their own patient records depends on an admin
 * being able to lift it here in one click.
 */
export default function TrialModal({ doctor, onClose, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (data: { extendDays: number } | { convert: true }) => {
    if (!doctor || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.doctors.trial(doctor.id, data);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const expired = doctor?.trialDaysLeft === 0;
  const unlimited = doctor?.trialDaysLeft === null;

  return (
    <AnimatePresence>
      {doctor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={busy ? undefined : onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[460px] bg-white rounded-[28px] shadow-2xl p-8 relative"
          >
            <button
              onClick={onClose}
              disabled={busy}
              className="absolute right-6 top-6 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <span className={`w-12 h-12 rounded-2xl grid place-items-center mb-5 ${
              unlimited ? 'bg-emerald-50 text-emerald-600'
                : expired ? 'bg-rose-50 text-rose-600'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {unlimited
                ? <BadgeCheck size={22} strokeWidth={1.75} />
                : <CalendarClock size={22} strokeWidth={1.75} />}
            </span>

            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Période d’essai
            </h2>
            <p className="text-[13.5px] text-text-secondary font-medium mt-1.5">
              {doctor.name}
            </p>

            <div className="mt-5 bg-bg-soft rounded-2xl p-5">
              {unlimited ? (
                <p className="text-[14px] font-medium text-emerald-700">
                  Accès illimité — ce compte n’est plus soumis à une période d’essai.
                </p>
              ) : expired ? (
                <>
                  <p className="text-[14px] font-semibold text-rose-700">
                    Essai terminé le {fileDate(doctor.trialEndsAt!)}
                  </p>
                  <p className="text-[12.5px] text-text-muted font-normal mt-1.5 leading-relaxed">
                    Ce médecin ne peut plus se connecter. Ses dossiers patients sont
                    conservés et redeviennent accessibles dès que vous prolongez.
                  </p>
                </>
              ) : (
                <>
                  <p className="tabular text-[26px] font-semibold text-text-primary leading-none">
                    {doctor.trialDaysLeft} jour{(doctor.trialDaysLeft ?? 0) > 1 ? 's' : ''}
                  </p>
                  <p className="text-[12.5px] text-text-muted font-normal mt-1.5">
                    restants — fin le {fileDate(doctor.trialEndsAt!)}
                  </p>
                </>
              )}
            </div>

            {error && (
              <p className="mt-4 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold rounded-xl">
                {error}
              </p>
            )}

            {!unlimited && (
              <>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.14em] mt-6">
                  Prolonger de
                </p>
                <div className="grid grid-cols-3 gap-2.5 mt-3">
                  {PRESETS.map(days => (
                    <button
                      key={days}
                      onClick={() => run({ extendDays: days })}
                      disabled={busy}
                      className="h-12 rounded-[14px] border border-border-subtle text-[13.5px] font-semibold text-text-secondary hover:border-accent hover:text-primary transition-all disabled:opacity-50"
                    >
                      +{days} j
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center gap-2.5 mt-5 pt-5 border-t border-border-subtle">
              <button
                onClick={onClose}
                disabled={busy}
                className="flex-1 h-12 rounded-2xl border border-border-subtle text-[14px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all disabled:opacity-50"
              >
                Fermer
              </button>
              {!unlimited && (
                <button
                  onClick={() => run({ convert: true })}
                  disabled={busy}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white text-[13.5px] font-bold hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <InfinityIcon size={16} strokeWidth={2} />
                  {busy ? 'En cours…' : 'Accès illimité'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
