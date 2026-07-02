import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePatients, Patient } from '../context/PatientContext';

// ─── Form model ─────────────────────────────────────────────────────────────

export type PatientFormData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  profession: string;
  cin: string;
  assignedDoctor: string;
  bloodType: string;
};

const EMPTY_FORM: PatientFormData = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'Homme',
  phone: '',
  email: '',
  address: '',
  profession: '',
  cin: '',
  assignedDoctor: 'Dr. Youssef',
  bloodType: 'A+'
};

function patientToForm(p: Patient): PatientFormData {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    dob: p.dob,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    address: p.address,
    profession: p.profession || '',
    cin: p.cin || '',
    assignedDoctor: p.assignedDoctor,
    bloodType: p.bloodType
  };
}

// ─── Date input helpers (DD/MM/YYYY) ────────────────────────────────────────

/** Convert stored ISO (YYYY-MM-DD) to display format DD/MM/YYYY. */
function isoToFr(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Mask raw keystrokes into DD/MM/YYYY: keep digits only, auto-insert slashes. */
function maskDateFr(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Validate a DD/MM/YYYY string. Returns an error message, or '' when valid. */
function validateDateFr(val: string): string {
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return 'Format invalide (JJ/MM/AAAA)';
  const day = +m[1], month = +m[2], year = +m[3];
  if (month < 1 || month > 12) return 'Mois invalide (01–12)';
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return `Jour invalide (01–${daysInMonth})`;
  if (year < 1900) return 'Année invalide';
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return 'La date ne peut pas être dans le futur';
  return '';
}

// ─── Shared Add/Edit Modal ──────────────────────────────────────────────────

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  patient?: Patient;
}

export default function PatientFormModal({ isOpen, onClose, mode, patient }: PatientFormModalProps) {
  const { addPatient, updatePatient } = usePatients();
  const [formData, setFormData] = useState<PatientFormData>(
    mode === 'edit' && patient ? patientToForm(patient) : EMPTY_FORM
  );
  // Display value for the date field (DD/MM/YYYY); formData.dob stays ISO.
  const [dobInput, setDobInput] = useState(
    mode === 'edit' && patient ? isoToFr(patient.dob) : ''
  );
  const [dobError, setDobError] = useState('');

  // Sync when the patient prop changes (different patient opened for edit)
  React.useEffect(() => {
    if (isOpen) {
      const init = mode === 'edit' && patient ? patientToForm(patient) : EMPTY_FORM;
      setFormData(init);
      setDobInput(init.dob ? isoToFr(init.dob) : '');
      setDobError('');
    }
  }, [isOpen, patient, mode]);

  const set = (field: keyof PatientFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDateFr(e.target.value);
    setDobInput(masked);
    const err = masked.length === 10 ? validateDateFr(masked) : '';
    setDobError(err);
    if (!err && masked.length === 10) {
      const [d, mo, y] = masked.split('/');
      setFormData(prev => ({ ...prev, dob: `${y}-${mo}-${d}` }));
    } else {
      setFormData(prev => ({ ...prev, dob: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateDateFr(dobInput);
    if (err) {
      setDobError(err);
      return;
    }
    if (mode === 'add') {
      addPatient(formData);
    } else if (patient) {
      updatePatient(patient.id, formData);
    }
    onClose();
  };

  // Prevent Enter from submitting when a non-submit field is focused and fields aren't filled
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'BUTTON') {
        e.preventDefault();
      }
    }
  };

  const title = mode === 'add' ? 'Ajouter un nouveau patient' : 'Modifier le patient';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-primary text-white">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-8 grid grid-cols-2 gap-6">
              {/* Prénom */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={set('firstName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={set('lastName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dobInput}
                  onChange={handleDobChange}
                  onBlur={() => setDobError(dobInput ? validateDateFr(dobInput) : '')}
                  placeholder="JJ/MM/AAAA"
                  maxLength={10}
                  aria-invalid={!!dobError}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${
                    dobError
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-border-subtle focus:ring-primary/20'
                  }`}
                  required
                />
                {dobError && (
                  <p className="mt-1 text-xs font-medium text-red-500">{dobError}</p>
                )}
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Genre</label>
                <select
                  value={formData.gender}
                  onChange={set('gender')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </div>

              {/* Téléphone — optional */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={set('phone')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Email — optional */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={set('email')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Adresse — optional */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={set('address')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* CIN — numéro carte d'identité */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">CIN (N° carte d'identité)</label>
                <input
                  type="text"
                  value={formData.cin}
                  onChange={set('cin')}
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Profession */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Profession</label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={set('profession')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Groupe sanguin */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Groupe sanguin</label>
                <select
                  value={formData.bloodType}
                  onChange={set('bloodType')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                    <option key={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="col-span-2 pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-border-subtle font-bold text-text-secondary hover:bg-bg-soft transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-accent text-primary font-bold shadow-lg hover:brightness-110 transition-all active:scale-95"
                >
                  {mode === 'add' ? 'Sauvegarder Patient' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
