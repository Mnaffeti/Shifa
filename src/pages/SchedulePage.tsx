import { useState } from 'react';
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
  isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppointments, Appointment, AppointmentType } from '../context/AppointmentContext';
import AppointmentFormModal from '../components/AppointmentFormModal';
import { useAuth } from '../context/AuthContext';

type CalendarView = 'Month' | 'Week' | 'Day';

const TYPE_COLORS: Record<AppointmentType, { bg: string; text: string }> = {
  'Consultation': { bg: '#E6FFFA', text: '#2C7A7B' }, // Teal
  'Follow-up': { bg: '#EBF8FF', text: '#2B6CB0' },    // Blue
  'Surgery': { bg: '#FEFCBF', text: '#975A16' },      // Amber
  'Cancelled': { bg: '#FFF5F7', text: '#B83280' }     // Pink
};

export default function SchedulePage() {
  const { appointments } = useAppointments();
  const { user } = useAuth();
  
  const filteredAppointments = user?.role === 'DOCTOR' 
    ? appointments.filter(apt => apt.doctor === user.name)
    : appointments;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('Month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [initialModalData, setInitialModalData] = useState<Partial<Appointment>>({});

  const next = () => {
    if (view === 'Month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'Week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === 'Month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'Week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const subDays = (date: Date, amount: number) => addDays(date, -amount);

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setView('Day');
  };

  const handleSlotClick = (time: string) => {
    if (user?.role !== 'SECRETARY') return;
    setInitialModalData({
      date: format(currentDate, 'yyyy-MM-dd'),
      startTime: time,
      endTime: format(addDays(new Date(`2000-01-01T${time}`), 0), 'HH:mm') // simplistic
    });
    setSelectedAppointment(undefined);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (apt: Appointment) => {
    if (user?.role !== 'SECRETARY') return;
    setSelectedAppointment(apt);
    setInitialModalData(apt);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full gap-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-medium text-text-primary tracking-tight">Planning</h1>
          <div className="flex items-center gap-4">
            <h2 className="text-[16px] font-medium text-text-primary tracking-[-0.02em] min-w-[160px]">
              {view === 'Month' ? format(currentDate, 'MMMM yyyy', { locale: fr }) : 
               view === 'Week' ? `Semaine du ${format(startOfWeek(currentDate, { locale: fr }), 'd MMM', { locale: fr })}` :
               format(currentDate, 'd MMMM yyyy', { locale: fr })}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prev} className="p-1 hover:bg-bg-soft rounded-md transition-colors text-text-muted">
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-white border-[0.5px] border-border-subtle rounded-md text-[12px] font-normal tracking-[0.02em] hover:bg-bg-soft transition-colors"
              >
                Aujourd'hui
              </button>
              <button onClick={next} className="p-1 hover:bg-bg-soft rounded-md transition-colors text-text-muted">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F3F4F6] p-1 rounded-pill border-[0.5px] border-border-subtle">
            {([['Month', 'Mois'], ['Week', 'Semaine'], ['Day', 'Jour']] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`px-4 py-1.5 rounded-pill text-[12px] font-normal tracking-[0.02em] transition-all ${
                  view === v ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
                }`}
              >
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
              className="flex items-center gap-2 bg-accent text-primary px-5 py-2.5 rounded-pill font-medium text-[12px] tracking-[0.02em] shadow-md hover:brightness-110 transition-all active:scale-95"
            >
              <Plus size={18} />
              Ajouter un RDV
            </button>
          )}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 bg-white rounded-[24px] shadow-card border-[0.5px] border-border-subtle overflow-hidden flex flex-col">
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
    </div>
  );
}

