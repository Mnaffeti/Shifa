import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronRight, Clock, Settings, Stethoscope, Users } from 'lucide-react';
import ConsultationPage from './ConsultationPage';
import PatientPickerModal from './PatientPickerModal';
import { useAuth } from '../context/AuthContext';
import { Appointment, useAppointments } from '../context/AppointmentContext';
import { Patient } from '../context/PatientContext';
import { longDate, ymd } from '../lib/datetime';

interface Props {
  /** Hands navigation back to the shell so the cards can route. */
  onNavigate?: (view: string) => void;
}

interface LauncherCard {
  icon: any;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}

/**
 * The doctor's home screen: a calm launcher, not a data dashboard.
 * One primary action (start a consultation) plus three doors into the
 * workspace. The patient archive itself lives on the Patients page.
 */
export default function DoctorDashboard({ onNavigate }: Props) {
  const { user } = useAuth();
  const { appointments, addAppointment, setCurrentPatientApt } = useAppointments();

  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [pickPatientOpen, setPickPatientOpen] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // "Dr. Youssef Ben Ali" → "Dr. Youssef"; "Foulena" → "Foulena".
  const displayName = (() => {
    const name = user?.name?.trim();
    if (!name) return '';
    const parts = name.split(/\s+/);
    return /^dr\.?$/i.test(parts[0]) ? parts.slice(0, 2).join(' ') : parts[0];
  })();

  const today = new Date();

  // Start a walk-in consultation at the current time.
  const handleStartConsultation = async (patient: Patient) => {
    setPickPatientOpen(false);
    setStartError(null);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const end = new Date(now.getTime() + 30 * 60 * 1000);
    const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

    try {
      // Wait for the server's record: it owns the id, and the consultation
      // opened below references it. Opening with a locally-invented id would
      // point at an appointment row that was never created.
      const created = await addAppointment({
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctor: user?.name ?? 'Dr. Youssef',
        date: ymd(now),
        startTime,
        endTime,
        duration: 30,
        type: 'Consultation',
        status: 'Confirmed',
        notes: 'Consultation rapide (sans rendez-vous)',
      });

      setCurrentPatientApt(created.id);
      setActiveAppointment(created);
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : 'Impossible de démarrer la consultation.',
      );
    }
  };

  // Reopen the most recent completed consultation; fall back to the planning.
  const openLastConsultation = () => {
    const last = appointments
      .filter(a => a.doctor === user?.name && a.status === 'Completed' && a.date <= ymd(today))
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))[0];

    if (last) setActiveAppointment(last);
    else onNavigate?.('schedule');
  };

  const cards: LauncherCard[] = [
    {
      icon: Users,
      title: 'Patients',
      description: 'Rechercher et consulter les dossiers de vos patients',
      action: 'Voir les patients',
      onClick: () => onNavigate?.('patients'),
    },
    {
      icon: Clock,
      title: 'Consultations récentes',
      description: 'Retrouver et réviser vos dernières consultations',
      action: 'Voir les consultations',
      onClick: openLastConsultation,
    },
    {
      icon: Settings,
      title: 'Paramètres',
      description: 'Personnaliser votre espace de travail clinique',
      action: 'Gérer les paramètres',
      onClick: () => onNavigate?.('settings'),
    },
  ];

  return (
    <>
      <div className="max-w-[1180px] mx-auto">
        {/* ── Greeting ── */}
        <header className="pt-2 pb-10">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            {longDate(today)} {today.getFullYear()}
          </p>
          <h1 className="flex items-center gap-3 text-[40px] sm:text-[46px] font-semibold text-text-primary tracking-tight leading-[1.1] mt-3">
            Bonjour{displayName ? `, ${displayName}` : ''}
            <span className="wave origin-[70%_70%] text-[36px]">👋</span>
          </h1>
          <p className="text-[17px] font-normal text-text-muted mt-2">
            Prêt pour votre prochaine consultation ?
          </p>

          {startError && (
            <p
              role="alert"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-rose-50 border border-rose-100 text-[13px] font-medium text-rose-700"
            >
              {startError}
            </p>
          )}
        </header>

        {/* ── Primary action ── */}
        <button
          onClick={() => setPickPatientOpen(true)}
          className="group relative w-full overflow-hidden rounded-[24px] bg-primary text-left px-8 sm:px-10 py-9 transition-all duration-300 hover:brightness-[1.08] active:scale-[0.995]"
        >
          {/* Faint clinical cross grid — texture only, stays behind the text. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath d=\'M16 11v10M11 16h10\' stroke=\'white\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E")',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative flex items-center gap-5 sm:gap-7">
            <span className="w-[68px] h-[68px] rounded-[20px] bg-white/10 grid place-items-center shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Stethoscope size={30} className="text-white" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-[28px] sm:text-[32px] font-semibold text-white tracking-tight leading-tight">
                Nouvelle consultation
              </h2>
              <p className="text-[15px] font-normal text-white/70 mt-1.5">
                Commencer une consultation avec un patient
              </p>
            </div>

            <span className="hidden sm:flex items-center gap-4 shrink-0">
              <span className="text-[15px] font-medium text-white/90">Démarrer</span>
              <span className="w-12 h-12 rounded-full border border-white/25 grid place-items-center transition-all duration-300 group-hover:bg-white/10">
                <ArrowRight
                  size={19}
                  className="text-white transition-transform duration-300 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </span>
            </span>
          </div>
        </button>

        {/* ── Three doors ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {cards.map(card => (
            <button
              key={card.title}
              onClick={card.onClick}
              className="group bg-white rounded-[20px] border border-border-subtle p-7 text-left flex flex-col transition-all duration-300 hover:border-accent hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <span className="w-11 h-11 rounded-full bg-primary/5 grid place-items-center transition-colors duration-300 group-hover:bg-accent/20">
                <card.icon size={19} className="text-primary" strokeWidth={1.75} />
              </span>

              <h3 className="text-[19px] font-semibold text-text-primary tracking-tight mt-6">
                {card.title}
              </h3>
              <p className="text-[14.5px] font-normal text-text-muted leading-relaxed mt-2 flex-1">
                {card.description}
              </p>

              <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary mt-6">
                {card.action}
                <ChevronRight
                  size={15}
                  strokeWidth={2.25}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pick the patient, then open the consultation page */}
      <PatientPickerModal
        isOpen={pickPatientOpen}
        onClose={() => setPickPatientOpen(false)}
        onSelect={handleStartConsultation}
        title="Nouvelle consultation"
        subtitle="Choisissez le patient — la consultation démarre à l'heure actuelle"
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
