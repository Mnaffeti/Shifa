import { Plus, Stethoscope, UserPlus, FileText } from 'lucide-react';
import { Appointment } from '../context/AppointmentContext';
import { useTick } from '../lib/useTick';
import { longDate, toMinutes, nowMinutes, relativeFromNow, ymd } from '../lib/datetime';

export type QuickAction = 'quick' | 'patient' | 'rdv' | 'ordonnance';

interface Props {
  name?: string;
  appointments: Appointment[];
  onAction: (a: QuickAction) => void;
}

const SECONDARY_ACTIONS: { id: QuickAction; label: string; icon: any }[] = [
  { id: 'quick', label: 'Consultation rapide', icon: Stethoscope },
  { id: 'patient', label: 'Ajouter patient', icon: UserPlus },
  { id: 'ordonnance', label: 'Nouvelle ordonnance', icon: FileText },
];

/** Sticky header: greeting inline with date + live next-patient, then the action bar. */
export default function DashboardHeader({ name, appointments, onAction }: Props) {
  useTick();

  const now = nowMinutes();
  const today = ymd();
  const nextApt = appointments
    .filter(a => a.date === today && a.status !== 'Cancelled' && a.status !== 'Completed' && toMinutes(a.startTime) > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  const nextLabel = nextApt
    ? `Prochain patient ${relativeFromNow(toMinutes(nextApt.startTime) - now)}`
    : 'Aucun patient à venir';

  const firstName = name?.replace(/^Dr\.?\s*/i, '').split(' ')[0] ?? '';

  return (
    <div className="sticky top-4 z-30">
      <div className="flex items-center justify-between gap-4 h-16 px-6 rounded-[24px] bg-white/70 border border-white/60 shadow-card backdrop-blur-xl">
        {/* Greeting + date + next patient */}
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="font-heading text-[20px] font-semibold text-text-primary tracking-tight shrink-0 inline-flex items-center gap-1.5">
            <span className="wave origin-[70%_70%]">👋</span>
            Bonjour{firstName ? `, ${firstName}` : ''}
          </h1>
          <span className="text-text-muted/50">·</span>
          <p className="text-sm font-medium text-text-secondary truncate tabular">
            <span className="capitalize">{longDate(new Date())}</span>
            <span className="text-text-muted/50 mx-1.5">·</span>
            <span className={nextApt ? 'text-[var(--color-info)] font-semibold' : 'text-text-muted'}>{nextLabel}</span>
          </p>
        </div>

        {/* Action bar — secondary quick actions + primary CTA, side by side */}
        <div className="flex items-center gap-2 shrink-0">
          {SECONDARY_ACTIONS.map(item => (
            <button
              key={item.id}
              onClick={() => onAction(item.id)}
              title={item.label}
              aria-label={item.label}
              className="group inline-flex items-center gap-2 h-10 px-3 rounded-full bg-white border border-border-subtle text-text-secondary hover:border-[var(--color-info)] hover:text-[var(--color-info)] transition-all active:scale-95"
            >
              <item.icon size={16} className="text-[var(--color-info)] shrink-0" strokeWidth={2} />
              <span className="hidden lg:inline text-sm font-medium whitespace-nowrap">{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => onAction('rdv')}
            className="inline-flex items-center gap-1.5 h-10 pl-3.5 pr-4 rounded-full bg-primary text-white text-sm font-semibold shadow-sm hover:brightness-110 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} /> Nouveau RDV
          </button>
        </div>
      </div>
    </div>
  );
}
