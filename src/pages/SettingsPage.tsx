import React, { useState } from 'react';
import { User, Bell, Clock, Shield, Camera, Mail, Phone, Globe, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { doctor } = useAuth();
  const [activeSection, setActiveSection] = useState('Profile');

  const sections = [
    { id: 'Profile', icon: User, label: 'Profile' },
    { id: 'Notifications', icon: Bell, label: 'Notifications' },
    { id: 'Working Hours', icon: Clock, label: 'Working Hours' },
    { id: 'Security', icon: Shield, label: 'Security' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-text-primary font-heading">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <div className="flex flex-col gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeSection === section.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white text-text-secondary hover:bg-bg-soft border border-border-subtle'
              }`}
            >
              <section.icon size={20} />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden">
          <div className="p-8">
            {activeSection === 'Profile' && <ProfileSettings doctor={doctor} />}
            {activeSection === 'Notifications' && <NotificationSettings />}
            {activeSection === 'Working Hours' && <WorkingHoursSettings />}
            {activeSection === 'Security' && <SecuritySettings />}
          </div>
          
          <div className="px-8 py-6 bg-[#F9FAFB] border-t border-border-subtle flex justify-end">
            <button className="flex items-center gap-2 bg-accent text-primary px-8 py-3 rounded-pill font-bold shadow-md hover:brightness-110 transition-all active:scale-95">
              <Save size={20} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ doctor }: any) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-4 border-accent overflow-hidden shadow-xl">
            <img src={doctor?.avatar} alt={doctor?.name} className="w-full h-full object-cover" />
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
            <Camera size={18} />
          </button>
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-1">{doctor?.name}</h3>
          <p className="text-text-secondary font-medium">Specialist in Cardiology</p>
          <p className="text-xs text-text-muted mt-2">Member since Oct 2023</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="text" defaultValue={doctor?.name} className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Specialty</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="text" defaultValue="Cardiology" className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="email" defaultValue={doctor?.email} className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="tel" defaultValue="+1 (555) 000-1234" className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    email: true,
    app: true,
    sms: false,
    reminders: true
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-text-primary">Notification Preferences</h3>
      <div className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-bg-soft rounded-2xl border border-border-subtle">
            <div>
              <p className="text-sm font-bold text-text-primary capitalize">{key} Alerts</p>
              <p className="text-xs text-text-secondary">Receive {key} notifications for new appointments.</p>
            </div>
            <button 
              onClick={() => setSettings(prev => ({ ...prev, [key]: !value }))}
              className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkingHoursSettings() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-text-primary">Availability</h3>
      <div className="space-y-3">
        {days.map(day => (
          <div key={day} className="flex items-center justify-between p-4 bg-bg-soft rounded-2xl border border-border-subtle">
            <span className="text-sm font-bold text-text-primary w-24">{day}</span>
            <div className="flex items-center gap-4">
              <input type="time" defaultValue="08:00" className="px-3 py-1.5 rounded-lg border border-border-subtle text-sm font-medium" />
              <span className="text-text-muted">to</span>
              <input type="time" defaultValue="20:00" className="px-3 py-1.5 rounded-lg border border-border-subtle text-sm font-medium" />
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ 
                  backgroundColor: day === 'Sunday' ? '#9A9A9A' : '#1A6B5A' 
                }} 
              />
              <span className="text-[13px] font-normal text-text-primary">
                {day === 'Sunday' ? 'Closed' : 'Open'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6 max-w-md">
      <h3 className="text-lg font-bold text-text-primary">Change Password</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Current Password</label>
          <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">New Password</label>
          <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Confirm New Password</label>
          <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
      </div>
    </div>
  );
}
