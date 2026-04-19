import { Eye, Edit2, Trash2, MoreVertical, FileText } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import PrescriptionModal from './PrescriptionModal';

const TYPE_COLORS: Record<string, string> = {
  'Consultation': 'bg-amber-100 text-amber-700',
  'Follow-up': 'bg-cyan-100 text-cyan-700',
  'Surgery': 'bg-red-100 text-red-700',
  'Cancelled': 'bg-gray-100 text-gray-500'
};

export default function AppointmentTable() {
  const { appointments } = useAppointments();
  const { user } = useAuth();
  const [prescriptionPatient, setPrescriptionPatient] = useState<string | null>(null);

  const filteredAppointments = user?.role === 'DOCTOR' 
    ? appointments.filter(apt => apt.doctor === user.name)
    : appointments;

  return (
    <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-border-subtle">
        <h3 className="text-2xl font-bold text-text-primary">Rendez-vous récents</h3>
        <button className="p-2 hover:bg-bg-soft rounded-full transition-colors">
          <MoreVertical size={20} className="text-text-muted" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4 table-header">Patient</th>
              <th className="px-6 py-4 table-header">Médecin</th>
              <th className="px-6 py-4 table-header">Type</th>
              {user?.role === 'DOCTOR' && (
                <th className="px-6 py-4 table-header text-center">Ordonnance</th>
              )}
              <th className="px-6 py-4 table-header">Statut</th>
              <th className="px-6 py-4 table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredAppointments.map((apt) => (
              <tr key={apt.id} className="hover:bg-[#F9FAFB] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-soft overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${apt.patientName}/40/40`} 
                        alt={apt.patientName} 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <span className="text-base font-bold text-text-primary block">{apt.patientName}</span>
                      <span className="text-xs text-text-muted font-bold tabular">{apt.startTime}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-soft overflow-hidden border border-border-subtle">
                      <img 
                        src={`https://picsum.photos/seed/doctor-${apt.doctor.toLowerCase().replace(/\s+/g, '-')}/40/40`} 
                        alt={apt.doctor} 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-sm text-text-secondary font-medium">{apt.doctor}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] font-normal text-text-primary">
                    {apt.type === 'Consultation' ? 'Consultation' :
                     apt.type === 'Follow-up' ? 'Suivi' :
                     apt.type === 'Surgery' ? 'Chirurgie' :
                     apt.type === 'Cancelled' ? 'Annulé' : apt.type}
                  </span>
                </td>
                {user?.role === 'DOCTOR' && (
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setPrescriptionPatient(apt.patientName)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/5 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                    >
                      <FileText size={14} />
                      Ordonnance
                    </button>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ 
                        backgroundColor: apt.status === 'Completed' ? '#1A6B5A' : '#2B7FBF' 
                      }} 
                    />
                    <span className="text-[13px] font-normal text-text-primary">
                      {apt.status === 'Completed' ? 'Terminé' : 
                       apt.status === 'Confirmed' ? 'Confirmé' : 
                       apt.status === 'Pending' ? 'En attente' : 
                       apt.status === 'Cancelled' ? 'Annulé' : apt.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-text-muted hover:text-primary transition-colors">
                      <Eye size={16} />
                    </button>
                    <button className="p-1.5 text-text-muted hover:text-primary transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PrescriptionModal 
        isOpen={!!prescriptionPatient} 
        onClose={() => setPrescriptionPatient(null)} 
        patientName={prescriptionPatient || ''} 
      />
    </div>
  );
}
