import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  doctorName: string;
  matricule: string;
  temporaryPassword: string;
  onDone: () => void;
}

/** Shows a freshly generated matricule + temporary password once, for the admin to relay. */
export default function IssuedCredentialsCard({ doctorName, matricule, temporaryPassword, onDone }: Props) {
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
      <h2 className="text-xl font-bold text-text-primary tracking-tight">Compte créé</h2>
      <p className="text-[13.5px] text-text-secondary font-medium mt-1.5">
        Transmettez ces identifiants à {doctorName}. Il devra changer ce mot de passe à sa première connexion.
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
