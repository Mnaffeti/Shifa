import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, Headset, Plus, Check, Clock, Trash2, BellRing } from 'lucide-react';
import { useReminders } from '../context/ReminderContext';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';

const ROLE_META: Record<Exclude<UserRole, 'ADMIN'>, {
  label: string;
  icon: typeof Stethoscope;
  bar: string;
  block: string;
  chip: string;
}> = {
  DOCTOR: {
    label: 'Médecin',
    icon: Stethoscope,
    bar: 'bg-primary',
    block: 'bg-primary text-white',
    chip: 'bg-primary/10 text-primary',
  },
  SECRETARY: {
    label: 'Secrétariat',
    icon: Headset,
    bar: 'bg-amber',
    block: 'bg-amber-100 text-amber-700',
    chip: 'bg-amber-100 text-amber-700',
  },
};

export default function RemindersSection() {
  const { reminders, addReminder, toggleReminder, deleteReminder } = useReminders();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [dueTime, setDueTime] = useState('');

  const openCount = reminders.filter(r => !r.done).length;

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    addReminder({
      text: trimmed,
      dueTime: dueTime || undefined,
      authorRole: user.role,
      authorName: user.name,
    });
    setText('');
    setDueTime('');
  };

  return (
    <section className="hover-card bg-white rounded-[24px] border border-border-subtle p-7">
      {/* Swiss header — strong rule, tracked label, tabular count */}
      <div className="flex items-end justify-between border-b-2 border-primary pb-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BellRing size={20} />
          </span>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Mémo · Poste de travail</p>
            <h2 className="text-2xl font-medium text-text-primary leading-tight tracking-tight">Rappels</h2>
          </div>
        </div>
        <span className="tabular text-4xl font-medium text-primary leading-none">
          {openCount.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-5">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Ajouter un rappel…"
          className="flex-1 px-4 py-2.5 rounded-pill border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
        />
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
          <input
            type="time"
            value={dueTime}
            onChange={e => setDueTime(e.target.value)}
            className="w-[118px] pl-8 pr-2 py-2.5 rounded-pill border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm tabular"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          className="group flex items-center gap-1.5 px-5 py-2.5 rounded-pill bg-accent text-primary font-bold text-sm shadow-md hover:brightness-110 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={17} className="group-hover:rotate-90 transition-transform duration-300" />
          Ajouter
        </button>
      </form>

      {/* List */}
      {reminders.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted font-medium">Aucun rappel pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {reminders.map((r, i) => {
              const meta = ROLE_META[r.authorRole];
              const Icon = meta.icon;
              return (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex items-center gap-4 py-3.5 border-t border-border-subtle first:border-t-0"
                >
                  {/* Author accent bar — the primary Swiss distinguisher */}
                  <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${meta.bar} ${r.done ? 'opacity-30' : ''}`} />

                  {/* Index number — Swiss numbering */}
                  <span className="tabular text-[11px] font-medium text-text-muted/60 w-5 text-right pl-2 shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>

                  {/* Role block */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.block} ${r.done ? 'opacity-40' : ''}`}>
                    <Icon size={17} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${r.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {r.text}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded ${meta.chip}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-medium text-text-muted">{r.authorName}</span>
                      {r.dueTime && (
                        <>
                          <span className="text-text-muted/40 text-[10px]">·</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-muted tabular">
                            <Clock size={10} />
                            {r.dueTime}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Done toggle */}
                  <button
                    onClick={() => toggleReminder(r.id)}
                    title={r.done ? 'Marquer comme non fait' : 'Marquer comme fait'}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      r.done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-border-subtle text-transparent hover:border-primary hover:text-primary/40'
                    }`}
                  >
                    <Check size={15} strokeWidth={3} />
                  </button>

                  {/* Delete on hover */}
                  <button
                    onClick={() => deleteReminder(r.id)}
                    title="Supprimer"
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
