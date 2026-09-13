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
import AppointmentModal from './components/AppointmentModal';
import DoctorDashboard from './components/DoctorDashboard';

// Pages
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import WelcomeGate from './pages/WelcomeGate';
import DoctorRequestPage from './pages/DoctorRequestPage';
import SchedulePage from './pages/SchedulePage';
import PatientsPage from './pages/PatientsPage';
import SettingsPage from './pages/SettingsPage';
import AdminAccountsPage from './pages/AdminAccountsPage';
import AdminLayout from './components/AdminLayout';

/** DOCTOR is the only clinical role — there is no more secretary view to branch on. */
function MainLayout() {
  const { isModalOpen, setIsModalOpen } = useAppointments();
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DoctorDashboard onNavigate={setCurrentView} />;
      case 'schedule': return <SchedulePage />;
      case 'patients': return <PatientsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DoctorDashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/10 selection:text-primary">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
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

type GateView = 'gate' | 'login' | 'request';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [gateView, setGateView] = useState<GateView>('gate');

  // The session lives in an httpOnly cookie, so on a refresh we can't know if
  // the user is signed in until /api/auth/me answers. Hold the shell until
  // then, otherwise the welcome gate flashes before the dashboard appears.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-primary animate-spin" />
          <p className="text-[13px] font-medium text-text-muted">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Gate first; its two CTAs open the login page or the doctor
    // account-request form. No self-signup with a password — a doctor
    // requests an account and an admin issues the credentials.
    if (gateView === 'gate') {
      return (
        <WelcomeGate
          onLogin={() => setGateView('login')}
          onRequestAccount={() => setGateView('request')}
        />
      );
    }
    if (gateView === 'request') {
      return <DoctorRequestPage onBack={() => setGateView('gate')} />;
    }
    return <LoginPage />;
  }

  // A back-office-issued temporary password must be replaced before the
  // account can do anything else.
  if (user?.mustChangePassword) {
    return <ChangePasswordPage />;
  }

  // An admin operates the product rather than a practice: no patients, no
  // schedule. Rendering them outside the clinical providers avoids a burst of
  // requests for data they are not allowed to read anyway.
  if (user?.role === 'ADMIN') {
    return (
      <AdminLayout>
        <AdminAccountsPage />
      </AdminLayout>
    );
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
