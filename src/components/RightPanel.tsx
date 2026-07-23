import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';

const WEEK_DAYS = [
  { day: 'Dim', offset: -3 },
  { day: 'Lun', offset: -2 },
  { day: 'Mar', offset: -1 },
  { day: 'Mer', offset: 0 },
  { day: 'Jeu', offset: 1 },
  { day: 'Ven', offset: 2 },
];

/** Re-render every 30s so the "time-until" and in-progress state stay live. */
function useTick(ms = 30_000) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

interface Props {
  onPatientClick?: (apt: Appointment) => void;
}

type CapsuleState = 'next' | 'later' | 'progress' | 'past' | 'cancelled';

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function formatUntil(deltaMin: number): string {
  if (deltaMin <= 0) return 'maintenant';
  if (deltaMin < 60) return `dans ${deltaMin} min`;
  const h = Math.floor(deltaMin / 60);
  const m = deltaMin % 60;
  return m === 0 ? `dans ${h} h` : `dans ${h} h ${m}`;
}

export default function RightPanel({ onPatientClick }: Props) {
  const { setIsModalOpen, appointments } = useAppointments();
  const { user } = useAuth();
  useTick();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const isDoctor = user?.role === 'DOCTOR';

  const filteredAppointments = isDoctor
    ? appointments.filter(a => a.doctor === user!.name)
    : appointments;

  const todayAppointments = filteredAppointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // The "next" appointment is the first upcoming one that isn't in progress,
  // completed, or cancelled.
  const nextId = (() => {
    const upcoming = todayAppointments.find(a => {
      if (a.status === 'Completed' || a.status === 'Cancelled') return false;
      return minutesOf(a.startTime) > nowMin;
    });
    return upcoming?.id ?? null;
  })();

  const stateOf = (apt: Appointment): CapsuleState => {
    if (apt.status === 'Cancelled') return 'cancelled';
    if (apt.status === 'Completed') return 'past';
    const start = minutesOf(apt.startTime);
    const end = minutesOf(apt.endTime);
    if (nowMin >= start && nowMin < end) return 'progress';
    if (nowMin >= end) return 'past';
    return apt.id === nextId ? 'next' : 'later';
  };

  const days = WEEK_DAYS.map(({ day, offset }) => {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    return { day, date: d.getDate(), active: offset === 0 };
  });

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-card border border-border-subtle w-full max-w-[460px] hover-card">
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="text-xl font-medium text-text-primary leading-tight tracking-tight">
          Prochains rendez-vous
        </h3>
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest tabular">
          {todayAppointments.filter(a => a.status !== 'Cancelled').length} aujourd'hui
        </span>
      </div>

      {/* Date strip */}
      <div className="flex justify-between px-1">
        {days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1.5">
            {d.active ? (
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white tabular">{d.date}</span>
              </div>
            ) : (
              <div className="w-9 h-9 flex items-center justify-center">
                <span className="text-sm font-medium text-text-primary tabular">{d.date}</span>
              </div>
            )}
            <span className={`text-[10px] font-medium uppercase tracking-widest ${d.active ? 'text-primary' : 'text-text-muted/70'}`}>
              {d.day}
            </span>
          </div>
        ))}
      </div>

      {todayAppointments.length > 0 ? (
        <div className="flex flex-col content-start gap-4 mt-6">
          {todayAppointments.map((apt) => {
            const state = stateOf(apt);
            const untilMin = minutesOf(apt.startTime) - nowMin;
            const clickable = isDoctor && !!onPatientClick;

            const until: string | null = state === 'next' ? formatUntil(untilMin) : null;
            return (
              <div key={apt.id} className="contents">
                <AppointmentCapsule
                  apt={apt}
                  state={state}
                  until={until}
                  onClick={clickable ? () => onPatientClick!(apt) : undefined}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 py-8 text-center text-sm font-medium text-[#9CA8A3]">
          Aucun rendez-vous ce jour
        </p>
      )}

      {user?.role === 'SECRETARY' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border-subtle text-text-muted hover:border-accent hover:bg-accent/10 hover:text-primary transition-all duration-200 group"
        >
          <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-medium">Ajouter un rendez-vous</span>
        </button>
      )}
    </div>
  );
}

// ─── Capsule ────────────────────────────────────────────────────────────────

interface CapsuleProps {
  apt: Appointment;
  state: CapsuleState;
  until: string | null;
  onClick?: () => void;
}

function AppointmentCapsule({ apt, state, until, onClick }: CapsuleProps) {
  // One border per capsule — no layered stroke + glow.
  const shell: Record<CapsuleState, string> = {
    next: 'bg-[#F7FEE7] border-[1.5px] border-[#A3E635] shadow-[0_2px_10px_rgba(163,230,53,0.22)]',
    later: 'bg-white border border-[#E8EAE4]',
    progress: 'bg-white border-[1.5px] border-[#65A30D]',
    past: 'bg-white border border-[#E8EAE4] opacity-50',
    cancelled: 'bg-[#FEF2F2] border border-[#FECACA]',
  };

  const avatarRing: Record<CapsuleState, string> = {
    next: 'ring-2 ring-[#A3E635]',
    later: 'ring-1 ring-[#E8EAE4]',
    progress: 'ring-2 ring-[#65A30D]',
    past: 'ring-1 ring-[#E8EAE4]',
    cancelled: 'ring-1 ring-[#FECACA]',
  };

  const isPast = state === 'past';
  const isCancelled = state === 'cancelled';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center text-left rounded-[36px] transition-all duration-[140ms] ease-out
        hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-none
        motion-reduce:hover:translate-y-0 motion-reduce:transition-none
        focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#14532D] focus-visible:outline-offset-[3px]
        ${shell[state]}`}
      style={{ height: 72, padding: '6px 20px 6px 6px' }}
    >
      {/* Avatar — 60px, flush left on the curve */}
      <div className={`w-[60px] h-[60px] rounded-full overflow-hidden shrink-0 ${avatarRing[state]}`}>
        <img
          src={`https://picsum.photos/seed/patient-${apt.patientName.toLowerCase().replace(/\s+/g, '-')}/60/60`}
          alt=""
          className={`w-full h-full object-cover ${isPast ? 'grayscale' : ''}`}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0 ml-4">
        <p
          className={`text-[17px] font-semibold leading-tight truncate ${isCancelled ? 'line-through text-[#9CA8A3]' : 'text-[#0F1F1C]'}`}
        >
          {apt.patientName}
        </p>
        <p className="text-[14px] text-[#5C6B66] leading-tight mt-0.5 [font-variant-numeric:tabular-nums]">
          {apt.startTime} – {apt.endTime}
        </p>
      </div>

      {/* Time-until (next) or live dot (in progress) */}
      {state === 'progress' && (
        <span className="ml-3 flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#65A30D] animate-pulse motion-reduce:animate-none" />
        </span>
      )}
      {until && (
        <span className="ml-3 shrink-0 text-[13px] font-semibold text-[#3F6212] [font-variant-numeric:tabular-nums]">
          {until}
        </span>
      )}
    </button>
  );
}
