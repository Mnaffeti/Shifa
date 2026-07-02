import { useState } from 'react';
import { Calendar, UserPlus, XCircle, Plus, X, Edit2, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import StatCard from './StatCard';
import AppointmentFormModal from './AppointmentFormModal';
import RemindersSection from './RemindersSection';

const TYPE_FR: Record<string, string> = {
  'Consultation': 'Consultation',
  'Follow-up': 'Suivi',
  'Surgery': 'Chirurgie',
  'Cancelled': 'Annulé'
};

export default function SecretaryDashboard() {
  const { appointments, cancelAppointment, setIsModalOpen } = useAppointments();
  const { patients } = usePatients();

  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const handleConfirmCancel = () => {
    if (cancelTarget) {
      cancelAppointment(cancelTarget.id);
      setCancelTarget(null);
    }
  };

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
                      onClick={() => setEditingApt(apt)}
                      className="p-3 rounded-xl hover:bg-bg-soft transition-colors text-text-muted hover:text-primary"
                      title="Modifier"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => setCancelTarget(apt)}
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

      <RemindersSection />

      <AppointmentFormModal
        isOpen={!!editingApt}
        onClose={() => setEditingApt(null)}
        initialData={editingApt ?? undefined}
        isEdit
      />

      <AnimatePresence>
        {cancelTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelTarget(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Annuler le rendez-vous ?</h2>
                  <p className="text-text-secondary font-medium mt-1">
                    Le rendez-vous de <span className="font-bold text-text-primary">{cancelTarget.patientName}</span> à{' '}
                    <span className="font-bold text-text-primary">{cancelTarget.startTime}</span> sera annulé.
                    Cette action peut être retrouvée dans les rendez-vous annulés.
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setCancelTarget(null)}
                    className="flex-1 px-4 py-2.5 rounded-btn border border-border-subtle font-bold text-text-secondary hover:bg-bg-soft transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="flex-1 px-4 py-2.5 rounded-btn bg-red-500 text-white font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
                  >
                    Annuler le RDV
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
