import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ChevronRight, User, Stethoscope } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'signup';
type Role = 'SECRETARY' | 'DOCTOR';

const SPECIALTIES = [
  'Médecine générale',
  'Cardiologie',
  'Dermatologie',
  'Gynécologie',
  'Pédiatrie',
  'Neurologie',
  'Ophtalmologie',
  'ORL',
  'Orthopédie',
  'Psychiatrie',
  'Radiologie',
  'Endocrinologie',
  'Gastro-entérologie',
  'Pneumologie',
  'Autre',
];

export default function LoginPage() {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('doctor@shifa.com');
  const [password, setPassword] = useState('doctor123');
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('DOCTOR');

  const isSignup = mode === 'signup';

  const setCredentials = (role: Role) => {
    setSelectedRole(role);
    if (mode === 'login') {
      if (role === 'SECRETARY') {
        setEmail('secretary@shifa.com');
        setPassword('secretary123');
      } else {
        setEmail('doctor@shifa.com');
        setPassword('doctor123');
      }
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    if (next === 'signup') {
      setEmail('');
      setPassword('');
      setName('');
    } else {
      setCredentials(selectedRole);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      if (!name.trim()) return setError('Veuillez saisir votre nom complet.');
      if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');

      const res = signup({
        name,
        email,
        password,
        role: selectedRole,
        specialty: selectedRole === 'DOCTOR' ? specialty : undefined,
      });
      if (!res.ok) setError(res.error || "Échec de l'inscription.");
      return;
    }

    const success = login(email, password);
    if (!success) setError('Identifiants invalides');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[32px] shadow-2xl border border-white/20 p-8 lg:p-12 relative overflow-hidden">
          {/* Decorative background element inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-[#1A9E9E] rotate-45 rounded-sm opacity-80" />
                <div className="absolute inset-0 bg-[#C8E04A] -rotate-12 rounded-sm opacity-80 translate-x-1" />
              </div>
              <span className="font-heading font-bold text-3xl text-primary ml-2">ShifaPlus</span>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2 font-heading tracking-tight leading-tight">
                {isSignup ? 'Créer un compte' : 'Bon retour'}
              </h1>
              <p className="text-base font-medium text-text-secondary">
                {isSignup
                  ? 'Sélectionnez votre rôle et renseignez vos informations.'
                  : 'Veuillez sélectionner votre rôle et vous connecter.'}
              </p>
            </div>

            {/* Role Selection */}
            <div className="flex p-1 bg-bg-soft rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => setCredentials('DOCTOR')}
                className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${
                  selectedRole === 'DOCTOR'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Médecin
              </button>
              <button
                type="button"
                onClick={() => setCredentials('SECRETARY')}
                className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${
                  selectedRole === 'SECRETARY'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Secrétaire
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3"
              >
                <div className="w-1 h-5 bg-red-600 rounded-full" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full name — signup only */}
              {isSignup && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30"
                      placeholder={selectedRole === 'DOCTOR' ? 'Youssef Ben Ali' : 'Foulena Trabelsi'}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Specialty — signup + doctor only */}
              {isSignup && selectedRole === 'DOCTOR' && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Spécialité</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted z-10" size={20} />
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30 appearance-none cursor-pointer"
                      required
                    >
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30"
                    placeholder="medecin@shifa.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember me / forgot — login only */}
              {!isSignup && (
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-border-subtle rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all" />
                      <svg className="absolute w-3 h-3 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-text-secondary group-hover:text-primary transition-colors">Se souvenir de moi</span>
                  </label>
                  <a href="#" className="text-sm font-bold text-primary hover:underline">Mot de passe oublié ?</a>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg mt-4"
              >
                {isSignup ? "S'inscrire" : 'Se connecter'}
                <ChevronRight size={22} />
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-8 text-text-secondary text-sm font-medium">
          {isSignup ? (
            <>Vous avez déjà un compte ? <button onClick={() => switchMode('login')} className="text-primary font-bold hover:underline">Se connecter</button></>
          ) : (
            <>Vous n'avez pas de compte ? <button onClick={() => switchMode('signup')} className="text-primary font-bold hover:underline">Créer un compte</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
}
