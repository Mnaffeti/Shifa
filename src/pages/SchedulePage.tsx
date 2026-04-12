import React, { useState } from 'react';
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
  startOfDay,
  addWeeks,
  subWeeks,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppointments, Appointment, AppointmentType } from '../context/AppointmentContext';
import AppointmentFormModal from '../components/AppointmentFormModal';

import { useAuth } from '../context/AuthContext';

type CalendarView = 'Month' | 'Week' | 'Day';

const TYPE_COLORS: Record<AppointmentType, string> = {
  'Consultation': '#FFCF44',
  'Follow-up': '#3DD6D0',
  'Surgery': '#FF6B6B',
  'Cancelled': '#E5E7EB'
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
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold text-text-primary font-heading">Schedule</h1>
          <div className="flex items-center gap-2 bg-white rounded-pill border border-border-subtle p-1 shadow-sm">
            <button onClick={prev} className="p-1.5 hover:bg-bg-soft rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-bold text-sm min-w-[140px] text-center">
              {view === 'Month' ? format(currentDate, 'MMMM yyyy') : 
               view === 'Week' ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}` :
               format(currentDate, 'MMMM d, yyyy')}
            </span>
            <button onClick={next} className="p-1.5 hover:bg-bg-soft rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white border border-border-subtle rounded-pill text-sm font-bold hover:bg-bg-soft transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F3F4F6] p-1 rounded-pill border border-border-subtle">
            {(['Month', 'Week', 'Day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-pill text-sm font-bold transition-all ${
                  view === v ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
                }`}
              >
                {v}
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
              className="flex items-center gap-2 bg-accent text-primary px-5 py-2.5 rounded-pill font-bold text-sm shadow-md hover:brightness-110 transition-all active:scale-95"
            >
              <Plus size={18} />
              Add Appointment
            </button>
          )}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden flex flex-col">
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-border-subtle bg-[#F9FAFB]">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map(day => {
          const dayAppointments = appointments.filter((a: Appointment) => isSameDay(new Date(a.date), day));
          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] border-r border-b border-border-subtle p-2 flex flex-col gap-1 transition-colors hover:bg-bg-soft/30 cursor-pointer ${
                !isSameMonth(day, monthStart) ? 'bg-[#F9FAFB]/50' : ''
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-bold ${
                  isToday(day) ? 'w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center' : 
                  isSameMonth(day, monthStart) ? 'text-text-primary' : 'text-text-muted'
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
                    className="px-2 py-1 rounded-md text-[10px] font-bold truncate transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: TYPE_COLORS[apt.type], color: apt.type === 'Cancelled' ? '#6B7280' : '#1A4747' }}
                  >
                    {apt.startTime} {apt.patientName}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <span className="text-[10px] font-bold text-text-muted pl-1">
                    + {dayAppointments.length - 3} more
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

function WeekView({ currentDate, appointments, onAppointmentClick }: any) {
  const startDate = startOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-[80px_1fr] border-b border-border-subtle bg-[#F9FAFB]">
        <div className="border-r border-border-subtle" />
        <div className="grid grid-cols-7">
          {days.map(day => (
            <div key={day.toString()} className="py-3 text-center border-r border-border-subtle last:border-r-0">
              <p className="text-[10px] font-bold text-text-muted uppercase mb-1">{format(day, 'EEE')}</p>
              <p className={`text-lg font-bold ${isToday(day) ? 'text-primary' : 'text-text-primary'}`}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[80px_1fr] relative">
          <div className="flex flex-col">
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b border-border-subtle border-r flex items-start justify-center pt-2">
                <span className="text-[11px] font-bold text-text-muted uppercase">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 relative">
            {days.map(day => (
              <div key={day.toString()} className="h-full border-r border-border-subtle last:border-r-0 relative">
                {hours.map(hour => (
                  <div key={hour} className="h-20 border-b border-border-subtle" />
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
                        className="absolute left-1 right-1 rounded-lg p-2 shadow-sm border border-white/20 cursor-pointer overflow-hidden transition-all hover:brightness-105 z-10"
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`, 
                          backgroundColor: TYPE_COLORS[apt.type],
                          color: apt.type === 'Cancelled' ? '#6B7280' : '#1A4747'
                        }}
                      >
                        <p className="text-[10px] font-extrabold uppercase mb-0.5">{apt.type}</p>
                        <p className="text-xs font-bold truncate">{apt.patientName}</p>
                        <p className="text-[10px] font-medium opacity-80">{apt.startTime} - {apt.endTime}</p>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayView({ currentDate, appointments, onSlotClick, onAppointmentClick }: any) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
  const dayAppointments = appointments.filter((a: Appointment) => isSameDay(new Date(a.date), currentDate));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-border-subtle bg-[#F9FAFB] flex items-center gap-4">
        <div className="w-14 h-14 bg-primary rounded-2xl flex flex-col items-center justify-center text-white shadow-lg">
          <span className="text-[10px] font-bold uppercase leading-none mb-1">{format(currentDate, 'MMM')}</span>
          <span className="text-2xl font-black leading-none">{format(currentDate, 'd')}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{format(currentDate, 'EEEE')}</h2>
          <p className="text-sm font-medium text-text-secondary">You have {dayAppointments.length} appointments scheduled</p>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="relative space-y-0">
          {hours.map(hour => {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <div 
                key={hour} 
                className="group flex gap-6 h-24 border-b border-border-subtle last:border-b-0 cursor-pointer"
                onClick={() => onSlotClick(timeStr)}
              >
                <div className="w-16 pt-2 text-right">
                  <span className="text-xs font-bold text-text-muted uppercase">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </span>
                </div>
                <div className="flex-1 relative group-hover:bg-bg-soft/30 transition-colors rounded-xl">
                  {/* Appointments for this hour */}
                  {dayAppointments
                    .filter((a: Appointment) => {
                      const [h] = a.startTime.split(':').map(Number);
                      return h === hour;
                    })
                    .map((apt: Appointment) => {
                      const [startH, startM] = apt.startTime.split(':').map(Number);
                      const [endH, endM] = apt.endTime.split(':').map(Number);
                      const top = (startM / 60) * 96;
                      const height = ((endH * 60 + endM) - (startH * 60 + startM)) / 60 * 96;

                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                          className="absolute left-2 right-2 rounded-2xl p-4 shadow-md border border-white/20 cursor-pointer flex items-center justify-between transition-all hover:scale-[1.01] z-10"
                          style={{ 
                            top: `${top}px`, 
                            height: `${height}px`, 
                            backgroundColor: TYPE_COLORS[apt.type],
                            color: apt.type === 'Cancelled' ? '#6B7280' : '#1A4747'
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                              <User size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-extrabold uppercase opacity-70 mb-0.5">{apt.type}</p>
                              <p className="text-base font-bold">{apt.patientName}</p>
                              <div className="flex items-center gap-2 text-[11px] font-bold">
                                <Clock size={12} />
                                {apt.startTime} - {apt.endTime}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${apt.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-bold uppercase">{apt.status}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
