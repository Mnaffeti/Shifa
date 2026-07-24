import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

/**
 * Waitlist signup. Emails every submission to the ShifaPlus inbox via Web3Forms
 * (no backend needed), and also stores entries in localStorage (deduped by
 * email) so the counter survives refresh.
 */

const STORE_KEY = 'shifaplus_waitlist';
const COUNTER_BASE = 128;
const ROLES = ['Médecin', 'Secrétaire', 'Clinique'] as const;

// Web3Forms access key — hardcoded. Create a free one for aziznefeti73@gmail.com
// at https://web3forms.com (enter your email, they send the key), then paste it
// below. Safe to expose in the client: it can only send to the registered email.
const WEB3FORMS_KEY = 'e94e47fe-feae-450c-a718-ee546fd95d1e';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function readStore(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}'); } catch { return {}; }
}

function currentCount() {
  return COUNTER_BASE + Object.keys(readStore()).length;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [clinic, setClinic] = useState('');
  const [role, setRole] = useState<string>(ROLES[0]);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(currentCount());

  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setDone(false);
    setCount(currentCount());
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setError('Veuillez saisir une adresse email valide.'); return; }
    setError('');
    setSubmitting(true);

    const id = email.trim().toLowerCase();
    const clinicName = clinic.trim();

    // Persist locally (dedupe + counter) regardless of email outcome.
    const store = readStore();
    store[id] = { email: id, clinicName, role, createdAt: new Date().toISOString() };
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    setCount(COUNTER_BASE + Object.keys(store).length);

    // Email the signup via Web3Forms. Note: Web3Forms free plan only accepts
    // submissions from a real browser (client-side) — server-side POSTs are
    // rejected. `ccemail` requires the CC address to be verified on the account,
    // so we send once to the registered inbox and separately request a copy to
    // the second address (dropped silently if not allowed, never blocking).
    const sendTo = async (extra: Record<string, string>) => {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          from_name: 'ShifaPlus — Liste d’attente',
          email: id,                       // reply-to = the person who signed up
          'Rôle': role,
          'Nom du cabinet': clinicName || '—',
          'Date': new Date().toLocaleString('fr-FR'),
          ...extra,
        }),
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && data?.success !== false;
    };

    try {
      const ok = await sendTo({ subject: `Nouvelle inscription liste d’attente — ${id}` });
      // Best-effort copy to the second inbox (verified-recipient required on free plan).
      sendTo({ subject: `Copie inscription — ${id}`, ccemail: 'youssefgara.tc@gmail.com' }).catch(() => {});
      if (!ok) {
        setError('Inscription enregistrée, mais l’email n’a pas pu être envoyé.');
      }
    } catch {
      setError('Inscription enregistrée localement (email indisponible).');
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Rejoindre la liste d’attente"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-[440px] bg-white rounded-[24px] shadow-2xl border border-border-subtle overflow-hidden"
          >
            <button
              onClick={onClose} aria-label="Fermer"
              className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-bg-soft transition-colors"
            >
              <X size={18} />
            </button>

            {done ? (
              <div className="p-8">
                <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-emerald-100">
                  <Check size={22} className="text-emerald-600" strokeWidth={2.5} />
                </span>
                <h2 className="mt-4 text-xl font-bold text-text-primary tracking-tight">Vous êtes sur la liste.</h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  Nous vous contacterons avant l’ouverture.
                </p>
                <p className="mt-4 pt-4 border-t border-border-subtle text-sm text-text-muted leading-relaxed">
                  Partagez ShifaPlus à un confrère qui ouvre son cabinet.
                </p>
              </div>
            ) : (
              <div className="p-8">
                <h2 className="text-xl font-bold text-text-primary tracking-tight pr-8">Rejoindre la liste d’attente</h2>
                <p className="mt-1.5 text-sm font-bold text-primary tabular">
                  Rejoignez les {count.toLocaleString('fr-FR')} cabinets déjà inscrits
                </p>

                <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Adresse email</span>
                    <input
                      ref={firstFieldRef} type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="vous@cabinet.tn" required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nom du cabinet</span>
                    <input
                      type="text" value={clinic}
                      onChange={e => setClinic(e.target.value)}
                      placeholder="Cabinet Médical (optionnel)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Rôle</span>
                    <select
                      value={role} onChange={e => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>

                  {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 w-full px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  >
                    {submitting ? 'Enregistrement…' : 'Je m’inscris'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
