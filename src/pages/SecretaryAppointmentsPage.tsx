import { Search, Filter, Download, Plus, MoreVertical, Check, X, Edit2 } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';
import { useState } from 'react';

export default function SecretaryAppointmentsPage() {
  const { appointments, confirmAppointment, cancelAppointment, setIsModalOpen } = useAppointments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         apt.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status'];
    const rows = filteredAppointments.map(apt => [
      apt.id, apt.patientName, apt.doctor, apt.date, apt.startTime, apt.type, apt.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "appointments_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            className="flex items-center gap-2 px-6 py-2 bg-[#C8E04A] text-primary font-bold rounded-pill shadow-md hover:brightness-105 transition-all"
          >
            <Plus size={18} />
            Ajouter un rendez-vous
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par patient ou médecin..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-bg-soft rounded-pill text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="text-text-muted" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-soft border-none rounded-pill px-4 py-2.5 text-sm font-bold text-text-secondary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="All">Tous les statuts</option>
              <option value="Pending">En attente</option>
              <option value="Confirmed">Confirmé</option>
              <option value="Completed">Terminé</option>
              <option value="Cancelled">Annulé</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Date & Heure</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Médecin</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-bg-soft/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary">{apt.date}</span>
                      <span className="text-[11px] text-text-muted font-bold">{apt.startTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-text-primary">{apt.patientName}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium">{apt.doctor}</td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] font-normal text-text-primary">
                      {apt.type === 'Consultation' ? 'Consultation' :
                       apt.type === 'Follow-up' ? 'Suivi' :
                       apt.type === 'Surgery' ? 'Chirurgie' :
                       apt.type === 'Cancelled' ? 'Annulé' : apt.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ 
                          backgroundColor: apt.status === 'Confirmed' || apt.status === 'Completed' ? '#1A6B5A' : 
                                           apt.status === 'Cancelled' ? '#9A9A9A' : '#2B7FBF' 
                        }} 
                      />
                      <span className="text-[13px] font-normal text-text-primary">
                        {apt.status === 'Confirmed' ? 'Confirmé' : 
                         apt.status === 'Cancelled' ? 'Annulé' : 
                         apt.status === 'Pending' ? 'En attente' : 
                         apt.status === 'Completed' ? 'Terminé' : apt.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {apt.status === 'Pending' && (
                        <button 
                          onClick={() => confirmAppointment(apt.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      {apt.status !== 'Cancelled' && (
                        <button 
                          onClick={() => cancelAppointment(apt.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
