import { Users, Activity, Heart, DollarSign } from 'lucide-react';
import StatCard from './StatCard';
import { useAppointments } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';

export default function SidebarStats() {
  const { totalAppointments, totalRevenue, recoveryRate } = useAppointments();
  const { activePatients } = usePatients();
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-4 w-full max-w-[280px]">
      {user?.role === 'DOCTOR' && (
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`${totalRevenue.toLocaleString()} TND`}
          update="+2.5%"
          sparkline
        />
      )}
      <StatCard
        icon={Users}
        label="Total Appointments"
        value={totalAppointments.toLocaleString()}
        update="+5.2%"
      />
      <StatCard
        icon={Activity}
        label="Active Cases"
        value={activePatients.toLocaleString()}
        update="-1.2%"
      />
      <StatCard
        icon={Heart}
        label="Recovery Rate"
        value={`${Math.round(recoveryRate)}%`}
        update="+0.5%"
      />

      {/* Today's Topic Card */}
      <div className="relative overflow-hidden rounded-card bg-card-dark p-6 mt-2 min-h-[180px] flex flex-col justify-end">
        {/* Abstract Blob Overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-light/20 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <span className="inline-block px-2 py-1 rounded-md bg-white/10 text-white text-xs font-bold uppercase tracking-widest mb-3">
            Today's Topic
          </span>
          <h4 className="text-white text-lg font-bold leading-tight tracking-tight">
            How to maintain <span className="text-accent">Heart Health</span> in the digital age
          </h4>
        </div>
      </div>
    </div>
  );
}
