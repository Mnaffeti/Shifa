import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ChevronRight, Layers, Plus, Search, X } from 'lucide-react';
import {
  CATEGORY_LABELS, PrescriptionTemplate, TemplateCategory, TemplateLine,
  searchTemplates,
} from '../lib/prescriptionTemplates';
import type { Allergy } from '../context/ChartContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Appends the template's lines to the current prescription. */
  onApply: (items: TemplateLine[]) => void;
  /** Checked against each template so conflicts are flagged before applying. */
  allergies: Allergy[];
}

/** Templates whose medication names collide with a recorded allergy. */
function conflictsFor(template: PrescriptionTemplate, allergies: Allergy[]): Allergy[] {
  return allergies.filter(a =>
    template.items.some(i =>
      i.medication.toLowerCase().includes(a.substance.toLowerCase().split(' ')[0]),
    ),
  );
}

export default function PrescriptionTemplatePicker({
  isOpen, onClose, onApply, allergies,
}: Props) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const results = searchTemplates(query);
    const map = new Map<TemplateCategory, PrescriptionTemplate[]>();
    for (const t of results) {
      const list = map.get(t.category);
      if (list) list.push(t);
      else map.set(t.category, [t]);
    }
    return map;
  }, [query]);

  const total = useMemo(
    () => [...grouped.values()].reduce((n, list) => n + list.length, 0),
    [grouped],
  );

  const apply = (template: PrescriptionTemplate) => {
    onApply(template.items);
    onClose();
    setQuery('');
    setExpanded(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[8vh]">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            role="dialog"
            aria-modal="true"
            aria-label="Modèles d'ordonnance"
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Head */}
            <div className="px-6 py-5 border-b border-border-subtle flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-2xl bg-primary/5 grid place-items-center shrink-0">
                  <Layers size={18} className="text-primary" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="text-[19px] font-semibold text-text-primary tracking-tight">
                    Modèles d'ordonnance
                  </h2>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">
                    Ajoutez un traitement type, puis ajustez-le au patient
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="p-1.5 rounded-full text-text-muted hover:bg-bg-soft hover:text-primary transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-border-subtle shrink-0">
              <div className="relative">
                <Search
                  size={17}
                  strokeWidth={1.75}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher : grippe, céphalées, paracétamol..."
                  className="w-full h-11 pl-11 pr-4 rounded-[14px] bg-bg-soft/60 border border-border-subtle text-[14px] font-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto px-6 py-4 flex-1">
              {total === 0 ? (
                <p className="text-center text-[13px] text-text-muted font-normal py-10">
                  Aucun modèle ne correspond à « {query} ».
                </p>
              ) : (
                [...grouped.entries()].map(([category, templates]) => (
                  <section key={category} className="mb-5 last:mb-0">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-2">
                      {CATEGORY_LABELS[category]}
                    </h3>

                    <div className="flex flex-col gap-2">
                      {templates.map(t => {
                        const conflicts = conflictsFor(t, allergies);
                        const isOpen = expanded === t.id;

                        return (
                          <div
                            key={t.id}
                            className="rounded-[16px] border border-border-subtle bg-white overflow-hidden transition-colors hover:border-accent"
                          >
                            <div className="flex items-center gap-3 p-3.5">
                              <button
                                onClick={() => setExpanded(isOpen ? null : t.id)}
                                aria-expanded={isOpen}
                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                              >
                                <ChevronRight
                                  size={15}
                                  strokeWidth={2}
                                  className={`text-text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                />
                                <span className="min-w-0">
                                  <span className="block text-[14.5px] font-semibold text-text-primary tracking-tight truncate">
                                    {t.name}
                                  </span>
                                  <span className="block text-[12px] text-text-muted font-normal truncate">
                                    {t.summary} · {t.items.length} médicament{t.items.length > 1 ? 's' : ''}
                                  </span>
                                </span>
                              </button>

                              {conflicts.length > 0 && (
                                <span
                                  title={`Allergie : ${conflicts.map(c => c.substance).join(', ')}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-100 text-[10.5px] font-medium text-rose-700 shrink-0"
                                >
                                  <AlertTriangle size={11} strokeWidth={2} />
                                  Allergie
                                </span>
                              )}

                              <button
                                onClick={() => apply(t)}
                                className="group inline-flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-full bg-primary text-white text-[12.5px] font-semibold shrink-0 hover:brightness-110 transition-all active:scale-[0.98]"
                              >
                                <Plus
                                  size={14}
                                  strokeWidth={2.5}
                                  className="transition-transform duration-300 group-hover:rotate-90"
                                />
                                Ajouter
                              </button>
                            </div>

                            {/* Preview of the exact lines that will be inserted */}
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden border-t border-border-subtle bg-bg-soft/40"
                                >
                                  <div className="p-3.5 flex flex-col gap-2">
                                    {t.items.map((item, i) => (
                                      <div key={i} className="text-[12.5px]">
                                        <p className="font-semibold text-text-primary">
                                          {item.medication}
                                        </p>
                                        <p className="text-text-secondary font-normal">
                                          {item.dosage} · {item.frequency} · {item.duration}
                                        </p>
                                        {item.instructions && (
                                          <p className="text-text-muted font-normal italic mt-0.5">
                                            {item.instructions}
                                          </p>
                                        )}
                                      </div>
                                    ))}

                                    {t.note && (
                                      <p className="text-[11.5px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mt-1">
                                        {t.note}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            {/* Foot */}
            <div className="px-6 py-3 border-t border-border-subtle bg-bg-soft/40 shrink-0">
              <p className="text-[11.5px] text-text-muted font-normal">
                Les modèles sont des points de départ : vérifiez posologie, durée et
                contre-indications avant de signer.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
