import React, { useEffect, useState } from 'react';
import { User, Bell, Clock, Shield, IdCard, Phone, Stethoscope, Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SPECIALTIES } from '../lib/specialties';

export default function SettingsPage() {
  const { user } = useAuth();
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
            {activeSection === 'Profil' && <ProfileSettings />}
            {activeSection === 'Notifications' && <NotificationSettings />}
            {activeSection === 'Horaires' && <WorkingHoursSettings />}
            {activeSection === 'Sécurité' && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [specialty, setSpecialty] = useState(user?.specialty ?? SPECIALTIES[0]);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Re-sync if the session user changes (e.g. after a fresh /me probe).
  useEffect(() => {
    setName(user?.name ?? '');
    setSpecialty(user?.specialty ?? SPECIALTIES[0]);
    setPhone(user?.phone ?? '');
  }, [user?.name, user?.specialty, user?.phone]);

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return setError('Le nom ne peut pas être vide.');
    if (phone.replace(/[^\d]/g, '').length < 8) {
      return setError('Veuillez saisir un numéro de téléphone valide.');
    }

    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await updateProfile({ name: name.trim(), specialty, phone: phone.trim() });
      if (!res.ok) {
        setError(res.error || 'Échec de l\'enregistrement.');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-8">
        <div className="w-32 h-32 rounded-full border-4 border-accent overflow-hidden shadow-xl shrink-0">
          <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-1">{user?.name}</h3>
          <p className="text-text-secondary font-medium">{user?.specialty || 'Médecin'}</p>
        </div>
      </div>

      {error && (
        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Nom complet</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Spécialité</label>
          <div className="relative">
            <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted z-10" size={18} />
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Matricule</label>
          <div className="relative">
            <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              value={user?.matricule ?? ''}
              disabled
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle bg-bg-soft/50 text-text-muted outline-none cursor-not-allowed"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Numéro de téléphone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-border-subtle -mx-8 px-8 pb-0">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-6 flex items-center gap-2 bg-accent text-primary px-8 py-3 rounded-pill font-bold shadow-md hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saved ? <Check size={20} /> : <Save size={20} />}
          {isSaving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const settings = [
    { key: 'email', label: 'Email', desc: 'Alertes par email pour les nouveaux rendez-vous.' },
    { key: 'app', label: 'App', desc: 'Notifications push pour les nouveaux rendez-vous.' },
    { key: 'sms', label: 'SMS', desc: 'Alertes SMS pour les nouveaux rendez-vous.' },
    { key: 'reminders', label: 'Rappels', desc: 'Rappels automatiques de rendez-vous.' }
  ];
  const enabledSettings: Record<string, boolean> = {
    email: true,
    app: true,
    sms: false,
    reminders: true
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary">Préférences de notification</h3>
        <p className="text-xs text-text-muted font-medium mt-1">Bientôt disponible.</p>
      </div>
      <div className="space-y-4">
        {settings.map((s) => (
          <div key={s.key} className="flex items-center justify-between p-4 bg-bg-soft rounded-2xl border border-border-subtle opacity-60">
            <div>
              <p className="text-sm font-bold text-text-primary capitalize">{s.label}</p>
              <p className="text-xs text-text-secondary">{s.desc}</p>
            </div>
            <button
              disabled
              title="Bientôt disponible"
              className={`w-12 h-6 rounded-full relative cursor-not-allowed ${enabledSettings[s.key] ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full ${enabledSettings[s.key] ? 'right-1' : 'left-1'}`} />
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
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    if (!currentPassword) {
      return setError('Veuillez saisir votre mot de passe actuel.');
    }

    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await changePassword(newPassword, currentPassword);
      if (!res.ok) {
        setError(res.error || 'Échec du changement de mot de passe.');
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <h3 className="text-lg font-bold text-text-primary">Changer le mot de passe</h3>

      {error && (
        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Mot de passe actuel</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Nouveau mot de passe</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-secondary uppercase">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="flex items-center gap-2 bg-accent text-primary px-8 py-3 rounded-pill font-bold shadow-md hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saved ? <Check size={20} /> : <Save size={20} />}
        {isSaving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
      </button>
    </form>
  );
}
