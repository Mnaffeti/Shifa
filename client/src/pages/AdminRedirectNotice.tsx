import { motion } from 'motion/react';
import { ArrowUpRight, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Shown when an ADMIN session reaches the clinical app.
 *
 * Cookies are scoped by host, not by port, so an admin signed in to the back
 * office on :8081 sends that same session here on :8080. There is nothing for
 * them to do in a doctor's workspace, so send them back rather than rendering
 * an empty schedule.
 *
 * VITE_ADMIN_URL lets the deploy point at the real console; the dev port is a
 * sensible default.
 */
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL?.trim() || 'http://localhost:8081';

export default function AdminRedirectNotice() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px]"
      >
        <div className="bg-white rounded-[28px] shadow-card border border-border-subtle p-9 text-center">
          <span className="w-14 h-14 rounded-2xl bg-primary/[0.07] grid place-items-center mx-auto">
            <ShieldCheck size={24} className="text-primary" strokeWidth={1.75} />
          </span>

          <h1 className="text-[22px] font-semibold text-text-primary tracking-tight mt-5">
            Vous êtes connecté en administrateur
          </h1>
          <p className="text-[14px] text-text-muted font-normal leading-relaxed mt-2.5">
            {user?.name} — cet espace est réservé aux médecins. La gestion des
            comptes se fait depuis la console d'administration.
          </p>

          <a
            href={ADMIN_URL}
            className="group w-full h-12 mt-7 inline-flex items-center justify-center gap-2 rounded-[14px] bg-primary text-white text-[14px] font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
          >
            Ouvrir le back-office
            <ArrowUpRight
              size={17}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>

          <button
            onClick={logout}
            className="w-full h-11 mt-2.5 inline-flex items-center justify-center gap-2 rounded-[14px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all"
          >
            <LogOut size={15} strokeWidth={1.75} />
            Se déconnecter
          </button>
        </div>
      </motion.div>
    </div>
  );
}
