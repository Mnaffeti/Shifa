import { Search, Download, Plus, X, Edit2, Clock } from 'lucide-react';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { useState } from 'react';
import AppointmentFormModal from '../components/AppointmentFormModal';

const TYPE_FR: Record<string, string> = {
  'Consultation': 'Consultation',
  'Follow-up': 'Suivi',
  'Surgery': 'Chirurgie',
  'Cancelled': 'Annulé'
};

export default function SecretaryAppointmentsPage() {
  const { appointments, cancelAppointment, setIsModalOpen } = useAppointments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Confirmed');
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  const filteredAppointments = appointments
    .filter(apt => {
      const matchesSearch =
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date));

  const exportToCSV = () => {
    const headers = ['Patient', 'Date', 'Heure', 'Type', 'Statut'];
    const rows = filteredAppointments.map(apt => [
      apt.patientName, apt.date, apt.startTime, apt.type, apt.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rendez-vous.csv';
    link.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Tous les rendez-vous</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-pill text-sm font-bold text-text-secondary hover:bg-bg-soft transition-all"
          >
            <Download size={18} />
            Exporter CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-primary font-bold rounded-pill shadow-md hover:brightness-105 transition-all text-base"
          >
            <Plus size={18} />
            Ajouter un rendez-vous
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Rechercher par patient..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-border-subtle rounded-pill text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          {[
            { value: 'Confirmed', label: 'En attente' },
            { value: 'Completed', label: 'Terminé' },
            { value: 'Cancelled', label: 'Annulé' },
            { value: 'All', label: 'Voir tout' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-pill text-sm font-bold transition-all border ${
                statusFilter === f.value
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-text-secondary border-border-subtle hover:border-primary/40 hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AppointmentFormModal
        isOpen={!!editingApt}
        onClose={() => setEditingApt(null)}
        initialData={editingApt ?? undefined}
        isEdit
      />

      <div className="flex flex-col gap-3">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-12 text-center">
            <p className="text-text-muted font-medium">Aucun rendez-vous trouvé.</p>
          </div>
        ) : (
          filteredAppointments.map(apt => {
            const isDone = apt.status === 'Completed';
            const isCancelled = apt.status === 'Cancelled';

            return (
              <div
                key={apt.id}
                className={`bg-white rounded-[20px] shadow-card border p-5 flex items-center gap-5 transition-all ${
                  isCancelled ? 'border-border-subtle opacity-50' :
                  isDone ? 'border-border-subtle opacity-70' :
                  'border-border-subtle'
                }`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border-subtle shrink-0">
                  <img
                    src={`https://picsum.photos/seed/patient-${apt.patientName.toLowerCase().replace(/\s+/g, '-')}/56/56`}
                    alt={apt.patientName}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-text-primary">{apt.patientName}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide ${
                      isDone ? 'bg-green-100 text-green-700' :
                      isCancelled ? 'bg-gray-100 text-gray-500' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {isDone ? 'Terminé' : isCancelled ? 'Annulé' : 'Confirmé'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary font-medium">
                    <span>{apt.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {apt.startTime} – {apt.endTime}
                    </span>
                    <span>{TYPE_FR[apt.type] || apt.type}</span>
                    {apt.duration && <span className="text-text-muted">{apt.duration} min</span>}
                  </div>
                </div>

                {!isDone && !isCancelled && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingApt(apt)}
                      className="p-2.5 rounded-xl hover:bg-bg-soft transition-colors text-text-muted hover:text-primary"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => cancelAppointment(apt.id)}
                      className="p-2.5 rounded-xl hover:bg-red-50 transition-colors text-text-muted hover:text-red-500"
                      title="Annuler"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
