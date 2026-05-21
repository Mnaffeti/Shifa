import { useState } from 'react';
import { ChevronLeft, Phone, Mail, Droplets, FileText, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Appointment } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import { useAppointments } from '../context/AppointmentContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  appointment: Appointment;
  onClose: () => void;
}

const TYPE_FR: Record<string, string> = {
  'Consultation': 'Consultation',
  'Follow-up': 'Suivi',
  'Surgery': 'Chirurgie',
  'Cancelled': 'Annulé'
};

export default function PatientDetailOverlay({ appointment, onClose }: Props) {
  const { patients } = usePatients();
  const { appointments, markAsCompleted } = useAppointments();

  const patient = patients.find(p => p.id === appointment.patientId);

  const [prescription, setPrescription] = useState(
    () => localStorage.getItem(`shifa_rx_${appointment.patientId}`) || ''
  );
  const [saved, setSaved] = useState(false);

  const history = appointments
    .filter(a => a.patientId === appointment.patientId && a.id !== appointment.id && a.status === 'Completed')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const handleSave = () => {
    localStorage.setItem(`shifa_rx_${appointment.patientId}`, prescription);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDone = () => {
    if (prescription) localStorage.setItem(`shifa_rx_${appointment.patientId}`, prescription);
    markAsCompleted(appointment.id);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] bg-[#F8FAF9] overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto px-8 py-8">
        <button onClick={onClose} className="flex items-center gap-2 text-primary font-bold mb-8 hover:underline">
          <ChevronLeft size={20} />
          Retour
        </button>

        <div className="grid grid-cols-[300px_1fr] gap-8">
          <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-8 flex flex-col items-center text-center h-fit sticky top-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent shadow-lg mb-4">
              <img
                src={patient?.avatar || `https://picsum.photos/seed/${appointment.patientName}/100/100`}
                alt={appointment.patientName}
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary mb-1">{appointment.patientName}</h2>
            <p className="text-sm font-bold text-primary mb-1">{appointment.patientId}</p>
            <p className="text-xs text-text-muted font-medium mb-6">
              {TYPE_FR[appointment.type] || appointment.type} · {appointment.startTime}
            </p>

            {patient && (
              <div className="w-full space-y-3 text-left border-t border-border-subtle pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <Phone size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{patient.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <Mail size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <Droplets size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{patient.bloodType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase">Dernière visite</p>
                    <p className="text-sm font-medium text-text-primary">{patient.lastVisit}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {history.length > 0 && (
              <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
                <h3 className="text-base font-bold text-text-primary mb-4">Historique des consultations</h3>
                <div className="space-y-3">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-3 p-3 bg-bg-soft rounded-xl">
                      <div className="w-10 h-10 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0">
                        <span className="text-[9px] font-bold text-text-muted uppercase leading-none">
                          {format(new Date(h.date), 'MMM', { locale: fr })}
                        </span>
                        <span className="text-base font-black text-primary leading-none">
                          {format(new Date(h.date), 'd')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{TYPE_FR[h.type] || h.type}</p>
                        {h.notes && (
                          <p className="text-xs text-text-muted truncate max-w-[320px]">{h.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-text-primary">Ordonnance</h3>
                </div>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-pill bg-primary/5 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                >
                  {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
                </button>
              </div>
              <textarea
                value={prescription}
                onChange={e => setPrescription(e.target.value)}
                className="w-full min-h-[160px] p-4 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm text-text-primary placeholder:text-text-muted"
                placeholder="Médicaments, posologie, instructions..."
              />
            </div>

            <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
              <h3 className="text-base font-bold text-text-primary mb-4">Clôturer la consultation</h3>
              <button
                onClick={handleDone}
                className="w-full px-6 py-3 bg-accent text-primary font-bold rounded-pill shadow-md hover:brightness-110 transition-all active:scale-95"
              >
                Terminer la consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
