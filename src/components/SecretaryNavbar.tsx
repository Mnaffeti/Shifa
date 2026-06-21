import { Bell, LogOut, LayoutDashboard, Calendar, Users, Settings, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NavbarClock from './NavbarClock';

interface SecretaryNavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function SecretaryNavbar({ currentView, onViewChange }: SecretaryNavbarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'schedule', label: 'Planning', icon: Clock },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <nav className="h-20 bg-white border-b border-border-subtle flex items-center justify-between px-10 gap-8 sticky top-0 z-50">
      <div className="flex items-center gap-10 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => onViewChange('dashboard')}>
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
            <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
          </div>
          <span className="font-heading font-bold text-2xl text-primary ml-2">ShifaPlus</span>
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-1.5 bg-accent/20 backdrop-blur-md p-1.5 rounded-pill border border-accent/30 shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`px-5 py-2 rounded-pill text-base font-medium transition-all duration-300 flex items-center gap-2 ${
                currentView === item.id
                  ? 'bg-accent text-primary shadow-md scale-105 backdrop-blur-sm'
                  : 'text-text-muted hover:text-primary hover:bg-white/40'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <NavbarClock />

        <div className="hidden md:block h-7 w-px bg-border-subtle" />

        {/* Notifications */}
        <button className="p-2.5 bg-white/30 backdrop-blur-md border border-white/40 rounded-full text-text-muted hover:text-primary transition-all shadow-sm relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          aria-label="Déconnexion"
          title="Déconnexion"
          className="p-2.5 rounded-full border border-rose-200 bg-rose-50/60 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all shadow-sm"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
