import { Search, Bell, Home, LayoutGrid, Calendar, Users, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import NavbarClock from './NavbarClock';

export type ViewType = 'dashboard' | 'schedule' | 'patients' | 'settings';

interface NavbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems: { icon: any; label: string; id: ViewType }[] = [
    { icon: Home, label: 'Tableau de bord', id: 'dashboard' },
    { icon: Users, label: 'Patients', id: 'patients' },
    { icon: Calendar, label: 'Planning', id: 'schedule' },
    { icon: Settings, label: 'Paramètres', id: 'settings' },
  ];

  return (
    <nav className="h-20 bg-white shadow-sm border-b border-border-subtle sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto w-full h-full flex items-center justify-between px-10 gap-8">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0"
          onClick={() => onViewChange('dashboard')}
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
            <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
          </div>
          <span className="font-heading font-bold text-2xl text-primary ml-2">ShifaPlus</span>
        </div>

        {/* Nav Items */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              aria-current={currentView === item.id ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-pill text-[15px] font-medium transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-primary/[0.07] text-primary'
                  : 'text-text-secondary hover:bg-bg-soft hover:text-primary'
              }`}
            >
              <item.icon size={17} strokeWidth={1.75} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-5 shrink-0">
          <NavbarClock />

          <div className="hidden md:block h-7 w-px bg-border-subtle" />

          <div className="flex items-center gap-3">
            <button className="p-2.5 text-text-secondary bg-white/30 backdrop-blur-md border border-white/40 rounded-full hover:bg-white/50 hover:text-primary transition-all shadow-sm">
              <Search size={20} />
            </button>
            <button className="p-2.5 text-text-secondary bg-white/30 backdrop-blur-md border border-white/40 rounded-full hover:bg-white/50 hover:text-primary transition-all shadow-sm relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>

          <div className="hidden md:block h-7 w-px bg-border-subtle" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-pill hover:bg-bg-soft transition-all group"
            >
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-text-primary leading-none mb-1">{user?.name}</p>
                <p className="text-[10px] text-text-muted font-medium leading-none">{user?.specialty || 'Médecin'}</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-accent overflow-hidden">
                <img
                  src={user?.avatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <ChevronDown size={16} className={`text-text-muted transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-border-subtle py-2 z-50"
                  >
                    <button className="w-full px-4 py-2 text-left text-sm font-bold text-text-secondary hover:bg-bg-soft hover:text-primary transition-colors flex items-center gap-2">
                      <Users size={16} />
                      Profil
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm font-bold text-text-secondary hover:bg-bg-soft hover:text-primary transition-colors flex items-center gap-2">
                      <Settings size={16} />
                      Paramètres
                    </button>
                    <div className="h-px bg-border-subtle my-2" />
                    <button 
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
