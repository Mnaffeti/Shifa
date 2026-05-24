import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppointments, Appointment, AppointmentType } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Appointment>;
  isEdit?: boolean;
}

const DEFAULT_DURATION = 30;

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function AppointmentFormModal({ isOpen, onClose, initialData, isEdit }: Props) {
  const { addAppointment, updateAppointment, deleteAppointment, appointments } = useAppointments();
  const { patients } = usePatients();
  const [conflict, setConflict] = useState<Appointment | null>(null);

  const [formData, setFormData] = useState<Partial<Appointment>>({
    patientId: '',
    patientName: '',
    doctor: 'Dr. Youssef',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '09:30',
    duration: DEFAULT_DURATION,
    type: 'Consultation',
    status: 'Confirmed',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
    setConflict(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.date || !formData.startTime || !formData.endTime) {
      setConflict(null);
      return;
    }
    const newStart = toMinutes(formData.startTime);
    const newEnd = toMinutes(formData.endTime);
    const found = appointments.find(apt => {
      if (apt.status === 'Cancelled' || apt.status === 'Completed') return false;
      if (isEdit && apt.id === initialData?.id) return false;
      if (apt.date !== formData.date) return false;
      if (apt.doctor !== formData.doctor) return false;
      const aptStart = toMinutes(apt.startTime);
      const aptEnd = toMinutes(apt.endTime);
      return newStart < aptEnd && newEnd > aptStart;
    });
    setConflict(found ?? null);
  }, [isOpen, appointments, formData.date, formData.startTime, formData.endTime, formData.doctor]);

  const handleStartTimeChange = (startTime: string) => {
    const duration = formData.duration || DEFAULT_DURATION;
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime: addMinutes(startTime, duration)
    }));
  };

  const handleDurationChange = (duration: number) => {
    setFormData(prev => ({
      ...prev,
      duration,
      endTime: addMinutes(prev.startTime || '09:00', duration)
    }));
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patient = patients.find(p => p.id === e.target.value);
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict) return;
    if (isEdit && initialData?.id) {
      updateAppointment(initialData.id, formData);
    } else {
      addAppointment(formData as Omit<Appointment, 'id'>);
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialData?.id && window.confirm('Supprimer ce rendez-vous ?')) {
      deleteAppointment(initialData.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-primary text-white">
              <h2 className="text-xl font-bold">{isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h2>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Patient</label>
                <select
                  value={formData.patientId}
                  onChange={handlePatientChange}
                  className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as AppointmentType }))}
                  className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Suivi</option>
                  <option value="Surgery">Chirurgie</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Durée (min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={e => handleDurationChange(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                    min={5}
                    step={5}
                  />
                </div>
              </div>

              <p className="text-xs text-text-muted font-medium">
                Fin prévue : <span className="font-bold text-text-primary">{formData.endTime}</span>
              </p>

              {conflict && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span>
                    <span className="font-bold">Créneau déjà réservé</span> — {conflict.patientName} a un RDV de {conflict.startTime} à {conflict.endTime}.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                  placeholder="Instructions particulières..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-btn border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                )}
                <div className="flex-1 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-btn border border-border-subtle font-bold text-text-secondary hover:bg-bg-soft transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!!conflict}
                    className="flex-1 px-4 py-2 rounded-btn bg-accent text-primary font-bold shadow-md hover:brightness-110 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                  >
                    {isEdit ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
