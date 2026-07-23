import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import RightPanel from '../components/RightPanel';
import DashboardHeader, { QuickAction } from '../components/DashboardHeader';
import KpiRail from '../components/KpiRail';
import DayTimeline from '../components/DayTimeline';
import DashboardCharts from '../components/DashboardCharts';
import CardErrorBoundary from '../components/ui/CardErrorBoundary';
import ConsultationPage from '../components/ConsultationPage';
import PatientFormModal from '../components/PatientFormModal';
import AppointmentFormModal from '../components/AppointmentFormModal';
import PrescriptionModal from '../components/PrescriptionModal';
import { useAuth } from '../context/AuthContext';
import { Appointment, useAppointments } from '../context/AppointmentContext';
import { usePatients, Patient } from '../context/PatientContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { appointments, addAppointment, setCurrentPatientApt } = useAppointments();
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [addRdvOpen, setAddRdvOpen] = useState(false);
  const [pickPatientOpen, setPickPatientOpen] = useState(false);
  const [quickConsultOpen, setQuickConsultOpen] = useState(false);
  const [prescriptionPatient, setPrescriptionPatient] = useState<Patient | null>(null);

  // Only this doctor's appointments feed the timeline / KPIs / header.
  const myAppointments = user?.role === 'DOCTOR'
    ? appointments.filter(a => a.doctor === user.name)
    : appointments;

  const handleAction = (id: QuickAction) => {
    if (id === 'quick') setQuickConsultOpen(true);
    else if (id === 'patient') setAddPatientOpen(true);
    else if (id === 'rdv') setAddRdvOpen(true);
    else if (id === 'ordonnance') setPickPatientOpen(true);
  };

  // Quick consultation: spin up a walk-in appointment at the current time and
  // open the consultation page immediately.
  const handleQuickConsult = (patient: Patient) => {
    setQuickConsultOpen(false);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const end = new Date(now.getTime() + 30 * 60 * 1000);
    const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

    const walkIn: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctor: user?.name ?? 'Dr. Youssef',
      date: new Date().toISOString().split('T')[0],
      startTime,
      endTime,
      duration: 30,
      type: 'Consultation',
      status: 'Confirmed',
      notes: 'Consultation rapide (sans rendez-vous)',
    };

    addAppointment(walkIn);
    setCurrentPatientApt(walkIn.id);
    setActiveAppointment(walkIn);
  };

  return (
    <>
      {/* Sticky header — greeting · date · next patient, + quick actions */}
      <DashboardHeader name={user?.name} appointments={myAppointments} onAction={handleAction} />

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_360px] gap-6 items-start mt-6">
        {/* ── KPI rail ── */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-24">
          <CardErrorBoundary label="Les indicateurs">
            <KpiRail appointments={myAppointments} />
          </CardErrorBoundary>
          <CardErrorBoundary label="Les graphiques">
            <DashboardCharts onCreate={() => setAddRdvOpen(true)} />
          </CardErrorBoundary>
        </div>

        {/* ── Main: today's schedule is the hero ── */}
        <div className="flex flex-col gap-6 min-w-0">
          <CardErrorBoundary label="La timeline">
            <DayTimeline
              appointments={myAppointments}
              onAppointmentClick={setActiveAppointment}
              onBookSlot={() => setAddRdvOpen(true)}
              onCreate={() => setAddRdvOpen(true)}
            />
          </CardErrorBoundary>
        </div>

        {/* ── Side: appointments ── */}
        <div className="xl:sticky xl:top-24">
          <RightPanel onPatientClick={setActiveAppointment} />
        </div>
      </div>

      {/* Sujet du jour — moved to the bottom, light card, 1px border, no dark gradient */}
      <div className="mt-6 bg-white rounded-[16px] border border-border-subtle p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#64748B]">Sujet du jour</span>
        </div>
        <h4 className="text-base font-semibold text-text-primary leading-snug tracking-tight max-w-2xl">
          Comment maintenir une <span className="text-[var(--color-brand)]">santé cardiaque</span> à l'ère du numérique
        </h4>
        <p className="text-sm text-text-secondary mt-1.5 max-w-2xl leading-relaxed">
          Un aperçu des habitudes quotidiennes et du suivi connecté pour vos patients à risque cardiovasculaire.
        </p>
      </div>

      {/* Quick action: add patient */}
      <PatientFormModal
        isOpen={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        mode="add"
      />

      {/* Quick action: new appointment */}
      <AppointmentFormModal
        isOpen={addRdvOpen}
        onClose={() => setAddRdvOpen(false)}
      />

      {/* Quick action: quick consultation — pick the patient, then open the page */}
      <PatientPickerModal
        isOpen={quickConsultOpen}
        onClose={() => setQuickConsultOpen(false)}
        onSelect={handleQuickConsult}
        title="Consultation rapide"
        subtitle="Choisissez le patient — la consultation démarre à l'heure actuelle"
      />

      {/* Quick action: new prescription — pick the patient first */}
      <PatientPickerModal
        isOpen={pickPatientOpen}
        onClose={() => setPickPatientOpen(false)}
        onSelect={patient => {
          setPickPatientOpen(false);
          setPrescriptionPatient(patient);
        }}
      />

      <PrescriptionModal
        isOpen={!!prescriptionPatient}
        onClose={() => setPrescriptionPatient(null)}
        patientName={prescriptionPatient ? `${prescriptionPatient.firstName} ${prescriptionPatient.lastName}` : ''}
      />

      <AnimatePresence>
        {activeAppointment && (
          <ConsultationPage
            appointment={activeAppointment}
            onClose={() => setActiveAppointment(null)}
            onNavigate={setActiveAppointment}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Patient picker (for the "Nouvelle ordonnance" quick action) ────────────

interface PatientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
  title?: string;
  subtitle?: string;
}

function PatientPickerModal({
  isOpen, onClose, onSelect,
  title = 'Nouvelle ordonnance',
  subtitle = 'Sélectionnez le patient concerné',
}: PatientPickerModalProps) {
  const { patients } = usePatients();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const visible = patients
    .filter(p => (user?.role === 'DOCTOR' ? p.assignedDoctor === user.name : true))
    .filter(p =>
      `${p.firstName} ${p.lastName} ${p.id} ${p.phone}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );

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
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-primary text-white">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-xs text-white/70 font-medium">{subtitle}</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher par nom, ID, téléphone..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-pill border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="max-h-[46vh] overflow-y-auto flex flex-col gap-1.5">
                {visible.length === 0 ? (
                  <p className="text-center text-text-muted font-medium py-8">Aucun patient trouvé.</p>
                ) : (
                  visible.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p)}
                      className="hover-row flex items-center gap-3 p-2.5 rounded-2xl border border-transparent text-left transition-all"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border-subtle shrink-0">
                        <img src={p.avatar} alt={p.firstName} referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-[11px] font-medium text-text-muted tabular">{p.id}{p.phone ? ` · ${p.phone}` : ''}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
