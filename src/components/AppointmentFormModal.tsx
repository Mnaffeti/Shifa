import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, User, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppointments, Appointment, AppointmentType } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Appointment>;
  isEdit?: boolean;
}

export default function AppointmentFormModal({ isOpen, onClose, initialData, isEdit }: AppointmentFormModalProps) {
  const { addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { patients } = usePatients();
  
  const [formData, setFormData] = useState<Partial<Appointment>>({
    patientId: '',
    patientName: '',
    doctor: 'Dr. Renata Moeloek',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    type: 'Consultation',
    status: 'Pending',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && initialData?.id) {
      updateAppointment(initialData.id, formData);
    } else {
      addAppointment(formData as Omit<Appointment, 'id'>);
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialData?.id && window.confirm('Are you sure you want to delete this appointment?')) {
      deleteAppointment(initialData.id);
      onClose();
    }
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patient = patients.find(p => p.id === e.target.value);
    if (patient) {
      setFormData({ ...formData, patientId: patient.id, patientName: `${patient.firstName} ${patient.lastName}` });
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
              <h2 className="text-xl font-bold">{isEdit ? 'Edit Appointment' : 'New Appointment'}</h2>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Patient</label>
                  <select
                    value={formData.patientId}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Doctor</label>
                  <select
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Dr. Renata Moeloek">Dr. Renata Moeloek</option>
                    <option value="Dr. Smith">Dr. Smith</option>
                    <option value="Dr. Adams">Dr. Adams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-btn border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                    placeholder="Add any special instructions..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-btn border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                )}
                <div className="flex-1 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-btn border border-border-subtle font-bold text-text-secondary hover:bg-bg-soft transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-btn bg-accent text-primary font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
                  >
                    {isEdit ? 'Update' : 'Save'} Appointment
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
