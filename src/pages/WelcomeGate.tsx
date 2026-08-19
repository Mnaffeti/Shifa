import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DemoAccessModal from '../components/DemoAccessModal';
import { demoApi } from '../lib/api';

/**
 * Pre-login gate. The first thing an unauthenticated visitor sees: the
 * ShifaPlus wordmark and a single CTA into the demo. A discreet link lets
 * returning users reach the login page.
 */
interface Props {
  onLogin: () => void;
}

export default function WelcomeGate({ onLogin }: Props) {
  const { refresh } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);

  /**
   * Provisions an isolated demo workspace for this visitor and signs them in.
   *
   * Every visitor gets their own account and their own copy of the two mock
   * patients, so nobody browses or edits another visitor's records. The
   * server issues the session cookie; refreshing auth state picks it up.
   */
  const enterDemo = async ({
    name, phone, specialty,
  }: { name: string; phone: string; specialty: string }) => {
    await demoApi.start({ name, phone, specialty });
    await refresh();
  };

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

        <div className="mt-10 w-full">
          <button
            onClick={() => setDemoOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary text-white text-base font-bold shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            <Sparkles size={18} strokeWidth={2} />
            Découvrir la démo
          </button>
        </div>

        <p className="mt-6 text-sm font-medium text-text-muted">
          Vous avez déjà un compte ?{' '}
          <button onClick={onLogin} className="text-primary font-bold hover:underline">
            Se connecter
          </button>
        </p>
      </motion.div>

      <DemoAccessModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onSubmit={enterDemo}
      />
    </div>
  );
}
