import { type ReactNode } from 'react';
import { LogOut, ShieldCheck, Stethoscope, Inbox, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AdminView = 'doctors' | 'requests' | 'activity';

const NAV: { id: AdminView; label: string; icon: typeof Stethoscope }[] = [
  { id: 'doctors', label: 'Médecins', icon: Stethoscope },
  { id: 'requests', label: 'Demandes', icon: Inbox },
  { id: 'activity', label: 'Activité', icon: Activity },
];

interface Props {
  children: ReactNode;
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  /** Count of pending requests, surfaced as a badge on the Demandes tab. */
  pendingCount?: number;
}

/**
 * Shell for the admin console.
 *
 * Deliberately separate from the clinical navbar: an admin has no patients,
 * schedule or consultations, so showing those tabs would only lead to empty
 * or forbidden views.
 */
export default function AdminLayout({
  children, currentView, onViewChange, pendingCount = 0,
}: Props) {
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

          {/* Active pill uses the brand accent, as in the doctor app's navbar. */}
          <div className="hidden md:flex items-center gap-1.5">
            {NAV.map(item => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`group inline-flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-accent text-primary'
                      : 'text-text-secondary hover:bg-bg-soft hover:text-primary'
                  }`}
                >
                  <item.icon size={16} strokeWidth={1.75} />
                  {item.label}
                  {item.id === 'requests' && pendingCount > 0 && (
                    <span className={`tabular min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full text-[11px] font-semibold ${
                      active ? 'bg-primary text-white' : 'bg-warn/15 text-warn'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
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

        {/* Narrow screens: the tabs move below the brand row. */}
        <div className="md:hidden flex items-center gap-1.5 px-6 pb-3 -mt-2 overflow-x-auto">
          {NAV.map(item => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill text-[13px] font-medium whitespace-nowrap transition-all ${
                  active ? 'bg-accent text-primary' : 'text-text-secondary hover:bg-bg-soft'
                }`}
              >
                <item.icon size={14} strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8">{children}</main>

      <footer className="py-8 px-8 text-center text-text-muted text-xs font-medium">
        © 2026 ShifaPlus Hospital Management System. All rights reserved.
      </footer>
    </div>
  );
}
