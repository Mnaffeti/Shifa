import React, { useState } from 'react';
import { User, IdCard, Stethoscope, Phone, ChevronRight, ArrowLeft, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doctorRequestApi, ApiError } from '../lib/api';
import { SPECIALTIES } from '../lib/specialties';

interface Props {
  /** Back to the welcome gate. */
  onBack: () => void;
}

/**
 * Public: a doctor requests an account (name, matricule, specialty, phone).
 * No password here — an admin reviews the request in the back office and,
 * on acceptance, issues a temporary password for the doctor.
 */
export default function DoctorRequestPage({ onBack }: Props) {
  const [name, setName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Veuillez saisir votre nom complet.');
    if (!matricule.trim()) return setError('Veuillez saisir votre matricule.');
    if (phone.replace(/[^\d]/g, '').length < 8) {
      return setError('Veuillez saisir un numéro de téléphone valide.');
    }
    if (!termsAccepted) {
      return setError('Veuillez accepter les conditions d\'utilisation pour continuer.');
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await doctorRequestApi.submit({
        name: name.trim(),
        matricule: matricule.trim(),
        specialty,
        phone: phone.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec de la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[32px] shadow-2xl border border-white/20 p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8 justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
                <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
              </div>
              <span className="font-heading font-bold text-3xl text-primary ml-2">ClickMED</span>
            </div>

            {submitted ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 grid place-items-center mx-auto mb-5">
                  <CheckCircle2 size={28} className="text-emerald-600" strokeWidth={2} />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2 font-heading tracking-tight">
                  Demande envoyée
                </h1>
                <p className="text-base font-medium text-text-secondary max-w-[340px] mx-auto">
                  Un administrateur va examiner votre demande. Vous recevrez votre matricule et un mot de passe temporaire une fois votre compte validé.
                </p>
                <button
                  onClick={onBack}
                  className="mt-8 inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                >
                  <ArrowLeft size={16} />
                  Retour à l'accueil
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-text-primary mb-2 font-heading tracking-tight leading-tight">
                    Demander un compte
                  </h1>
                  <p className="text-base font-medium text-text-secondary">
                    Un administrateur validera votre demande et vous enverra vos identifiants.
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3"
                  >
                    <div className="w-1 h-5 bg-red-600 rounded-full" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30"
                        placeholder="Youssef Ben Ali"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Matricule</label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                      <input
                        type="text"
                        value={matricule}
                        onChange={(e) => setMatricule(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30"
                        placeholder="DOC-0001"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Spécialité</label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted z-10" size={20} />
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30 appearance-none cursor-pointer"
                        required
                      >
                        {SPECIALTIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30"
                        placeholder="+216 22 345 678"
                        required
                      />
                    </div>
                  </div>

                  {/* Terms of use */}
                  <div className="rounded-2xl border border-border-subtle bg-bg-soft/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTermsExpanded(!termsExpanded)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-left"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary">
                        <ShieldCheck size={16} className="text-primary shrink-0" />
                        Conditions d'utilisation et confidentialité
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-text-muted transition-transform shrink-0 ${termsExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {termsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 max-h-56 overflow-y-auto text-[12.5px] leading-relaxed text-text-secondary space-y-2.5 font-medium">
                            <p>
                              En demandant un compte médecin sur ClickMED, vous acceptez les conditions suivantes :
                            </p>
                            <p>
                              <strong className="text-text-primary">Protection des données.</strong> Les
                              données patients sont chiffrées au repos et en transit, et ne sont
                              accessibles qu'aux professionnels de santé autorisés sur leur propre
                              patientèle.
                            </p>
                            <p>
                              <strong className="text-text-primary">Responsabilité du compte.</strong> Vous
                              êtes responsable de la confidentialité de votre matricule et de votre mot
                              de passe, ainsi que de toute activité effectuée depuis votre compte. Ne
                              partagez jamais vos identifiants.
                            </p>
                            <p>
                              <strong className="text-text-primary">Usage professionnel.</strong> Le compte
                              est strictement réservé à un usage professionnel dans le cadre de votre
                              exercice médical, conformément au secret médical et à la réglementation en
                              vigueur.
                            </p>
                            <p>
                              <strong className="text-text-primary">Exactitude des informations.</strong> Les
                              informations fournies dans cette demande doivent être exactes ; le compte
                              est soumis à validation par un administrateur avant activation.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <label className="flex items-start gap-3 px-4 pb-4 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 shrink-0"
                      />
                      <span className="text-[13px] font-medium text-text-secondary leading-snug">
                        J'ai lu et j'accepte les conditions d'utilisation et la politique de
                        confidentialité.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !termsAccepted}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {isSubmitting ? 'Envoi…' : 'Envoyer la demande'}
                    <ChevronRight size={22} />
                  </button>
                </form>

                <button
                  onClick={onBack}
                  className="w-full text-center mt-6 text-text-secondary text-sm font-bold hover:text-primary transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={15} />
                  Retour
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
