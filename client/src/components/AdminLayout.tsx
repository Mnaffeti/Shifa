import { type ReactNode } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Shell for the admin console.
 *
 * Deliberately separate from the clinical navbar: an admin has no patients,
 * schedule or consultations, so showing those tabs would only lead to empty
 * or forbidden views.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/10 selection:text-primary">
      <nav className="h-20 bg-white shadow-sm border-b border-border-subtle sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto w-full h-full flex items-center justify-between px-10 gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
              <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
            </div>
            <span className="font-heading font-bold text-2xl text-primary ml-2">ShifaPlus</span>
            <span className="inline-flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-primary/[0.08] border border-primary/15 text-[11px] font-semibold text-primary uppercase tracking-wider">
              <ShieldCheck size={12} strokeWidth={2.25} />
              Admin
            </span>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-text-primary leading-none mb-1">{user?.name}</p>
              <p className="text-[10px] text-text-muted font-medium leading-none">Administrateur</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-medium text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut size={16} strokeWidth={1.75} />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8">{children}</main>

      <footer className="py-8 px-8 text-center text-text-muted text-xs font-medium">
        © 2026 ShifaPlus Hospital Management System. All rights reserved.
      </footer>
    </div>
  );
}
