import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminApi, ApiError } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Creates another administrator.
 *
 * Unlike a doctor, the password is chosen here rather than generated: an admin
 * is a colleague being onboarded directly, with no matricule-and-temporary-
 * password relay in between.
 */
export default function CreateAdminModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setName(''); setEmail(''); setPassword(''); setError(''); setShowPassword(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Veuillez saisir le nom complet.');
    if (!email.includes('@')) return setError('Veuillez saisir une adresse e-mail valide.');
    if (password.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères.');
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await adminApi.admins.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création du compte impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl p-8 relative"
          >
            <button
              onClick={handleClose}
              className="absolute right-6 top-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>

            <span className="w-12 h-12 rounded-2xl bg-primary/[0.07] grid place-items-center mb-5">
              <ShieldCheck size={22} className="text-primary" strokeWidth={1.75} />
            </span>

            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Ajouter un administrateur
            </h2>
            <p className="text-[13.5px] text-text-secondary font-medium mt-1.5">
              Il aura les mêmes droits que vous sur le back-office.
            </p>

            {error && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                    placeholder="Sonia Ben Salah"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                    placeholder="sonia@shifa.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-widest ml-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px] font-medium bg-bg-soft/30"
                    placeholder="8 caractères minimum"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <p className="text-[12px] text-text-muted font-normal mt-1.5 ml-1">
                  Communiquez-le en personne : il n'est pas affiché après création.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-2xl border border-border-subtle text-[14px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white text-[14px] font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Création…' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
