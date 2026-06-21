import { useEffect, useRef, useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Plus, Clock, CalendarDays, LayoutGrid, CalendarRange,
  CheckCircle2, RotateCcw, Stethoscope, Activity, Scissors, Ban,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useAppointments, Appointment, AppointmentType } from '../context/AppointmentContext';
import AppointmentFormModal from '../components/AppointmentFormModal';
import ConsultationPage from '../components/ConsultationPage';
import { useAuth } from '../context/AuthContext';

type CalendarView = 'Month' | 'Week' | 'Day';

/* ────────────────────────────────────────────────────────────────────────── */
/* Type tokens — used everywhere appointments render                         */
/* ────────────────────────────────────────────────────────────────────────── */

type TypeToken = {
  label: string;
  bar: string;   // left-bar color (the single carrier of "type")
  dot: string;   // dot color (same hue as bar)
  icon: any;
};

const TYPE: Record<AppointmentType, TypeToken> = {
  'Consultation': { label: 'Consultation', bar: 'bg-primary',     dot: 'bg-primary',     icon: Stethoscope },
  'Follow-up':    { label: 'Suivi',        bar: 'bg-sky-500',     dot: 'bg-sky-500',     icon: Activity },
  'Surgery':      { label: 'Chirurgie',    bar: 'bg-amber-500',   dot: 'bg-amber-500',   icon: Scissors },
  'Cancelled':    { label: 'Annulé',       bar: 'bg-text-muted/40', dot: 'bg-text-muted/40', icon: Ban },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Avatar from initials                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function Initials({ name, size = 28 }: { name: string; size?: number }) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name.slice(0, 2);
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-bg-soft border border-border-subtle flex items-center justify-center shrink-0"
    >
      <span className="text-text-secondary font-medium uppercase tabular" style={{ fontSize: size * 0.36 }}>
        {initials.toUpperCase()}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Now-indicator (red line)                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function useTickEveryMinute() {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export default function SchedulePage() {
  const { appointments } = useAppointments();
  const { user } = useAuth();

  const filteredAppointments = user?.role === 'DOCTOR'
    ? appointments.filter(apt => apt.doctor === user.name)
    : appointments;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('Month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();
  const [initialModalData, setInitialModalData] = useState<Partial<Appointment>>({});
  const [consultationApt, setConsultationApt] = useState<Appointment | null>(null);

  const next = () => {
    if (view === 'Month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'Week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === 'Month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'Week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setView('Day');
  };

  const handleSlotClick = (time: string) => {
    if (user?.role !== 'SECRETARY') return;
    setInitialModalData({
      date: format(currentDate, 'yyyy-MM-dd'),
      startTime: time,
    });
    setSelectedAppointment(undefined);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (apt: Appointment) => {
    if (user?.role === 'DOCTOR') {
      if (apt.status === 'Cancelled') return;
      setConsultationApt(apt);
      return;
    }
    setSelectedAppointment(apt);
    setInitialModalData(apt);
    setIsModalOpen(true);
  };

  /* Quick stats for the header */
  const todayCount = filteredAppointments.filter(a =>
    a.date === format(new Date(), 'yyyy-MM-dd') && a.status !== 'Cancelled'
  ).length;
  const periodStart = view === 'Month' ? startOfMonth(currentDate) : startOfWeek(currentDate);
  const periodEnd   = view === 'Month' ? endOfMonth(currentDate)   : endOfWeek(currentDate);
  const periodCount = filteredAppointments.filter(a => {
    const d = new Date(a.date);
    return d >= periodStart && d <= periodEnd && a.status !== 'Cancelled';
  }).length;

  const periodLabel =
    view === 'Month' ? format(currentDate, 'MMMM yyyy', { locale: fr }) :
    view === 'Week'  ? `Semaine du ${format(startOfWeek(currentDate), 'd MMM', { locale: fr })}` :
                       format(currentDate, 'EEEE d MMMM', { locale: fr });

  return (
    <div className="flex flex-col h-full gap-6">
      {/* ════ Header ════ */}
      <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Left: title + period nav */}
          <div className="flex flex-col gap-3 min-w-0">
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest">
              Planning · {todayCount} aujourd'hui · {periodCount} {view === 'Month' ? 'ce mois' : view === 'Week' ? 'cette semaine' : 'ce jour'}
            </p>
            <h1 className="text-3xl font-medium text-text-primary tracking-tight capitalize leading-tight">
              {periodLabel}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={prev}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-border-subtle bg-white hover:bg-bg-soft transition-all"
                aria-label="Précédent"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3.5 py-1.5 rounded-full border border-border-subtle bg-white text-sm font-medium text-text-secondary hover:bg-bg-soft transition-all"
              >
                Aujourd'hui
              </button>
              <button
                onClick={next}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-border-subtle bg-white hover:bg-bg-soft transition-all"
                aria-label="Suivant"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: view toggle + add */}
          <div className="flex items-center gap-3">
            <div className="flex bg-bg-soft p-1 rounded-pill border border-border-subtle">
              {([
                ['Month', 'Mois', LayoutGrid],
                ['Week',  'Semaine', CalendarRange],
                ['Day',   'Jour', CalendarDays],
              ] as const).map(([v, label, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v as any)}
                  className={`px-3.5 py-1.5 rounded-pill text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                    view === v
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {user?.role === 'SECRETARY' && (
              <button
                onClick={() => {
                  setSelectedAppointment(undefined);
                  setInitialModalData({ date: format(currentDate, 'yyyy-MM-dd') });
                  setIsModalOpen(true);
                }}
                className="group inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-pill font-medium text-sm shadow-sm hover:brightness-110 transition-all active:scale-95"
              >
                <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
                Ajouter un RDV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════ Body ════ */}
      <div className="flex-1 bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden flex flex-col min-h-0">
        {view === 'Month' && (
          <MonthView
            currentDate={currentDate}
            appointments={filteredAppointments}
            onDayClick={handleDayClick}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {view === 'Week' && (
          <WeekView
            currentDate={currentDate}
            appointments={filteredAppointments}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {view === 'Day' && (
          <DayView
            currentDate={currentDate}
            appointments={filteredAppointments}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
      </div>

      <AppointmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={initialModalData}
        isEdit={!!selectedAppointment}
      />

      <AnimatePresence>
        {consultationApt && (
          <ConsultationPage
            appointment={consultationApt}
            onClose={() => setConsultationApt(null)}
            onNavigate={setConsultationApt}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* MONTH VIEW                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function MonthView({
  currentDate, appointments, onDayClick, onAppointmentClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (d: Date) => void;
  onAppointmentClick: (a: Appointment) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-border-subtle bg-bg-soft/40">
        {weekDays.map(day => (
          <div
            key={day}
            className="py-3 text-center text-[10px] font-medium uppercase tracking-widest text-text-muted"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr">
        {days.map((day) => {
          const dayAppointments = appointments
            .filter(a => isSameDay(new Date(a.date), day))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const todayFlag = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`group relative border-r border-b border-border-subtle last:border-r-0 p-2 flex flex-col gap-1.5 transition-colors cursor-pointer bg-white hover:bg-bg-soft/60 ${
                !isCurrentMonth ? 'opacity-50' : ''
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`tabular text-sm leading-none ${
                    todayFlag
                      ? 'inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white font-medium'
                      : isCurrentMonth
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayAppointments.length > 0 && (
                  <span className="text-[10px] font-medium text-text-muted tabular">
                    {dayAppointments.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 overflow-hidden">
                {dayAppointments.slice(0, 3).map(apt => {
                  const t = TYPE[apt.type];
                  return (
                    <button
                      key={apt.id}
                      onClick={e => {
                        e.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                      className="group/chip relative flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-border-subtle text-left overflow-hidden transition-all hover:border-text-muted/40"
                    >
                      <span className={`absolute left-0 inset-y-0 w-1 ${t.bar}`} />
                      <span className="text-[10px] font-medium text-text-muted tabular shrink-0 ml-1">{apt.startTime}</span>
                      <span className="text-[11px] font-medium truncate text-text-primary">
                        {apt.patientName}
                      </span>
                    </button>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <span className="text-[10px] font-medium text-text-muted px-1.5">
                    + {dayAppointments.length - 3} de plus
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* WEEK VIEW                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const HOUR_PX = 96;

function WeekView({
  currentDate, appointments, onAppointmentClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (a: Appointment) => void;
}) {
  useTickEveryMinute();
  const startDate = startOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 → 20
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current time on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const now = new Date();
    const top = ((now.getHours() - 8) * HOUR_PX) - 80;
    el.scrollTop = Math.max(0, top);
  }, []);

  const now = new Date();
  const minutesFromStart = (now.getHours() - 8) * 60 + now.getMinutes();
  const nowTop = (minutesFromStart / 60) * HOUR_PX;
  const showNowLine = now.getHours() >= 8 && now.getHours() <= 20;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border-subtle bg-white sticky top-0 z-20">
        <div className="border-r border-border-subtle bg-bg-soft/40" />
        {days.map(day => {
          const todayFlag = isToday(day);
          return (
            <div
              key={day.toString()}
              className="relative py-3 px-3 text-center border-r border-border-subtle last:border-r-0 bg-white"
            >
              <p className="text-[10px] font-medium uppercase tracking-widest text-text-muted">
                {format(day, 'EEE', { locale: fr })}
              </p>
              <div className="flex justify-center mt-1">
                <span className={`tabular text-sm ${
                  todayFlag
                    ? 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-medium'
                    : 'text-text-primary font-medium'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] relative">
          {/* Time column */}
          <div className="flex flex-col bg-bg-soft/40 border-r border-border-subtle">
            {hours.map(hour => (
              <div
                key={hour}
                style={{ height: HOUR_PX }}
                className="border-b border-border-subtle flex items-start justify-end pt-1 pr-2"
              >
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest tabular">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => {
            const todayFlag = isToday(day);
            const dayAppointments = appointments.filter(a => isSameDay(new Date(a.date), day));
            return (
              <div
                key={day.toString()}
                className="relative border-r border-border-subtle last:border-r-0 bg-white"
              >
                {hours.map(hour => (
                  <div key={hour} style={{ height: HOUR_PX }} className="border-b border-border-subtle/60" />
                ))}

                {/* Now indicator inside today's column */}
                {todayFlag && showNowLine && (
                  <div
                    className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    style={{ top: nowTop - 1 }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white shadow -ml-1" />
                    <span className="flex-1 h-px bg-rose-500" />
                  </div>
                )}

                {/* Appointments */}
                {dayAppointments.map(apt => {
                  const t = TYPE[apt.type];
                  const [sH, sM] = apt.startTime.split(':').map(Number);
                  const [eH, eM] = apt.endTime.split(':').map(Number);
                  const top = (sH - 8) * HOUR_PX + (sM / 60) * HOUR_PX;
                  const height = Math.max(((eH * 60 + eM) - (sH * 60 + sM)) / 60 * HOUR_PX, 36);

                  return (
                    <button
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className={`absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer text-left z-10 transition-all hover:shadow-md hover:-translate-y-0.5 bg-white border border-border-subtle hover:border-text-muted/40 ${
                        apt.status === 'Completed' ? 'opacity-60' : ''
                      }`}
                      style={{ top, height }}
                    >
                      <span className={`absolute left-0 inset-y-0 w-1 ${t.bar}`} />
                      <div className="p-2 pl-3">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-text-muted">
                          {t.label}
                        </p>
                        <p className="text-[12px] font-medium truncate text-text-primary mt-0.5">{apt.patientName}</p>
                        <p className="text-[10px] font-medium tabular text-text-muted mt-0.5">
                          {apt.startTime} – {apt.endTime}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* DAY VIEW                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function DayView({
  currentDate, appointments, onSlotClick, onAppointmentClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onSlotClick: (time: string) => void;
  onAppointmentClick: (a: Appointment) => void;
}) {
  const { user } = useAuth();
  const { markAsCompleted, currentPatientAptId, setCurrentPatientApt } = useAppointments();
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | undefined>();
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  useTickEveryMinute();

  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  const dayAppointments = appointments
    .filter(a => isSameDay(new Date(a.date), currentDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const confirmedToday = dayAppointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending');
  const completedCount = dayAppointments.filter(a => a.status === 'Completed').length;

  const currentAptId = currentPatientAptId || (confirmedToday.length > 0 ? confirmedToday[0].id : null);
  const currentIdx = confirmedToday.findIndex(a => a.id === currentAptId);
  const nextApt = confirmedToday[currentIdx + 1] || null;

  const handleMarkDone = (apt: Appointment) => {
    markAsCompleted(apt.id);
    const next = confirmedToday.find(a => a.id !== apt.id && a.status !== 'Completed');
    setCurrentPatientApt(next?.id || null);
  };

  const handleReschedule = (apt: Appointment) => {
    setRescheduleApt(apt);
    setIsRescheduleOpen(true);
  };

  const now = new Date();
  const isViewingToday = isToday(currentDate);
  const minutesFromStart = (now.getHours() - 8) * 60 + now.getMinutes();
  const nowTop = (minutesFromStart / 60) * HOUR_PX;
  const showNowLine = isViewingToday && now.getHours() >= 8 && now.getHours() <= 20;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Day header */}
      <div className="px-8 pt-7 pb-5 border-b border-border-subtle bg-white flex items-center gap-5">
        <div className="w-16 h-16 bg-bg-soft rounded-2xl border border-border-subtle flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-medium uppercase leading-none mb-1 tracking-widest text-text-muted">
            {format(currentDate, 'MMM', { locale: fr })}
          </span>
          <span className="text-2xl font-medium leading-none tabular text-text-primary">{format(currentDate, 'd')}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-medium tracking-tight capitalize text-text-primary">
            {format(currentDate, 'EEEE', { locale: fr })}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {format(currentDate, "d MMMM yyyy", { locale: fr })}
          </p>
          <div className="flex items-center gap-4 mt-3 text-[11px] font-medium text-text-muted tabular">
            <span>{dayAppointments.length} RDV</span>
            <span className="w-1 h-1 rounded-full bg-border-subtle" />
            <span>{completedCount} terminés</span>
            <span className="w-1 h-1 rounded-full bg-border-subtle" />
            <span>{confirmedToday.length} à venir</span>
          </div>
        </div>
      </div>

      {/* Hour rail */}
      <div className="flex-1 p-6">
        {dayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-soft border border-border-subtle flex items-center justify-center mb-3">
              <CalendarDays size={22} className="text-text-muted/60" />
            </div>
            <p className="text-sm font-medium text-text-secondary">Aucun rendez-vous ce jour</p>
            {user?.role === 'SECRETARY' && (
              <p className="text-xs text-text-muted mt-1">Cliquez sur une heure pour en programmer un</p>
            )}
          </div>
        ) : null}

        <div className="relative">
          {hours.map(hour => {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <div
                key={hour}
                className="group flex gap-6 border-b border-border-subtle/70 last:border-b-0 cursor-pointer"
                style={{ height: HOUR_PX }}
                onClick={() => onSlotClick(timeStr)}
              >
                <div className="w-16 pt-1 text-right shrink-0">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest tabular">
                    {timeStr}
                  </span>
                </div>
                <div className="flex-1 relative group-hover:bg-accent/[0.04] transition-colors rounded-lg">
                  {dayAppointments
                    .filter(a => Number(a.startTime.split(':')[0]) === hour)
                    .map(apt => {
                      const t = TYPE[apt.type];
                      const Icon = t.icon;
                      const [sH, sM] = apt.startTime.split(':').map(Number);
                      const [eH, eM] = apt.endTime.split(':').map(Number);
                      const top = (sM / 60) * HOUR_PX;
                      const height = Math.max(((eH * 60 + eM) - (sH * 60 + sM)) / 60 * HOUR_PX, 88);

                      const isCurrent = apt.id === currentAptId && apt.status !== 'Completed';
                      const isNext = nextApt?.id === apt.id;

                      return (
                        <button
                          key={apt.id}
                          onClick={e => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                          className={`absolute left-1 right-2 rounded-xl cursor-pointer text-left z-10 transition-all hover:shadow-md hover:-translate-y-0.5 bg-white border border-border-subtle hover:border-text-muted/40 ${
                            isCurrent ? 'border-primary/40 ring-1 ring-primary/20' : ''
                          } ${apt.status === 'Completed' ? 'opacity-60' : ''}`}
                          style={{ top, minHeight: height }}
                        >
                          <span className={`absolute left-0 inset-y-0 w-1 rounded-l-xl ${t.bar}`} />
                          <div className="p-3 pl-4 flex items-start gap-3">
                            <Initials name={apt.patientName} size={36} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-text-muted">
                                  <Icon size={10} />
                                  {t.label}
                                </span>
                                {isCurrent && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-widest bg-primary text-white px-1.5 py-0.5 rounded-full">
                                    En cours
                                  </span>
                                )}
                                {isNext && (
                                  <span className="text-[9px] font-medium uppercase tracking-widest bg-bg-soft text-text-secondary border border-border-subtle px-1.5 py-0.5 rounded-full">
                                    Suivant
                                  </span>
                                )}
                                {apt.status === 'Completed' && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-widest bg-bg-soft text-text-muted border border-border-subtle px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 size={10} />
                                    Terminé
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-text-primary truncate">{apt.patientName}</p>
                              <div className="flex items-center gap-1 text-[11px] font-medium tabular text-text-muted mt-0.5">
                                <Clock size={10} />
                                {apt.startTime} – {apt.endTime}
                                {apt.duration && <span className="ml-1 opacity-70">· {apt.duration} min</span>}
                              </div>
                            </div>

                            {user?.role === 'DOCTOR' && isCurrent && (
                              <div className="flex flex-col gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => handleMarkDone(apt)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-[10px] font-medium rounded-full hover:brightness-110 transition-all whitespace-nowrap"
                                >
                                  <CheckCircle2 size={11} />
                                  Terminer
                                </button>
                                <button
                                  onClick={() => handleReschedule(apt)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-text-secondary border border-border-subtle text-[10px] font-medium rounded-full hover:bg-bg-soft transition-all whitespace-nowrap"
                                >
                                  <RotateCcw size={11} />
                                  Reprogrammer
                                </button>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}

          {/* Now indicator */}
          {showNowLine && (
            <div
              className="absolute left-16 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: nowTop }}
            >
              <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white shadow -ml-1.5" />
              <span className="flex-1 h-px bg-rose-500" />
              <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-medium tabular">
                {format(now, 'HH:mm')}
              </span>
            </div>
          )}
        </div>
      </div>

      <AppointmentFormModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        initialData={rescheduleApt}
        isEdit
      />
    </div>
  );
}
