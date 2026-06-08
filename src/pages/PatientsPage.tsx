import React, { useState } from 'react';
import { Search, Plus, Eye, Trash2, ChevronLeft, Phone, Mail, MapPin, Droplets, X, FileText, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePatients, Patient } from '../context/PatientContext';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';
import { useConsultations } from '../context/ConsultationContext';
import { format } from 'date-fns';
import AppointmentFormModal from '../components/AppointmentFormModal';
import PatientDetailOverlay from '../components/PatientDetailOverlay';

const TODAY = new Date().toISOString().split('T')[0];

export default function PatientsPage() {
  const { patients, addPatient, deletePatient } = usePatients();
  const { appointments } = useAppointments();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const todayPatientIds = new Set(
    appointments.filter(a => a.date === TODAY).map(a => a.patientId)
  );

  const filteredPatients = patients.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName} ${p.id} ${p.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDoctor = user?.role === 'DOCTOR' ? p.assignedDoctor === user.name : true;
    const matchesToday = showAll || todayPatientIds.has(p.id);
    return matchesSearch && matchesDoctor && matchesToday;
  });

  if (selectedPatient) {
    return <PatientProfile patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-heading tracking-tight leading-tight">Patients</h1>
          <p className="text-sm text-text-muted font-medium mt-1">
            {showAll ? `${filteredPatients.length} patients` : `${filteredPatients.length} patients aujourd'hui`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, ID, téléphone..."
              className="pl-11 pr-4 py-2.5 rounded-pill border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white shadow-sm w-72 text-sm"
            />
          </div>
          <button
            onClick={() => setShowAll(v => !v)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-pill font-bold text-sm transition-all border ${
              showAll
                ? 'bg-bg-soft border-border-subtle text-text-secondary'
                : 'bg-primary text-white border-primary'
            }`}
          >
            <Users size={16} />
            {showAll ? "Aujourd'hui" : 'Voir tous'}
          </button>
          {user?.role === 'SECRETARY' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-accent text-primary px-6 py-2.5 rounded-pill font-bold text-sm shadow-md hover:brightness-110 transition-all active:scale-95"
            >
              <Plus size={18} />
              Ajouter Patient
            </button>
          )}
        </div>
      </div>

      {filteredPatients.length === 0 && !showAll ? (
        <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-12 text-center">
          <p className="text-text-muted font-medium mb-4">Aucun patient prévu aujourd'hui.</p>
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-pill font-bold text-sm hover:opacity-90 transition-all"
          >
            Voir tous les patients
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 table-header">Nom du Patient</th>
                <th className="px-6 py-4 table-header">ID Patient</th>
                <th className="px-6 py-4 table-header">Téléphone</th>
                <th className="px-6 py-4 table-header">Âge</th>
                <th className="px-6 py-4 table-header">Dernière visite</th>
                <th className="px-6 py-4 table-header">Statut</th>
                <th className="px-6 py-4 table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-bg-soft/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border-subtle">
                        <img src={p.avatar} alt={p.firstName} referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-base font-bold text-text-primary">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-base font-bold text-primary tabular">{p.id}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium">{p.phone}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium tabular">
                    {new Date().getFullYear() - new Date(p.dob).getFullYear()} ans
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium tabular">{p.lastVisit}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: p.status === 'Active' ? '#1A6B5A' :
                                           p.status === 'New' ? '#2B7FBF' : '#9A9A9A'
                        }}
                      />
                      <span className="text-[13px] font-normal text-text-primary">
                        {p.status === 'Active' ? 'Actif' : p.status === 'New' ? 'Nouveau' : 'Inactif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      {user?.role === 'SECRETARY' && (
                        <button
                          onClick={() => deletePatient(p.id)}
                          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddPatientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}

function AddPatientModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addPatient } = usePatients();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Homme',
    phone: '',
    email: '',
    address: '',
    assignedDoctor: 'Dr. Youssef',
    bloodType: 'A+'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPatient(formData);
    onClose();
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
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-primary text-white">
              <h2 className="text-xl font-bold">Ajouter un nouveau patient</h2>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Prénom</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Genre</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Groupe sanguin</label>
                <select
                  value={formData.bloodType}
                  onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                    <option key={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-border-subtle font-bold text-text-secondary hover:bg-bg-soft transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-accent text-primary font-bold shadow-lg hover:brightness-110 transition-all active:scale-95"
                >
                  Sauvegarder Patient
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PatientProfile({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('Info');
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [overlayAppointment, setOverlayAppointment] = useState<Appointment | null>(null);
  const { appointments } = useAppointments();
  const { findByAppointment } = useConsultations();
  const patientAppointments = appointments
    .filter(a => a.patientId === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const TYPE_FR: Record<string, string> = {
    'Consultation': 'Consultation',
    'Follow-up': 'Suivi',
    'Surgery': 'Chirurgie',
    'Cancelled': 'Annulé'
  };

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-primary font-bold hover:underline w-fit">
        <ChevronLeft size={20} />
        Retour aux patients
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-8 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full border-4 border-accent overflow-hidden mb-6 shadow-xl">
            <img src={patient.avatar} alt={patient.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-extrabold text-text-primary mb-1">{patient.firstName} {patient.lastName}</h2>
          <p className="text-primary font-bold mb-6">{patient.id}</p>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="bg-bg-soft p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Âge</p>
              <p className="text-lg font-bold text-text-primary">
                {new Date().getFullYear() - new Date(patient.dob).getFullYear()}
              </p>
            </div>
            <div className="bg-bg-soft p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Groupe Sanguin</p>
              <div className="flex items-center justify-center gap-2">
                <Droplets size={16} className="text-red-500" />
                <p className="text-lg font-bold text-text-primary">{patient.bloodType}</p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase">Téléphone</p>
                <p className="text-sm font-bold text-text-primary">{patient.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase">Email</p>
                <p className="text-sm font-bold text-text-primary">{patient.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase">Adresse</p>
                <p className="text-sm font-bold text-text-primary">{patient.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden flex flex-col">
          <div className="flex border-b border-border-subtle px-6">
            {[
              { id: 'Info', label: 'Info' },
              { id: 'Appointments', label: 'Rendez-vous' },
              { id: 'Ordonnances', label: 'Ordonnances' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-bold transition-all relative ${
                  activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 p-8">
            {activeTab === 'Info' && (
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-text-muted uppercase mb-4 tracking-wider">Antécédents Médicaux</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-bg-soft rounded-2xl border border-border-subtle">
                      <p className="text-sm font-bold text-text-primary mb-1">Hypertension</p>
                      <p className="text-xs text-text-secondary">Diagnostiqué en 2020.</p>
                    </div>
                    <div className="p-4 bg-bg-soft rounded-2xl border border-border-subtle">
                      <p className="text-sm font-bold text-text-primary mb-1">Allergies</p>
                      <p className="text-xs text-text-secondary">Pénicilline, Cacahuètes.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-muted uppercase mb-4 tracking-wider">Notes Récentes</h4>
                  <div className="p-6 bg-accent/10 rounded-2xl border border-accent/20 italic text-sm text-primary font-medium">
                    "Amélioration de la qualité du sommeil après ajustement du dosage."
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Appointments' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsRdvModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-primary font-bold rounded-pill text-sm shadow-sm hover:brightness-110 transition-all active:scale-95"
                  >
                    <Plus size={16} />
                    Ajouter un RDV
                  </button>
                </div>
                {patientAppointments.length > 0 ? (
                  patientAppointments.map(apt => {
                    const consultation = findByAppointment(apt.id);
                    const hasSigned = consultation?.status === 'signed';
                    return (
                      <div
                        key={apt.id}
                        onClick={() => hasSigned && setOverlayAppointment(apt)}
                        className={`flex items-center justify-between p-4 bg-bg-soft rounded-2xl border border-border-subtle transition-all ${
                          hasSigned ? 'cursor-pointer hover:border-primary/30 hover:shadow-sm hover:bg-white' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-text-muted uppercase leading-none mb-1">
                              {format(new Date(apt.date), 'MMM')}
                            </span>
                            <span className="text-lg font-black text-primary leading-none">
                              {format(new Date(apt.date), 'd')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">{TYPE_FR[apt.type] || apt.type}</p>
                            <p className="text-xs text-text-secondary font-medium">{apt.doctor} · {apt.startTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasSigned && (
                            <div className="flex items-center gap-1 text-primary">
                              <Eye size={13} />
                              <span className="text-[11px] font-bold">Voir</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: apt.status === 'Completed' ? '#1A6B5A' : '#2B7FBF' }}
                            />
                            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-primary">
                              {apt.status === 'Completed' ? 'Terminé' :
                               apt.status === 'Confirmed' ? 'Confirmé' :
                               apt.status === 'Cancelled' ? 'Annulé' : 'En attente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-12 text-text-muted font-medium">Aucun rendez-vous trouvé.</p>
                )}
              </div>
            )}

            {activeTab === 'Ordonnances' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-soft rounded-2xl border border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Ordonnance #ORD-2024-001</p>
                      <p className="text-xs text-text-secondary font-medium">Délivrée le 10 avril 2024</p>
                    </div>
                  </div>
                  <button className="text-primary font-bold text-sm hover:underline">Voir PDF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AppointmentFormModal
        isOpen={isRdvModalOpen}
        onClose={() => setIsRdvModalOpen(false)}
        initialData={{
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`
        }}
      />

      <AnimatePresence>
        {overlayAppointment && (
          <PatientDetailOverlay
            appointment={overlayAppointment}
            onClose={() => setOverlayAppointment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
