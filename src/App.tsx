/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider, useAppointments } from './context/AppointmentContext';
import { PatientProvider } from './context/PatientContext';
import { ChartProvider } from './context/ChartContext';
import { ConsultationProvider } from './context/ConsultationContext';
import { ReminderProvider } from './context/ReminderContext';

// Components
import Navbar from './components/Navbar';
import SecretaryNavbar from './components/SecretaryNavbar';
import AppointmentModal from './components/AppointmentModal';
import DoctorDashboard from './components/DoctorDashboard';
import SecretaryDashboard from './components/SecretaryDashboard';

// Pages
import LoginPage from './pages/LoginPage';
import WelcomeGate from './pages/WelcomeGate';
import SchedulePage from './pages/SchedulePage';
import PatientsPage from './pages/PatientsPage';
import SettingsPage from './pages/SettingsPage';
import SecretaryAppointmentsPage from './pages/SecretaryAppointmentsPage';

function MainLayout() {
  const { user } = useAuth();
  const { isModalOpen, setIsModalOpen } = useAppointments();
  const [currentView, setCurrentView] = useState('dashboard');

  const renderDoctorView = () => {
    switch (currentView) {
      case 'dashboard': return <DoctorDashboard onNavigate={setCurrentView} />;
      case 'schedule': return <SchedulePage />;
      case 'patients': return <PatientsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DoctorDashboard onNavigate={setCurrentView} />;
    }
  };

  const renderSecretaryView = () => {
    switch (currentView) {
      case 'dashboard': return <SecretaryDashboard />;
      case 'appointments': return <SecretaryAppointmentsPage />;
      case 'patients': return <PatientsPage />;
      case 'schedule': return <SchedulePage />;
      case 'settings': return <SettingsPage />;
      default: return <SecretaryDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/10 selection:text-primary">
      {user?.role === 'DOCTOR' ? (
        <Navbar currentView={currentView} onViewChange={setCurrentView} />
      ) : (
        <SecretaryNavbar currentView={currentView} onViewChange={setCurrentView} />
      )}

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {user?.role === 'DOCTOR' ? renderDoctorView() : renderSecretaryView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <footer className="py-8 px-8 text-center text-text-muted text-xs font-medium">
        © 2026 ShifaPlus Hospital Management System. All rights reserved.
      </footer>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!isAuthenticated) {
    // Gate first: two centered CTAs. "Se connecter" reveals the login page.
    return showLogin ? <LoginPage /> : <WelcomeGate onLogin={() => setShowLogin(true)} />;
  }

  return (
    <ChartProvider>
      <ConsultationProvider>
        <PatientProvider>
          <AppointmentProvider>
            <ReminderProvider>
              <MainLayout />
            </ReminderProvider>
          </AppointmentProvider>
        </PatientProvider>
      </ConsultationProvider>
    </ChartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
