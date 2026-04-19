import React, { useState } from 'react';
import { User, Bell, Clock, Shield, Camera, Mail, Phone, Globe, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { doctor } = useAuth();
  const [activeSection, setActiveSection] = useState('Profil');

  const sections = [
    { id: 'Profil', icon: User, label: 'Profil' },
    { id: 'Notifications', icon: Bell, label: 'Notifications' },
    { id: 'Working Hours', icon: Clock, label: 'Horaires' },
    { id: 'Security', icon: Shield, label: 'Sécurité' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-text-primary font-heading">Paramètres</h1>

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
            {activeSection === 'Profil' && <ProfileSettings doctor={doctor} />}
            {activeSection === 'Notifications' && <NotificationSettings />}
            {activeSection === 'Horaires' && <WorkingHoursSettings />}
            {activeSection === 'Sécurité' && <SecuritySettings />}
          </div>
          
          <div className="px-8 py-6 bg-[#F9FAFB] border-t border-border-subtle flex justify-end">
            <button className="flex items-center gap-2 bg-accent text-primary px-8 py-3 rounded-pill font-bold shadow-md hover:brightness-110 transition-all active:scale-95">
              <Save size={20} />
              Enregistrer
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
          <p className="text-text-secondary font-medium">Spécialiste en Cardiologie</p>
          <p className="text-xs text-text-muted mt-2">Membre depuis oct. 2023</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Nom complet</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="text" defaultValue={doctor?.name} className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Spécialité</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="text" defaultValue="Cardiologie" className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Adresse Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="email" defaultValue={doctor?.email} className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Numéro de téléphone</label>
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
  const [settings, setSettings] = useState([
    { key: 'email', label: 'Email', desc: 'Alertes par email pour les nouveaux rendez-vous.' },
    { key: 'app', label: 'App', desc: 'Notifications push pour les nouveaux rendez-vous.' },
    { key: 'sms', label: 'SMS', desc: 'Alertes SMS pour les nouveaux rendez-vous.' },
    { key: 'reminders', label: 'Rappels', desc: 'Rappels automatiques de rendez-vous.' }
  ]);
  const [enabledSettings, setEnabledSettings] = useState<Record<string, boolean>>({
    email: true,
    app: true,
    sms: false,
    reminders: true
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-text-primary">Préférences de notification</h3>
      <div className="space-y-4">
        {settings.map((s) => (
          <div key={s.key} className="flex items-center justify-between p-4 bg-bg-soft rounded-2xl border border-border-subtle">
            <div>
              <p className="text-sm font-bold text-text-primary capitalize">{s.label}</p>
              <p className="text-xs text-text-secondary">{s.desc}</p>
            </div>
            <button 
              onClick={() => setEnabledSettings(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
              className={`w-12 h-6 rounded-full transition-all relative ${enabledSettings[s.key] ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabledSettings[s.key] ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkingHoursSettings() {
  const days = [
    { en: 'Monday', fr: 'Lundi' },
    { en: 'Tuesday', fr: 'Mardi' },
    { en: 'Wednesday', fr: 'Mercredi' },
    { en: 'Thursday', fr: 'Jeudi' },
    { en: 'Friday', fr: 'Vendredi' },
    { en: 'Saturday', fr: 'Samedi' },
    { en: 'Sunday', fr: 'Dimanche' }
  ];
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-text-primary">Disponibilité</h3>
      <div className="space-y-3">
        {days.map(day => (
          <div key={day.en} className="flex items-center justify-between p-4 bg-bg-soft rounded-2xl border border-border-subtle">
            <span className="text-sm font-bold text-text-primary w-24">{day.fr}</span>
            <div className="flex items-center gap-4">
              <input type="time" defaultValue="08:00" className="px-3 py-1.5 rounded-lg border border-border-subtle text-sm font-medium" />
              <span className="text-text-muted">à</span>
              <input type="time" defaultValue="20:00" className="px-3 py-1.5 rounded-lg border border-border-subtle text-sm font-medium" />
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ 
                  backgroundColor: day.en === 'Sunday' ? '#9A9A9A' : '#1A6B5A' 
                }} 
              />
              <span className="text-[13px] font-normal text-text-primary">
                {day.en === 'Sunday' ? 'Fermé' : 'Ouvert'}
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
      <h3 className="text-lg font-bold text-text-primary">Changer le mot de passe</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Mot de passe actuel</label>
          <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Nouveau mot de passe</label>
          <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Confirmer le nouveau mot de passe</label>
          <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
      </div>
    </div>
  );
}
