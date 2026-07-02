import { useRef, useState, useLayoutEffect } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
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

// Wheel geometry — 3 pills visible, the focused one snapped to the middle.
const ITEM_H = 76;   // height of one pill slot (px)
const GAP = 14;      // vertical gap between slots (px)
const STRIDE = ITEM_H + GAP;
const VISIBLE = 3;
const WHEEL_H = VISIBLE * ITEM_H + (VISIBLE - 1) * GAP;
const PAD = (WHEEL_H - ITEM_H) / 2; // top/bottom padding so first & last can center

interface Props {
  onPatientClick?: (apt: Appointment) => void;
}

export default function RightPanel({ onPatientClick }: Props) {
  const { setIsModalOpen, appointments } = useAppointments();
  const { user } = useAuth();

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const filteredAppointments = user?.role === 'DOCTOR'
    ? appointments.filter(a => a.doctor === user.name)
    : appointments;

  const todayAppointments = filteredAppointments
    .filter(a => a.date === todayStr && a.status !== 'Cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // The "closest" appointment — first one not yet completed (fallback: last of day).
  const nextIndex = Math.max(
    0,
    (() => {
      const i = todayAppointments.findIndex(a => a.status !== 'Completed');
      return i === -1 ? todayAppointments.length - 1 : i;
    })()
  );

  const [activeIndex, setActiveIndex] = useState(nextIndex);

  // Snap the closest appointment to the middle on load / when the day changes.
  useLayoutEffect(() => {
    const c = scrollRef.current;
    if (c) c.scrollTop = nextIndex * STRIDE;
    setActiveIndex(nextIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextIndex, todayAppointments.length]);

  const handleScroll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const c = scrollRef.current;
      if (!c) return;
      const idx = Math.round(c.scrollTop / STRIDE);
      const clamped = Math.max(0, Math.min(todayAppointments.length - 1, idx));
      setActiveIndex(clamped);
    });
  };

  const scrollToIndex = (i: number) => {
    scrollRef.current?.scrollTo({ top: i * STRIDE, behavior: 'smooth' });
  };

  const days = WEEK_DAYS.map(({ day, offset }) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return { day, date: d.getDate(), active: offset === 0 };
  });

  const isDoctor = user?.role === 'DOCTOR';

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-card border border-border-subtle w-full max-w-[380px] hover-card">
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="text-xl font-medium text-text-primary leading-tight tracking-tight">
          Prochains rendez-vous
        </h3>
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest tabular">
          {todayAppointments.length} aujourd'hui
        </span>
      </div>

      <div className="flex justify-between mb-6 px-1">
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
        <div className="relative">
          {/* Center focus guides */}
          <div
            className="pointer-events-none absolute inset-x-1 z-10 rounded-full ring-1 ring-accent/30"
            style={{ top: PAD, height: ITEM_H }}
          />
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
            style={{ height: WHEEL_H, paddingTop: PAD, paddingBottom: PAD }}
          >
            {todayAppointments.map((apt, i) => {
              const isDone = apt.status === 'Completed';
              const isActive = i === activeIndex;
              const isNext = i === nextIndex;
              const clickable = isDoctor && !!onPatientClick;

              return (
                <div
                  key={apt.id}
                  className="snap-center flex items-center"
                  style={{ height: ITEM_H, marginBottom: i === todayAppointments.length - 1 ? 0 : GAP }}
                >
                  <button
                    onClick={() => {
                      if (!isActive) scrollToIndex(i);
                      else if (clickable) onPatientClick!(apt);
                    }}
                    className={`w-full h-[68px] flex items-center gap-3 rounded-full border px-3 pr-5 transition-all duration-300 origin-center ${
                      isActive
                        ? isDone
                          ? 'scale-100 opacity-100 border-emerald-300 bg-emerald-50 shadow-md ring-1 ring-emerald-200'
                          : 'scale-100 opacity-100 border-accent/70 bg-gradient-to-r from-accent/25 to-accent/5 shadow-md ring-1 ring-accent/30'
                        : 'scale-[0.86] opacity-45 border-border-subtle bg-bg-soft/60 hover:opacity-75 cursor-pointer'
                    }`}
                  >
                    <div className={`rounded-full overflow-hidden shrink-0 ring-2 ${
                      isDone ? 'ring-emerald-300' : isActive ? 'ring-accent' : 'ring-teal-300'
                    } ${isActive ? 'w-12 h-12' : 'w-10 h-10'}`}>
                      <img
                        src={`https://picsum.photos/seed/patient-${apt.patientName.toLowerCase().replace(/\s+/g, '-')}/48/48`}
                        alt=""
                        className={isDone ? 'grayscale opacity-80' : ''}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-medium truncate ${isActive ? 'text-[15px]' : 'text-sm'} ${
                          isDone ? 'text-emerald-900' : isActive ? 'text-primary' : 'text-text-primary'
                        }`}>
                          {apt.patientName}
                        </span>
                        {isActive && isNext && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary text-accent text-[9px] font-medium uppercase tracking-widest">
                            <span className="w-1 h-1 rounded-full bg-accent pulse-accent" />
                            Prochain
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] tabular">
                        <span className={isDone ? 'text-emerald-700' : isActive ? 'text-primary/70' : 'text-text-muted'}>{apt.startTime}</span>
                        <span className="text-text-muted/40">—</span>
                        <span className={isDone ? 'text-emerald-700' : isActive ? 'text-primary/70' : 'text-text-muted'}>{apt.endTime}</span>
                        {isDone && (
                          <span className="ml-1 inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={10} strokeWidth={2} />
                            Consulté
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted font-medium">Aucun rendez-vous aujourd'hui</p>
        </div>
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
