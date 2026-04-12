import { Search, Bell, Home, LayoutGrid, Calendar, Users, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export type ViewType = 'dashboard' | 'schedule' | 'patients' | 'settings';

interface NavbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems: { icon: any; label: string; id: ViewType }[] = [
    { icon: Home, label: 'Dashboard', id: 'dashboard' },
    { icon: Calendar, label: 'Schedule', id: 'schedule' },
    { icon: Users, label: 'Patients', id: 'patients' },
    { icon: Settings, label: 'Settings', id: 'settings' },
  ];

  return (
    <nav className="h-16 bg-white shadow-sm border-b border-border-subtle sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto w-full h-full flex items-center justify-between px-8">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => onViewChange('dashboard')}
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
            <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
          </div>
          <span className="font-heading font-bold text-2xl text-primary ml-2">Shifa</span>
        </div>

        {/* Nav Items */}
        <div className="hidden md:flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-pill">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-medium transition-all ${
                currentView === item.id
                  ? 'bg-accent text-primary shadow-sm'
                  : 'text-text-secondary hover:bg-white/50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-text-secondary hover:bg-bg-soft rounded-full transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-text-secondary hover:bg-bg-soft rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-pill hover:bg-bg-soft transition-all group"
            >
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-text-primary leading-none mb-1">{user?.name}</p>
                <p className="text-[10px] text-text-muted font-medium leading-none">{user?.specialty || 'Doctor'}</p>
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
                      Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm font-bold text-text-secondary hover:bg-bg-soft hover:text-primary transition-colors flex items-center gap-2">
                      <Settings size={16} />
                      Settings
                    </button>
                    <div className="h-px bg-border-subtle my-2" />
                    <button 
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
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
