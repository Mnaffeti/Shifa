import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ChevronRight, IdCard, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await login(identifier.trim(), password);
      if (!res.ok) setError(res.error || 'Identifiants invalides');
    } finally {
      setIsSubmitting(false);
    }
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
                Bon retour
              </h1>
              <p className="text-base font-medium text-text-secondary">
                {isAdmin ? 'Connexion administrateur.' : 'Connectez-vous avec votre matricule.'}
              </p>
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
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-widest ml-1">
                  {isAdmin ? 'Adresse Email' : 'Matricule'}
                </label>
                <div className="relative">
                  {isAdmin ? (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  ) : (
                    <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  )}
                  <input
                    type={isAdmin ? 'email' : 'text'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium bg-bg-soft/30"
                    placeholder={isAdmin ? 'admin@shifa.com' : 'DOC-0001'}
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
                    autoComplete="current-password"
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
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? 'Connexion…' : 'Se connecter'}
                <ChevronRight size={22} />
              </button>
            </form>

            {!isAdmin && (
              <p className="text-center mt-6 text-text-secondary text-xs font-medium">
                Votre matricule et votre mot de passe vous sont fournis par votre administration.
              </p>
            )}

            <button
              type="button"
              onClick={() => { setIsAdmin(!isAdmin); setIdentifier(''); setError(''); }}
              className="w-full mt-4 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-text-muted hover:text-primary transition-colors"
            >
              <ShieldCheck size={14} />
              {isAdmin ? 'Connexion médecin' : 'Connexion administrateur'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
