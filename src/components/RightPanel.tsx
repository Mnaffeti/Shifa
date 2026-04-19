import { Plus } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';

const days = [
  { day: 'Dim', date: 7 },
  { day: 'Lun', date: 8 },
  { day: 'Mar', date: 9 },
  { day: 'Mer', date: 10, active: true },
  { day: 'Jeu', date: 11 },
  { day: 'Ven', date: 12 },
];

export default function RightPanel() {
  const { setIsModalOpen, appointments } = useAppointments();
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  
  const filteredAppointments = user?.role === 'DOCTOR'
    ? appointments.filter(a => a.doctor === user.name)
    : appointments;

  const todayAppointments = filteredAppointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-card border border-border-subtle w-full max-w-[380px]">
      <h3 className="text-2xl font-bold text-text-primary leading-tight mb-8 tracking-tight">
        Prochains<br />rendez-vous
      </h3>

      {/* Calendar Strip */}
      <div className="flex justify-between mb-10">
        {days.map((d) => (
          <div key={d.date} className="flex flex-col items-center">
            <span className={`text-lg font-bold mb-1 ${d.active ? 'text-white' : 'text-text-primary'}`}>
              {d.active ? (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                  {d.date}
                </div>
              ) : (
                d.date
              )}
            </span>
            <span className={`text-xs font-bold uppercase tracking-widest ${d.active ? 'text-primary' : 'text-text-muted'}`}>
              {d.day}
            </span>
          </div>
        ))}
      </div>

      {/* Appointment Slots */}
      <div className="flex flex-col gap-4">
        {todayAppointments.length > 0 ? (
          todayAppointments.slice(0, 3).map((apt, index) => (
            <div key={apt.id} className="flex items-center gap-4">
              <div className="w-[52px] text-right">
                <p className="text-xs font-bold text-text-muted leading-tight tabular">
                  {apt.startTime.split(':')[0]}.{apt.startTime.split(':')[1]}<br />
                  {parseInt(apt.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                </p>
              </div>
              <div 
                className="flex-1 h-[64px] rounded-pill relative flex items-center pl-14 pr-4 shadow-sm"
                style={{ backgroundColor: index === 0 ? '#FFCF44' : '#3DD6D0' }}
              >
                <div className="absolute left-[-4px] w-[48px] h-[48px] rounded-full border-[3px] border-white overflow-hidden shadow-md">
                  <img 
                    src={`https://picsum.photos/seed/patient-${apt.patientName.toLowerCase().replace(/\s+/g, '-')}/48/48`} 
                    alt="Patient" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-primary leading-none mb-1 truncate max-w-[180px]">{apt.patientName}</span>
                  <span className="text-sm font-bold text-primary/60 leading-none tabular">{apt.startTime} - {apt.endTime}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-4 text-text-muted font-medium">Aucun rendez-vous aujourd'hui</p>
        )}

        {/* Add New Slot */}
        {user?.role === 'SECRETARY' && (
          <div className="flex items-center gap-4">
            <div className="w-[52px] text-right">
              <p className="text-[12px] font-bold text-text-muted leading-tight">--.--<br />--</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 h-[64px] bg-[#F3F4F6] rounded-pill flex items-center px-6 gap-3 hover:bg-bg-soft transition-colors group"
            >
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                <Plus size={16} />
              </div>
              <span className="text-[14px] font-bold text-text-muted group-hover:text-primary transition-colors">Ajouter un rendez-vous</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
