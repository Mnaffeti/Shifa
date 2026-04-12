import SidebarStats from '../components/SidebarStats';
import RevenueChart from '../components/RevenueChart';
import AppointmentTable from '../components/AppointmentTable';
import RightPanel from '../components/RightPanel';
import { useAuth } from '../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-[280px_1fr_380px] gap-8 items-start">
      {/* Left Column: Stats */}
      <div className="flex flex-col gap-8 sticky top-28">
        <SidebarStats />
      </div>

      {/* Middle Column: Main Content */}
      <div className="flex flex-col gap-8 min-w-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-text-primary font-heading">
            Hello, {user?.name} 👋
          </h1>
          <p className="text-text-secondary font-medium">
            You have a busy schedule today. Check your upcoming appointments.
          </p>
        </div>

        <RevenueChart />
        <AppointmentTable />
      </div>

      {/* Right Column: Calendar & Upcoming */}
      <div className="sticky top-28">
        <RightPanel />
      </div>
    </div>
  );
}
