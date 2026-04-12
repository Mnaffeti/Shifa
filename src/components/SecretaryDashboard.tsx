import { Calendar, CheckCircle2, UserPlus, XCircle, Plus, MoreVertical, Check, X, Edit2 } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import StatCard from './StatCard';
import { motion } from 'motion/react';

export default function SecretaryDashboard() {
  const { appointments, confirmAppointment, cancelAppointment, setIsModalOpen } = useAppointments();
  const { patients } = usePatients();

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingConfirmations = appointments.filter(a => a.status === 'Pending');
  const newPatientsToday = patients.filter(p => p.status === 'New').length; // Simplified
  const cancelledToday = appointments.filter(a => a.date === today && a.status === 'Cancelled').length;

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Calendar}
          label="Today's Appointments"
          value={todayAppointments.length.toString()}
          update="+2"
        />
        <StatCard
          icon={CheckCircle2}
          label="Pending Confirmations"
          value={pendingConfirmations.length.toString()}
          update="-1"
        />
        <StatCard
          icon={UserPlus}
          label="New Patients Today"
          value={newPatientsToday.toString()}
          update="+3"
        />
        <StatCard
          icon={XCircle}
          label="Cancelled Today"
          value={cancelledToday.toString()}
          update="0"
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-primary">Today's Appointment List</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#C8E04A] text-primary font-bold rounded-pill shadow-md hover:brightness-105 transition-all active:scale-95"
          >
            <Plus size={18} />
            Quick Add Appointment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-bg-soft/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-text-primary">{apt.startTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-text-primary">{apt.patientName}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary font-medium">{apt.doctor}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-pill bg-bg-soft text-text-secondary text-[10px] font-bold uppercase">
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-pill text-[10px] font-bold uppercase ${
                        apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === 'Pending' && (
                          <button 
                            onClick={() => confirmAppointment(apt.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all"
                            title="Confirm"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {apt.status !== 'Cancelled' && (
                          <button 
                            onClick={() => cancelAppointment(apt.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        )}
                        <button className="p-2 text-text-muted hover:text-primary transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 text-text-muted hover:text-primary transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted font-medium">
                    No appointments scheduled for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
