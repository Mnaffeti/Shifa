import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { usePatients, Patient } from '../context/PatientContext';
import { Appointment, useAppointments } from '../context/AppointmentContext';
import { useConsultations } from '../context/ConsultationContext';
import { useAuth } from '../context/AuthContext';
import ConsultationPage from '../components/ConsultationPage';
import PatientChartPage from '../components/PatientChartPage';
import PatientFormModal from '../components/PatientFormModal';
import PatientArchive from '../components/patients/PatientArchive';
import { buildPatientFiles, PatientFile } from '../lib/patientFiles';

/**
 * The medical archive. Patients are presented as files — identity first,
 * consultation history as metadata — rather than as spreadsheet rows.
 */
export default function PatientsPage() {
  const { patients, deletePatient, isLoading } = usePatients();
  const { appointments } = useAppointments();
  const { consultations } = useConsultations();
  const { user } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Patient | null>(null);

  // The open file lives in the URL (/patients/PT-001), not in local state, so
  // it survives a refresh and can be bookmarked or sent to a colleague.
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // DOCTOR is the only clinical role now — every caller here manages their
  // own patients.
  const canAddOrEdit = user?.role === 'DOCTOR';

  const visiblePatients = useMemo(
    () => patients.filter(p => p.assignedDoctor === user?.name),
    [patients, user?.name],
  );

  const files = useMemo(
    () => buildPatientFiles(visiblePatients, appointments, consultations),
    [visiblePatients, appointments, consultations],
  );

  if (patientId) {
    const current = patients.find(p => p.id === patientId);

    // Still loading: the list arrives asynchronously, so an unknown id here is
    // not yet an error.
    if (!current && isLoading) {
      return (
        <div className="py-20 text-center">
          <span className="inline-block w-7 h-7 rounded-full border-2 border-border-subtle border-t-primary animate-spin" />
          <p className="text-[13px] font-medium text-text-muted mt-3">Chargement du dossier…</p>
        </div>
      );
    }

    // A real dead end — a stale bookmark, or another doctor's patient.
    if (!current) {
      return <UnknownPatient onBack={() => navigate('/patients')} />;
    }

    return <PatientChartView patient={current} onBack={() => navigate('/patients')} />;
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      <PatientArchive
        files={files}
        onOpen={(file: PatientFile) => navigate(`/patients/${file.patient.id}`)}
        onCreatePatient={() => setIsAddModalOpen(true)}
        canCreate={canAddOrEdit}
        onEdit={canAddOrEdit ? (file: PatientFile) => setEditingPatient(file.patient) : undefined}
        onDelete={canAddOrEdit ? (file: PatientFile) => setPendingDelete(file.patient) : undefined}
      />

      <PatientFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="add"
      />

      <PatientFormModal
        isOpen={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        mode="edit"
        patient={editingPatient ?? undefined}
      />

      <DeleteFileDialog
        patient={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deletePatient(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

// ─── Unknown patient ────────────────────────────────────────────────────────

/**
 * Reached from a stale bookmark, a mistyped id, or a patient belonging to
 * another doctor — the API scopes by doctorId, so those simply are not in the
 * list. Say so plainly instead of rendering an empty chart.
 */
function UnknownPatient({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-[560px] mx-auto py-16 text-center">
      <span className="w-14 h-14 rounded-2xl bg-amber-50 grid place-items-center mx-auto">
        <AlertTriangle size={24} className="text-amber-600" strokeWidth={1.75} />
      </span>
      <h1 className="text-[22px] font-semibold text-text-primary tracking-tight mt-5">
        Dossier introuvable
      </h1>
      <p className="text-[14px] text-text-muted font-normal leading-relaxed mt-2.5">
        Ce dossier n'existe pas, ou ne fait pas partie de vos patients.
      </p>
      <button
        onClick={onBack}
        className="mt-6 h-11 px-6 rounded-[14px] bg-primary text-white text-[13.5px] font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
      >
        Retour aux patients
      </button>
    </div>
  );
}

// ─── Delete confirmation ────────────────────────────────────────────────────

function DeleteFileDialog({
  patient, onCancel, onConfirm,
}: {
  patient: Patient | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {patient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="alertdialog"
            aria-modal="true"
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6"
          >
            <span className="w-11 h-11 rounded-full bg-rose-50 grid place-items-center">
              <AlertTriangle size={19} className="text-rose-600" strokeWidth={1.75} />
            </span>

            <h2 className="text-[18px] font-semibold text-text-primary tracking-tight mt-4">
              Supprimer ce dossier ?
            </h2>
            <p className="text-[13.5px] text-text-muted font-normal leading-relaxed mt-2">
              Le dossier de <span className="font-medium text-text-primary">
                {patient.firstName} {patient.lastName}
              </span> sera définitivement supprimé. Cette action est irréversible.
            </p>

            <div className="flex items-center gap-2.5 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 h-11 rounded-[14px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-11 rounded-[14px] bg-rose-600 text-white text-[13px] font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Supprimer
              </button>
            </div>
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
