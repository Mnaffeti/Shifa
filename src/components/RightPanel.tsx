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

interface Props {
  onPatientClick?: (apt: Appointment) => void;
}

export default function RightPanel({ onPatientClick }: Props) {
  const { setIsModalOpen, appointments } = useAppointments();
  const { user } = useAuth();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const filteredAppointments = user?.role === 'DOCTOR'
    ? appointments.filter(a => a.doctor === user.name)
    : appointments;

  const todayAppointments = filteredAppointments
    .filter(a => a.date === todayStr && a.status !== 'Cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const days = WEEK_DAYS.map(({ day, offset }) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return { day, date: d.getDate(), active: offset === 0 };
  });

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

      <div className="flex justify-between mb-8 px-1">
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

      <div className="flex flex-col gap-2.5">
        {todayAppointments.length > 0 ? (
          todayAppointments.slice(0, 4).map((apt) => {
            const isDone = apt.status === 'Completed';
            const pending = todayAppointments.filter(a => a.status !== 'Completed');
            const isNext = !isDone && apt.id === pending[0]?.id;
            const isClickable = user?.role === 'DOCTOR' && onPatientClick && (isNext || isDone);

            return (
              <button
                key={apt.id}
                onClick={() => isClickable && onPatientClick!(apt)}
                disabled={!isClickable}
                className={`group w-full text-left flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                  isNext
                    ? 'border-accent/60 bg-gradient-to-r from-accent/20 to-accent/5 hover:from-accent/30 hover:-translate-y-0.5 cursor-pointer'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 cursor-pointer'
                    : 'border-teal-200 bg-teal-50/50 hover:bg-teal-50 cursor-default'
                }`}
              >
                <div className={`w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ${
                  isNext ? 'ring-accent' : isDone ? 'ring-emerald-300' : 'ring-teal-300'
                }`}>
                  <img
                    src={`https://picsum.photos/seed/patient-${apt.patientName.toLowerCase().replace(/\s+/g, '-')}/48/48`}
                    alt=""
                    className={isDone ? 'grayscale opacity-80' : ''}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-medium truncate ${isDone ? 'text-emerald-900' : isNext ? 'text-primary' : 'text-text-primary'}`}>
                      {apt.patientName}
                    </span>
                    {isNext && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary text-accent text-[9px] font-medium uppercase tracking-widest">
                        <span className="w-1 h-1 rounded-full bg-accent pulse-accent" />
                        Prochain
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] tabular">
                    <span className={isNext ? 'text-primary/70' : isDone ? 'text-emerald-700' : 'text-text-muted'}>{apt.startTime}</span>
                    <span className="text-text-muted/40">—</span>
                    <span className={isNext ? 'text-primary/70' : isDone ? 'text-emerald-700' : 'text-text-muted'}>{apt.endTime}</span>
                    {isDone && (
                      <span className="ml-1 inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={10} strokeWidth={2} />
                        Consulté
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-text-muted font-medium">Aucun rendez-vous aujourd'hui</p>
          </div>
        )}

        {user?.role === 'SECRETARY' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border-subtle text-text-muted hover:border-accent hover:bg-accent/10 hover:text-primary transition-all duration-200 group"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-medium">Ajouter un rendez-vous</span>
          </button>
        )}
      </div>
    </div>
  );
}
