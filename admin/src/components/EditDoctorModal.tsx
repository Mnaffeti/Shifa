import React, { useEffect, useState } from 'react';
import { IdCard, Phone, Stethoscope, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminApi, ApiError, type DoctorAccount } from '../lib/api';
import { SPECIALTIES } from '../lib/specialties';

interface Props {
  doctor: DoctorAccount | null;
  onClose: () => void;
  /** Called after a successful save, so the roster can refresh. */
  onSaved: () => void;
}

/**
 * Edits an existing doctor account: name, matricule, specialty, phone.
 *
 * Access is toggled from the roster row rather than here — revoking is a
 * different kind of decision from fixing a typo, and burying it behind a form
 * save would make it too easy to do by accident.
 */
export default function EditDoctorModal({ doctor, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-seed the form whenever a different doctor is opened.
  useEffect(() => {
    if (!doctor) return;
    setName(doctor.name);
    setMatricule(doctor.matricule ?? '');
    setSpecialty(doctor.specialty ?? SPECIALTIES[0]);
    setPhone(doctor.phone ?? '');
    setError('');
  }, [doctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!doctor) return;

    if (!name.trim()) return setError('Veuillez saisir le nom complet.');
    if (!matricule.trim()) return setError('Veuillez saisir le matricule.');
    if (phone.replace(/[^\d]/g, '').length < 8) {
      return setError('Veuillez saisir un numéro de téléphone valide.');
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await adminApi.doctors.update(doctor.id, {
        name: name.trim(),
        matricule: matricule.trim(),
        specialty,
        phone: phone.trim(),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {doctor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl p-8 relative"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Modifier le compte
            </h2>
            <p className="text-[13.5px] text-text-secondary font-medium mt-1.5">
              Le matricule sert d'identifiant de connexion.
            </p>

            {error && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">
                  Matricule
                </label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">
                  Spécialité
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted z-10" size={18} />
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30 appearance-none cursor-pointer"
                    required
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {/* A specialty saved before this list existed must survive an edit. */}
                    {specialty && !SPECIALTIES.includes(specialty as typeof SPECIALTIES[number]) && (
                      <option value={specialty}>{specialty}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl border border-border-subtle text-[14px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white text-[14px] font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
