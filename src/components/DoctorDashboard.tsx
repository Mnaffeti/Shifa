import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import SidebarStats from '../components/SidebarStats';
import RightPanel from '../components/RightPanel';
import DashboardCharts from '../components/DashboardCharts';
import PatientDetailOverlay from '../components/PatientDetailOverlay';
import { useAuth } from '../context/AuthContext';
import { Appointment } from '../context/AppointmentContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  return (
    <>
      <div className="grid grid-cols-[280px_1fr_380px] gap-8 items-start">
        <div className="flex flex-col gap-8 sticky top-28">
          <SidebarStats />
        </div>

        <div className="flex flex-col gap-8 min-w-0">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-text-primary font-heading leading-tight tracking-tight">
              Bonjour, {user?.name} 👋
            </h1>
            <p className="text-base font-medium text-text-secondary">
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
          <PatientDetailOverlay
            appointment={activeAppointment}
            onClose={() => setActiveAppointment(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
