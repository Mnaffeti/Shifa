import { Calendar, UserPlus, XCircle, Plus, X, Edit2, Clock } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import StatCard from './StatCard';

const TYPE_FR: Record<string, string> = {
  'Consultation': 'Consultation',
  'Follow-up': 'Suivi',
  'Surgery': 'Chirurgie',
  'Cancelled': 'Annulé'
};

export default function SecretaryDashboard() {
  const { appointments, cancelAppointment, setIsModalOpen } = useAppointments();
  const { patients } = usePatients();

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments
    .filter(a => a.date === today && a.status !== 'Cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const newPatientsToday = patients.filter(p => p.status === 'New').length;
  const cancelledToday = appointments.filter(a => a.date === today && a.status === 'Cancelled').length;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Calendar}
          label="Rendez-vous aujourd'hui"
          value={todayAppointments.length.toString()}
          update="+2"
        />
        <StatCard
          icon={UserPlus}
          label="Nouveaux patients"
          value={newPatientsToday.toString()}
          update="+3"
        />
        <StatCard
          icon={XCircle}
          label="Annulés aujourd'hui"
          value={cancelledToday.toString()}
          update="0"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Planning du jour</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-primary font-bold rounded-pill shadow-md hover:brightness-105 transition-all active:scale-95 text-base"
        >
          <Plus size={20} />
          Nouveau rendez-vous
        </button>
      </div>

      {todayAppointments.length === 0 ? (
        <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-12 text-center">
          <p className="text-text-muted font-medium text-lg mb-4">Aucun rendez-vous prévu aujourd'hui.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 bg-accent text-primary font-bold rounded-pill text-base hover:brightness-110 transition-all"
          >
            Ajouter un rendez-vous
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {todayAppointments.map((apt, index) => {
            const isNext = apt.status === 'Confirmed' && index === todayAppointments.findIndex(a => a.status === 'Confirmed');
            const isDone = apt.status === 'Completed';

            return (
              <div
                key={apt.id}
                className={`bg-white rounded-[20px] shadow-card border p-6 flex items-center gap-6 transition-all ${
                  isNext ? 'border-primary/30 ring-2 ring-primary/10' :
                  isDone ? 'border-border-subtle opacity-60' :
                  'border-border-subtle'
                }`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border-subtle shrink-0">
                  <img
                    src={`https://picsum.photos/seed/patient-${apt.patientName.toLowerCase().replace(/\s+/g, '-')}/64/64`}
                    alt={apt.patientName}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-text-primary">{apt.patientName}</h3>
                    {isNext && (
                      <span className="px-3 py-0.5 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wide">
                        Prochain
                      </span>
                    )}
                    {isDone && (
                      <span className="px-3 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
                        Terminé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-text-secondary">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Clock size={14} />
                      {apt.startTime} – {apt.endTime}
                    </span>
                    <span className="text-sm font-medium">{TYPE_FR[apt.type] || apt.type}</span>
                    {apt.duration && (
                      <span className="text-sm font-medium text-text-muted">{apt.duration} min</span>
                    )}
                  </div>
                </div>

                {!isDone && (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      className="p-3 rounded-xl hover:bg-bg-soft transition-colors text-text-muted hover:text-primary"
                      title="Modifier"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => cancelAppointment(apt.id)}
                      className="p-3 rounded-xl hover:bg-red-50 transition-colors text-text-muted hover:text-red-500"
                      title="Annuler"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