function MonthView({ currentDate, appointments, onDayClick, onAppointmentClick }: any) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Group days into weeks for week numbers
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[40px_1fr] border-b-[0.5px] border-border-subtle">
        <div className="bg-[#F9FAFB] border-r-[0.5px] border-border-subtle" />
        <div className="grid grid-cols-7">
          {weekDays.map((day, idx) => (
            <div 
              key={day} 
              className={`py-3 text-center text-[10px] font-medium uppercase tracking-[0.08em] ${
                idx === 0 || idx === 6 ? 'bg-[#FFF8F5] text-[#B83280]/60' : 'bg-white text-text-muted'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex-1 grid grid-cols-[40px_1fr] border-b-[0.5px] border-border-subtle last:border-b-0">
            <div className="bg-[#F9FAFB] border-r-[0.5px] border-border-subtle flex items-start justify-center pt-4">
              <span className="text-[10px] font-medium text-text-muted/50 tabular">
                {format(week[0], 'w')}
              </span>
            </div>
            <div className="grid grid-cols-7">
              {week.map((day) => {
                const dayAppointments = appointments.filter((a: Appointment) => isSameDay(new Date(a.date), day));
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isCurrentMonth = isSameMonth(day, monthStart);
                
                return (
                  <div 
                    key={day.toString()} 
                    className={`min-h-[120px] border-r-[0.5px] border-border-subtle last:border-r-0 pt-4 px-3 flex flex-col gap-1 transition-colors hover:bg-[#F5F5F5] cursor-pointer relative ${
                      isWeekend ? 'bg-[#FFF8F5]' : 'bg-white'
                    } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    onClick={() => onDayClick(day)}
                  >
                    <div className="flex justify-start items-center mb-2">
                      <span className={`text-[13px] ${
                        isToday(day) ? 'w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-semibold' : 
                        isCurrentMonth ? 'text-text-primary font-normal' : 'text-text-muted font-normal'
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {dayAppointments.slice(0, 3).map((apt: Appointment) => (
                        <div 
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                          className="px-2 py-1 rounded-[4px] text-[11px] font-medium tracking-[0.01em] truncate transition-all hover:brightness-95"
                          style={{ 
                            backgroundColor: TYPE_COLORS[apt.type].bg, 
                            color: TYPE_COLORS[apt.type].text 
                          }}
                        >
                          {apt.startTime} {apt.patientName}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <span className="text-[10px] font-medium text-text-muted pl-1">
                          + {dayAppointments.length - 3} de plus
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ currentDate, appointments, onAppointmentClick }: any) {
  const startDate = startOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-[80px_1fr] border-b-[0.5px] border-border-subtle">
        <div className="border-r-[0.5px] border-border-subtle bg-[#F9FAFB]" />
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div 
                key={day.toString()} 
                className={`py-3 text-center border-r-[0.5px] border-border-subtle last:border-r-0 ${
                  isWeekend ? 'bg-[#FFF8F5]' : 'bg-white'
                }`}
              >
                <p className={`text-[10px] font-medium uppercase tracking-[0.08em] mb-1 ${
                  isWeekend ? 'text-[#B83280]/60' : 'text-text-muted'
                }`}>
                  {format(day, 'EEE', { locale: fr })}
                </p>
                <div className="flex justify-center">
                  <p className={`text-[13px] ${
                    isToday(day) ? 'w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold' : 'text-text-primary font-normal'
                  }`}>
                    {format(day, 'd')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[80px_1fr] relative">
          <div className="flex flex-col">
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b-[0.5px] border-border-subtle border-r-[0.5px] flex items-start justify-center pt-2 bg-[#F9FAFB]">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-[0.08em]">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 relative">
            {days.map((day, idx) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div 
                  key={day.toString()} 
                  className={`h-full border-r-[0.5px] border-border-subtle last:border-r-0 relative ${
                    isWeekend ? 'bg-[#FFF8F5]' : 'bg-white'
                  }`}
                >
                  {hours.map(hour => (
                    <div key={hour} className="h-20 border-b-[0.5px] border-border-subtle" />
                  ))}
                  {/* Appointments */}
                  {appointments
                    .filter((a: Appointment) => isSameDay(new Date(a.date), day))
                    .map((apt: Appointment) => {
                      const [startH, startM] = apt.startTime.split(':').map(Number);
                      const [endH, endM] = apt.endTime.split(':').map(Number);
                      const top = (startH - 8) * 80 + (startM / 60) * 80;
                      const height = ((endH * 60 + endM) - (startH * 60 + startM)) / 60 * 80;
                      
                      return (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick(apt)}
                          className="absolute left-1 right-1 rounded-[4px] p-2 shadow-sm border border-white/20 cursor-pointer overflow-hidden transition-all hover:brightness-95 z-10"
                          style={{ 
                            top: `${top}px`, 
                            height: `${height}px`, 
                            backgroundColor: TYPE_COLORS[apt.type].bg,
                            color: TYPE_COLORS[apt.type].text
                          }}
                        >
                          <p className="text-[10px] font-medium uppercase mb-0.5 opacity-70 tracking-[0.01em]">{apt.type}</p>
                          <p className="text-[11px] font-medium tracking-[0.01em] truncate">{apt.patientName}</p>
                          <p className="text-[10px] font-medium opacity-80">{apt.startTime} - {apt.endTime}</p>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayView({ currentDate, appointments, onSlotClick, onAppointmentClick }: any) {
  const { user } = useAuth();
  const { markAsCompleted, currentPatientAptId, setCurrentPatientApt } = useAppointments();
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | undefined>(undefined);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  const dayAppointments = appointments
    .filter((a: Appointment) => isSameDay(new Date(a.date), currentDate))
    .sort((a: Appointment, b: Appointment) => a.startTime.localeCompare(b.startTime));

  const confirmedToday = dayAppointments.filter((a: Appointment) =>
    a.status === 'Confirmed' || a.status === 'Pending'
  );

  const currentAptId = currentPatientAptId || (confirmedToday.length > 0 ? confirmedToday[0].id : null);
  const currentIdx = confirmedToday.findIndex((a: Appointment) => a.id === currentAptId);
  const nextApt = confirmedToday[currentIdx + 1] || null;

  const handleMarkDone = (apt: Appointment) => {
    markAsCompleted(apt.id);
    const next = confirmedToday.find((a: Appointment) => a.id !== apt.id && a.status !== 'Completed');
    setCurrentPatientApt(next?.id || null);
  };

  const handleReschedule = (apt: Appointment) => {
    setRescheduleApt(apt);
    setIsRescheduleOpen(true);
  };

  const TYPE_FR: Record<string, string> = {
    'Consultation': 'Consultation',
    'Follow-up': 'Suivi',
    'Surgery': 'Chirurgie',
    'Cancelled': 'Annulé'
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-8 border-b-[0.5px] border-border-subtle bg-[#F9FAFB] flex items-center gap-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex flex-col items-center justify-center text-white shadow-lg">
          <span className="text-[10px] font-medium uppercase leading-none mb-1 tracking-[0.08em]">
            {format(currentDate, 'MMM', { locale: fr })}
          </span>
          <span className="text-3xl font-semibold leading-none">{format(currentDate, 'd')}</span>
        </div>
        <div>
          <h2 className="text-2xl font-medium text-text-primary tracking-tight">
            {format(currentDate, 'EEEE', { locale: fr })}
          </h2>
          <p className="text-sm font-normal text-text-secondary">
            {dayAppointments.length} rendez-vous · {confirmedToday.length} à venir
          </p>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="relative space-y-0">
          {hours.map(hour => {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <div
                key={hour}
                className="group flex gap-8 h-24 border-b-[0.5px] border-border-subtle last:border-b-0 cursor-pointer"
                onClick={() => onSlotClick(timeStr)}
              >
                <div className="w-20 pt-2 text-right">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-[0.08em]">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </span>
                </div>
                <div className="flex-1 relative group-hover:bg-[#F5F5F5] transition-colors rounded-xl">
                  {dayAppointments
                    .filter((a: Appointment) => {
                      const [h] = a.startTime.split(':').map(Number);
                      return h === hour;
                    })
                    .map((apt: Appointment) => {
                      const [startH, startM] = apt.startTime.split(':').map(Number);
                      const [endH, endM] = apt.endTime.split(':').map(Number);
                      const top = (startM / 60) * 96;
                      const height = Math.max(
                        ((endH * 60 + endM) - (startH * 60 + startM)) / 60 * 96,
                        56
                      );

                      const isCurrent = apt.id === currentAptId;
                      const isNext = nextApt?.id === apt.id;

                      return (
                        <div
                          key={apt.id}
                          onClick={e => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                          className={`absolute left-2 right-2 rounded-2xl p-3 shadow-md border cursor-pointer flex items-center justify-between z-10 transition-all ${
                            isCurrent ? 'border-primary/40 ring-2 ring-primary/20' :
                            isNext ? 'border-accent/40' : 'border-white/20'
                          } ${apt.status === 'Completed' ? 'opacity-50' : ''}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: TYPE_COLORS[apt.type].bg,
                            color: TYPE_COLORS[apt.type].text
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center shrink-0">
                              <User size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                {isCurrent && apt.status !== 'Completed' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded-full">
                                    En cours
                                  </span>
                                )}
                                {isNext && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-black/10 px-1.5 py-0.5 rounded-full">
                                    Suivant
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] font-medium">{apt.patientName}</p>
                              <div className="flex items-center gap-1 text-[10px] font-medium opacity-80">
                                <Clock size={10} />
                                {apt.startTime} – {apt.endTime}
                                {apt.duration && <span className="ml-1">({apt.duration} min)</span>}
                              </div>
                            </div>
                          </div>

                          {user?.role === 'DOCTOR' && isCurrent && apt.status !== 'Completed' && (
                            <div className="flex flex-col gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleMarkDone(apt)}
                                className="px-3 py-1 bg-accent text-primary text-[10px] font-bold rounded-full hover:brightness-110 transition-all whitespace-nowrap"
                              >
                                Terminer
                              </button>
                              <button
                                onClick={() => handleReschedule(apt)}
                                className="px-3 py-1 bg-white/40 text-current text-[10px] font-bold rounded-full hover:bg-white/60 transition-all whitespace-nowrap"
                              >
                                Reprogrammer
                              </button>
                            </div>
                          )}

                          {(user?.role !== 'DOCTOR' || !isCurrent) && (
                            <div className="flex items-center gap-2 shrink-0">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: apt.status === 'Completed' ? '#1A6B5A' : '#2B7FBF' }}
                              />
                              <span className="text-[10px] font-medium uppercase tracking-[0.08em]">
                                {apt.status === 'Completed' ? 'Terminé' :
                                 apt.status === 'Confirmed' ? 'Confirmé' :
                                 apt.status === 'Cancelled' ? 'Annulé' : 'En attente'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
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
