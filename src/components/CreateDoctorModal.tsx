import React, { useState } from 'react';
import { IdCard, Phone, Stethoscope, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminApi, ApiError } from '../lib/api';
import { SPECIALTIES } from '../lib/specialties';
import IssuedCredentialsCard from './IssuedCredentialsCard';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a successful creation, so the accounts list can refresh. */
  onCreated: () => void;
}

interface Issued {
  name: string;
  matricule: string;
  temporaryPassword: string;
}

/**
 * Back-office tool: creates a doctor account (name, matricule, specialty,
 * phone) and shows the generated temporary password once, so the admin can
 * relay it to the doctor. The doctor sets their own password on first login.
 */
export default function CreateDoctorModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issued, setIssued] = useState<Issued | null>(null);

  const reset = () => {
    setName(''); setMatricule(''); setSpecialty(SPECIALTIES[0]); setPhone('');
    setError(''); setIssued(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Veuillez saisir le nom complet.');
    if (!matricule.trim()) return setError('Veuillez saisir le matricule.');
    if (phone.replace(/[^\d]/g, '').length < 8) {
      return setError('Veuillez saisir un numéro de téléphone valide.');
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { doctor, temporaryPassword } = await adminApi.createDoctor({
        name: name.trim(),
        matricule: matricule.trim(),
        specialty,
        phone: phone.trim(),
      });
      setIssued({ name: doctor.name, matricule: doctor.matricule, temporaryPassword });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création du compte impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={handleClose}
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
              onClick={handleClose}
              className="absolute right-6 top-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>

            {issued ? (
              <IssuedCredentialsCard
                doctorName={issued.name}
                matricule={issued.matricule}
                temporaryPassword={issued.temporaryPassword}
                onDone={handleClose}
              />
            ) : (
              <div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Créer un compte médecin</h2>
                <p className="text-[13.5px] text-text-secondary font-medium mt-1.5">
                  Un mot de passe temporaire sera généré automatiquement.
                </p>

                {error && (
                  <div className="mt-4 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold rounded-xl">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-5">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                        placeholder="Youssef Ben Ali"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">Matricule</label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input
                        type="text"
                        value={matricule}
                        onChange={(e) => setMatricule(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                        placeholder="DOC-0001"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">Spécialité</label>
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
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                        placeholder="+216 22 345 678"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl bg-primary text-white text-[14px] font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? 'Création…' : 'Créer le compte'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
