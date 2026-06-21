import React, { useState } from 'react';
import { Search, Plus, Eye, Trash2, X, Pencil, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePatients, Patient } from '../context/PatientContext';
import { Appointment } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import AppointmentFormModal from '../components/AppointmentFormModal';
import ConsultationPage from '../components/ConsultationPage';
import PatientChartPage from '../components/PatientChartPage';

const TODAY = new Date().toISOString().split('T')[0];

type DateFilter = 'all' | 'today' | 'last_week' | 'last_month';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Tous les patients',
  today: "Aujourd'hui",
  last_week: 'Cette semaine',
  last_month: 'Ce mois',
};

function formatDisplayDate(isoDate: string): string {
  if (!isoDate || isoDate === 'Never') return isoDate;
  try {
    return format(parseISO(isoDate), 'dd/MM/yyyy');
  } catch {
    return isoDate;
  }
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function PatientsPage() {
  const { patients, deletePatient } = usePatients();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const canAddOrEdit = user?.role === 'SECRETARY' || user?.role === 'DOCTOR';

  const filteredPatients = patients.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName} ${p.id} ${p.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesDoctor = user?.role === 'DOCTOR' ? p.assignedDoctor === user.name : true;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const createdAt = p.createdAt ? parseISO(p.createdAt) : null;
      if (!createdAt) {
        matchesDate = false;
      } else if (dateFilter === 'today') {
        matchesDate = p.createdAt === TODAY;
      } else if (dateFilter === 'last_week') {
        matchesDate = createdAt >= subDays(new Date(), 7);
      } else if (dateFilter === 'last_month') {
        matchesDate = createdAt >= subMonths(new Date(), 1);
      }
    }

    return matchesSearch && matchesDoctor && matchesDate;
  });

  if (selectedPatient) {
    const currentPatient = patients.find(p => p.id === selectedPatient.id) ?? selectedPatient;
    return (
      <PatientChartView
        patient={currentPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-heading tracking-tight leading-tight">Patients</h1>
          <p className="text-sm text-text-muted font-medium mt-1">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
            {dateFilter !== 'all' ? ` · ${DATE_FILTER_LABELS[dateFilter]}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
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

          {/* Date filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-pill font-bold text-sm border border-border-subtle bg-white shadow-sm hover:bg-bg-soft transition-all text-text-secondary"
            >
              {DATE_FILTER_LABELS[dateFilter]}
              <ChevronDown size={15} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-border-subtle rounded-2xl shadow-lg z-50 overflow-hidden"
                >
                  {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map(key => (
                    <button
                      key={key}
                      onClick={() => { setDateFilter(key); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-bg-soft ${
                        dateFilter === key ? 'text-primary font-bold' : 'text-text-secondary'
                      }`}
                    >
                      {DATE_FILTER_LABELS[key]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Patient — both doctor and secretary */}
          {canAddOrEdit && (
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

      {/* Patient table */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-12 text-center">
          <p className="text-text-muted font-medium mb-4">Aucun patient trouvé.</p>
          {dateFilter !== 'all' && (
            <button
              onClick={() => setDateFilter('all')}
              className="px-6 py-2.5 bg-primary text-white rounded-pill font-bold text-sm hover:opacity-90 transition-all"
            >
              Voir tous les patients
            </button>
          )}
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
                <th className="px-6 py-4 table-header">Ajouté le</th>
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
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium">{p.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium tabular">
                    {calcAge(p.dob)} ans
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary font-medium tabular">
                    {formatDisplayDate(p.createdAt)}
                  </td>
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
                        title="Voir profil"
                      >
                        <Eye size={18} />
                      </button>
                      {canAddOrEdit && (
                        <button
                          onClick={() => setEditingPatient(p)}
                          className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {user?.role === 'SECRETARY' && (
                        <button
                          onClick={() => deletePatient(p.id)}
                          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                          title="Supprimer"
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

      {/* Add modal */}
      <PatientFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="add"
      />

      {/* Edit modal */}
      <PatientFormModal
        isOpen={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        mode="edit"
        patient={editingPatient ?? undefined}
      />
    </div>
  );
}

// ─── Shared Add/Edit Modal ──────────────────────────────────────────────────

type FormData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  assignedDoctor: string;
  bloodType: string;
};

const EMPTY_FORM: FormData = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'Homme',
  phone: '',
  email: '',
  address: '',
  assignedDoctor: 'Dr. Youssef',
  bloodType: 'A+'
};

function patientToForm(p: Patient): FormData {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    dob: p.dob,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    address: p.address,
    assignedDoctor: p.assignedDoctor,
    bloodType: p.bloodType
  };
}

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  patient?: Patient;
}

function PatientFormModal({ isOpen, onClose, mode, patient }: PatientFormModalProps) {
  const { addPatient, updatePatient } = usePatients();
  const [formData, setFormData] = useState<FormData>(
    mode === 'edit' && patient ? patientToForm(patient) : EMPTY_FORM
  );

  // Sync when the patient prop changes (different patient opened for edit)
  React.useEffect(() => {
    if (isOpen) {
      setFormData(mode === 'edit' && patient ? patientToForm(patient) : EMPTY_FORM);
    }
  }, [isOpen, patient, mode]);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'add') {
      addPatient(formData);
    } else if (patient) {
      updatePatient(patient.id, formData);
    }
    onClose();
  };

  // Prevent Enter from submitting when a non-submit field is focused and fields aren't filled
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'BUTTON') {
        e.preventDefault();
      }
    }
  };

  const title = mode === 'add' ? 'Ajouter un nouveau patient' : 'Modifier le patient';

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
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-8 grid grid-cols-2 gap-6">
              {/* Prénom */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={set('firstName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={set('lastName')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dob}
                  onChange={e => {
                    // Allow only digits and dashes, enforce DD/MM/YYYY → stored as YYYY-MM-DD
                    setFormData(prev => ({ ...prev, dob: e.target.value }));
                  }}
                  onBlur={e => {
                    // Parse and normalise to YYYY-MM-DD on blur
                    const val = e.target.value.trim();
                    // Accept YYYY-MM-DD or DD/MM/YYYY
                    const dmyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                    if (dmyMatch) {
                      const [, d, m, y] = dmyMatch;
                      setFormData(prev => ({
                        ...prev,
                        dob: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
                      }));
                    }
                  }}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Genre</label>
                <select
                  value={formData.gender}
                  onChange={set('gender')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </div>

              {/* Téléphone — optional */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={set('phone')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Email — optional */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={set('email')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Adresse — optional */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={set('address')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Groupe sanguin */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Groupe sanguin</label>
                <select
                  value={formData.bloodType}
                  onChange={set('bloodType')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                    <option key={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
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
                  {mode === 'add' ? 'Sauvegarder Patient' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Patient Chart View (full dossier) ──────────────────────────────────────

function PatientChartView({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const [overlayAppointment, setOverlayAppointment] = useState<Appointment | null>(null);

  return (
    <>
      <PatientChartPage
        patient={patient}
        onBack={onBack}
        onOpenConsultation={apt => setOverlayAppointment(apt)}
      />

      <AnimatePresence>
        {overlayAppointment && (
          <ConsultationPage
            appointment={overlayAppointment}
            onClose={() => setOverlayAppointment(null)}
            onNavigate={setOverlayAppointment}
          />
        )}
      </AnimatePresence>
    </>
  );
}
