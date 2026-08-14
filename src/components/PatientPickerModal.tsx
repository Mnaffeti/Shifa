import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { usePatients, Patient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Shared patient chooser used by the quick actions (new consultation,
 * new prescription). Scoped to the signed-in doctor's own patients.
 */
export default function PatientPickerModal({
  isOpen, onClose, onSelect,
  title = 'Nouvelle ordonnance',
  subtitle = 'Sélectionnez le patient concerné',
}: Props) {
  const { patients } = usePatients();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const visible = patients
    .filter(p => (user?.role === 'DOCTOR' ? p.assignedDoctor === user.name : true))
    .filter(p =>
      `${p.firstName} ${p.lastName} ${p.id} ${p.phone}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );

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
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-primary text-white">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-xs text-white/70 font-medium">{subtitle}</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher par nom, ID, téléphone..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-pill border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="max-h-[46vh] overflow-y-auto flex flex-col gap-1.5">
                {visible.length === 0 ? (
                  <p className="text-center text-text-muted font-medium py-8">Aucun patient trouvé.</p>
                ) : (
                  visible.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p)}
                      className="hover-row flex items-center gap-3 p-2.5 rounded-2xl border border-transparent text-left transition-all"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border-subtle shrink-0">
                        <img src={p.avatar} alt={p.firstName} referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-[11px] font-medium text-text-muted tabular">{p.id}{p.phone ? ` · ${p.phone}` : ''}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
