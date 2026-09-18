/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import {
  BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider, useAppointments } from './context/AppointmentContext';
import { PatientProvider } from './context/PatientContext';
import { ChartProvider } from './context/ChartContext';
import { ConsultationProvider } from './context/ConsultationContext';
import { ReminderProvider } from './context/ReminderContext';

// Components
import Navbar, { type ViewType } from './components/Navbar';
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
import AdminRedirectNotice from './pages/AdminRedirectNotice';

/**
 * URLs are French and stable, since a doctor may bookmark or share one.
 * The Navbar still speaks in view ids, so translate in both directions here
 * rather than rewriting every consumer.
 */
const PATH_FOR: Record<ViewType, string> = {
  dashboard: '/',
  patients: '/patients',
  schedule: '/agenda',
  settings: '/parametres',
};

function viewForPath(pathname: string): ViewType {
  if (pathname.startsWith('/patients')) return 'patients';
  if (pathname.startsWith('/agenda')) return 'schedule';
  if (pathname.startsWith('/parametres')) return 'settings';
  return 'dashboard';
}

/** DOCTOR is the only clinical role — there is no more secretary view to branch on. */
function MainLayout() {
  const { isModalOpen, setIsModalOpen } = useAppointments();
  const location = useLocation();
  const navigate = useNavigate();

  const currentView = viewForPath(location.pathname);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/10 selection:text-primary">
      <Navbar
        currentView={currentView}
        onViewChange={view => navigate(PATH_FOR[view])}
      />

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Keyed on the view, not the full path: opening a patient file
              should not replay the page transition over the whole shell. */}
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Routes location={location}>
              <Route
                path="/"
                element={<DoctorDashboard onNavigate={view => navigate(PATH_FOR[view as ViewType] ?? '/')} />}
              />
              <Route path="/agenda" element={<SchedulePage />} />
              {/* The patient file is a route of its own, so it survives a
                  refresh and can be bookmarked or sent to a colleague. */}
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:patientId" element={<PatientsPage />} />
              <Route path="/parametres" element={<SettingsPage />} />
              {/* Unknown path: fall back to the dashboard rather than a blank
                  screen, replacing the bad entry so Back still works. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
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

/**
 * Pre-login screens.
 *
 * These are routed too, so "request an account" is a page a doctor can be sent
 * a link to rather than a state buried behind two clicks.
 */
function GateRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <WelcomeGate
            onLogin={() => navigate('/connexion')}
            onRequestAccount={() => navigate('/demande-de-compte')}
          />
        }
      />
      <Route path="/connexion" element={<LoginPage />} />
      <Route
        path="/demande-de-compte"
        element={<DoctorRequestPage onBack={() => navigate('/')} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // Gate first; its two CTAs lead to the login page or the doctor
  // account-request form. No self-signup with a password — a doctor requests
  // an account and an admin issues the credentials.
  if (!isAuthenticated) return <GateRoutes />;

  // A back-office-issued temporary password must be replaced before the
  // account can do anything else.
  if (user?.mustChangePassword) return <ChangePasswordPage />;

  // An admin operates the product rather than a practice: no patients, no
  // schedule. The back office is its own app now, so point them at it instead
  // of rendering a console here — and never mount the clinical providers,
  // which would fire a burst of requests for data they cannot read anyway.
  //
  // This is reachable without signing in here: cookies ignore the port, so an
  // admin signed in to the console on :8081 arrives with a valid session.
  if (user?.role === 'ADMIN') return <AdminRedirectNotice />;

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
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
