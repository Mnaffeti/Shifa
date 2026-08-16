import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Phone, Sparkles, User, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the visitor's details once the form validates. */
  onSubmit: (details: { name: string; phone: string }) => Promise<void> | void;
}

/**
 * Collects a name and phone number before opening the demo.
 *
 * Deliberately minimal — two fields and one button. Anything longer here
 * costs more visitors than the extra data is worth.
 */
export default function DemoAccessModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setPhone('');
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      return setError('Veuillez saisir votre nom.');
    }
    // Permissive on formatting — visitors write +216, spaces, dashes.
    if (trimmedPhone.replace(/[^\d]/g, '').length < 8) {
      return setError('Veuillez saisir un numéro de téléphone valide.');
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: trimmedName, phone: trimmedPhone });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ouvrir la démo.");
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-title"
            className="relative w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl overflow-hidden"
          >
            <button
              onClick={close}
              aria-label="Fermer"
              className="absolute top-4 right-4 p-1.5 rounded-full text-text-muted hover:bg-bg-soft hover:text-primary transition-colors"
            >
              <X size={18} />
            </button>

            <div className="px-7 pt-8 pb-7">
              <span className="w-12 h-12 rounded-2xl bg-primary/5 grid place-items-center">
                <Sparkles size={20} className="text-primary" strokeWidth={1.75} />
              </span>

              <h2
                id="demo-title"
                className="text-[22px] font-semibold text-text-primary tracking-tight mt-5"
              >
                Découvrir la démo
              </h2>
              <p className="text-[14px] font-normal text-text-muted leading-relaxed mt-2">
                Dites-nous qui vous êtes et la démonstration s'ouvre immédiatement.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="demo-name"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary mb-1.5"
                  >
                    Nom complet
                  </label>
                  <div className="relative">
                    <User
                      size={17}
                      strokeWidth={1.75}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                    <input
                      id="demo-name"
                      autoFocus
                      value={name}
                      onChange={e => { setName(e.target.value); setError(null); }}
                      autoComplete="name"
                      placeholder="Dr. Youssef Ben Ali"
                      className="w-full h-12 pl-11 pr-4 rounded-[14px] bg-bg-soft/50 border border-border-subtle text-[15px] font-medium text-text-primary placeholder:text-text-muted placeholder:font-normal focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="demo-phone"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary mb-1.5"
                  >
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone
                      size={17}
                      strokeWidth={1.75}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                    <input
                      id="demo-phone"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setError(null); }}
                      autoComplete="tel"
                      placeholder="+216 22 345 678"
                      className="w-full h-12 pl-11 pr-4 rounded-[14px] bg-bg-soft/50 border border-border-subtle text-[15px] font-medium text-text-primary placeholder:text-text-muted placeholder:font-normal focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all tabular"
                    />
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-[13px] font-medium text-rose-600 mt-0.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white text-[15px] font-bold shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {submitting ? 'Ouverture…' : 'Ouvrir la démo'}
                  {!submitting && <ArrowRight size={17} strokeWidth={2.5} />}
                </button>
              </form>

              <p className="text-[11.5px] text-text-muted font-normal text-center mt-4 leading-relaxed">
                Environnement de démonstration — les dossiers présentés sont fictifs.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
