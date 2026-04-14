import { Search, Bell, LogOut, LayoutDashboard, Calendar, Users, Settings, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

interface SecretaryNavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function SecretaryNavbar({ currentView, onViewChange }: SecretaryNavbarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="h-20 bg-white border-b border-border-subtle flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="flex items-center gap-12">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('dashboard')}>
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
            <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
          </div>
          <span className="font-heading font-bold text-2xl text-primary ml-2">ShifaPlus</span>
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-1 bg-accent/20 backdrop-blur-md p-1 rounded-pill border border-accent/30 shadow-sm">
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

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden lg:block w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search patients, doctors..." 
            className="w-full pl-12 pr-4 py-2.5 bg-white/30 backdrop-blur-md border border-white/40 rounded-pill text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium shadow-sm"
          />
        </div>

        {/* Notifications */}
        <button className="p-2.5 bg-white/30 backdrop-blur-md border border-white/40 rounded-full text-text-muted hover:text-primary transition-all shadow-sm relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-border-subtle group relative">
          <div className="text-right">
            <p className="text-sm font-bold text-text-primary leading-none mb-1">{user?.name}</p>
            <span className="px-2 py-0.5 bg-gray-100 text-text-muted text-[10px] font-bold rounded-full uppercase tracking-wider">
              Secretary
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-bg-soft overflow-hidden border-2 border-white shadow-sm cursor-pointer">
            <img src={user?.avatar} alt="Profile" referrerPolicy="no-referrer" />
          </div>

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-border-subtle py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
            <button 
              onClick={logout}
              className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
