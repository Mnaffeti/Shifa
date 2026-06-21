import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SidebarStats from '../components/SidebarStats';
import RightPanel from '../components/RightPanel';
import DashboardCharts from '../components/DashboardCharts';
import ConsultationPage from '../components/ConsultationPage';
import { useAuth } from '../context/AuthContext';
import { Appointment } from '../context/AppointmentContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <>
      <div className="grid grid-cols-[280px_1fr_380px] gap-8 items-start">
        <div className="flex flex-col gap-8 sticky top-28">
          <SidebarStats />
        </div>

        <div className="flex flex-col gap-8 min-w-0">
          <div className="flex flex-col gap-1.5">
            <p className="inline-flex items-center gap-2 text-[11px] font-medium text-text-muted uppercase tracking-widest tabular">
              <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-accent" />
              {today}
            </p>
            <h1 className="text-3xl font-medium text-text-primary font-heading leading-tight tracking-tight">
              Bonjour, {user?.name}
            </h1>
            <p className="text-sm font-medium text-text-muted">
              Voici un aperçu de votre journée.
            </p>
          </div>
          <DashboardCharts />
        </div>

        <div className="sticky top-28">
          <RightPanel onPatientClick={setActiveAppointment} />
        </div>
      </div>

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
