import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

/**
 * Pre-login gate. The first thing an unauthenticated visitor sees: the
 * ShifaPlus wordmark, what the product does, and the two ways in.
 */
interface Props {
  /** Opens the auth page on the sign-in tab. */
  onLogin: () => void;
  /** Opens the auth page on the create-account tab. */
  onSignup: () => void;
}

export default function WelcomeGate({ onLogin, onSignup }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] flex flex-col items-center text-center"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="relative w-11 h-11">
            <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
            <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
          </div>
          <span className="font-heading font-bold text-3xl text-primary ml-2">ShifaPlus</span>
        </div>

        <h1 className="text-3xl font-bold text-text-primary font-heading tracking-tight leading-tight">
          La gestion de cabinet, simplifiée.
        </h1>
        <p className="mt-3 text-base font-medium text-text-secondary max-w-[360px]">
          Rendez-vous récurrents, détection de conflits, et une vue claire pour le médecin comme pour la secrétaire.
        </p>

        <div className="mt-10 w-full flex flex-col gap-3">
          <button
            onClick={onSignup}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary text-white text-base font-bold shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            Créer mon compte
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          <button
            onClick={onLogin}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white text-primary text-base font-bold border border-border-subtle hover:border-primary hover:bg-bg-soft/50 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            Se connecter
          </button>
        </div>

        <p className="mt-6 text-[13px] font-normal text-text-muted max-w-[340px] leading-relaxed">
          Réservé aux professionnels de santé. Vos dossiers patients ne sont
          visibles que par vous.
        </p>
      </motion.div>
    </div>
  );
}
