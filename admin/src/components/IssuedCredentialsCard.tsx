import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  doctorName: string;
  matricule: string;
  temporaryPassword: string;
  /** 'created' after provisioning, 'reset' after a password reset. */
  variant?: 'created' | 'reset';
  onDone: () => void;
}

/**
 * Shows a matricule + temporary password once, for the admin to relay.
 *
 * The plaintext is never stored, so this is the only moment it can be read —
 * hence the copy button and the deliberate "relay it now" wording.
 */
export default function IssuedCredentialsCard({
  doctorName, matricule, temporaryPassword, variant = 'created', onDone,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = `Matricule : ${matricule}\nMot de passe temporaire : ${temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the admin can still select the text manually.
    }
  };

  return (
    <div>
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 grid place-items-center mb-5">
        <Check size={22} className="text-emerald-600" strokeWidth={2.25} />
      </div>
      <h2 className="text-xl font-bold text-text-primary tracking-tight">
        {variant === 'reset' ? 'Mot de passe réinitialisé' : 'Compte créé'}
      </h2>
      <p className="text-[13.5px] text-text-secondary font-medium mt-1.5">
        {variant === 'reset'
          ? `L'ancien mot de passe de ${doctorName} ne fonctionne plus. Transmettez-lui celui-ci : il devra le changer à sa prochaine connexion.`
          : `Transmettez ces identifiants à ${doctorName}. Il devra changer ce mot de passe à sa première connexion.`}
      </p>

      {/* This value is shown once and never stored — say so plainly. */}
      <p className="mt-3 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[12.5px] font-medium text-amber-800">
        Ce mot de passe ne sera plus affiché. Copiez-le avant de fermer.
      </p>

      <div className="mt-5 bg-bg-soft rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Matricule</span>
          <span className="text-[15px] font-semibold text-text-primary tabular">{matricule}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Mot de passe</span>
          <span className="text-[15px] font-semibold text-text-primary tabular">{temporaryPassword}</span>
        </div>
      </div>

      <button
        onClick={copy}
        className="w-full mt-4 inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-border-subtle bg-white text-[13.5px] font-semibold text-text-secondary hover:border-primary hover:text-primary transition-all"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copié' : 'Copier les identifiants'}
      </button>

      <button
        onClick={onDone}
        className="w-full mt-2.5 h-12 rounded-2xl bg-primary text-white text-[13.5px] font-bold hover:brightness-110 transition-all"
      >
        Terminé
      </button>
    </div>
  );
}
