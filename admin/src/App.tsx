import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout, { type AdminView } from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DoctorsPage from './pages/DoctorsPage';
import RequestsPage from './pages/RequestsPage';
import ActivityPage from './pages/ActivityPage';
import { adminApi } from './lib/api';

function AdminApp() {
  const [currentView, setCurrentView] = useState<AdminView>('doctors');
  const [pendingCount, setPendingCount] = useState(0);
  // Bumped to force a badge refresh after a request is acted on.
  const [refreshKey, setRefreshKey] = useState(0);

  // Badge on the Demandes tab. Refreshed on view change and after an accept,
  // so the count never lags behind what the admin just did.
  useEffect(() => {
    let cancelled = false;
    adminApi.doctorRequests.list()
      .then(({ requests }) => {
        if (!cancelled) {
          setPendingCount(requests.filter(r => r.status === 'PENDING').length);
        }
      })
      .catch(() => { /* the badge is cosmetic — never surface an error for it */ });
    return () => { cancelled = true; };
  }, [currentView, refreshKey]);

  const renderView = () => {
    switch (currentView) {
      case 'doctors': return <DoctorsPage />;
      case 'requests': return <RequestsPage onAccepted={() => setRefreshKey(k => k + 1)} />;
      case 'activity': return <ActivityPage />;
      default: return <DoctorsPage />;
    }
  };

  return (
    <AdminLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      pendingCount={pendingCount}
    >
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
    </AdminLayout>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // The session lives in an httpOnly cookie, so on a refresh we can't know if
  // the user is signed in until /api/auth/me answers. Hold the shell until
  // then, otherwise the login page flashes before the console appears.
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

  // Non-admins are turned away at login (see AuthContext), so a session here
  // is always an admin one.
  if (!isAuthenticated) return <LoginPage />;

  return <AdminApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
