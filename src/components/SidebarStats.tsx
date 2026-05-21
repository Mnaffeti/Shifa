import { Activity, Heart, UserPlus, Users } from 'lucide-react';
import StatCard from './StatCard';
import { useAppointments } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';

export default function SidebarStats() {
  const { totalAppointments, recoveryRate } = useAppointments();
  const { patients } = usePatients();

  const newPatients = patients.filter(p => p.status === 'New').length;

  return (
    <div className="flex flex-col gap-4 w-full max-w-[280px]">
      <StatCard
        icon={Users}
        label="Rendez-vous totaux"
        value={totalAppointments.toLocaleString()}
        update="+5.2%"
      />
      <StatCard
        icon={UserPlus}
        label="Nouveaux Patients"
        value={newPatients.toLocaleString()}
        update="+3"
      />
      <StatCard
        icon={Activity}
        label="Cas Actifs"
        value={patients.filter(p => p.status === 'Active').length.toLocaleString()}
        update="-1.2%"
      />
      <StatCard
        icon={Heart}
        label="Taux de Récupération"
        value={`${Math.round(recoveryRate)}%`}
        update="+0.5%"
      />

      <div className="relative overflow-hidden rounded-card bg-card-dark p-6 mt-2 min-h-[180px] flex flex-col justify-end">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-light/20 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <span className="inline-block px-2 py-1 rounded-md bg-white/10 text-white text-xs font-bold uppercase tracking-widest mb-3">
            Sujet du jour
          </span>
          <h4 className="text-white text-lg font-bold leading-tight tracking-tight">
            Comment maintenir une <span className="text-accent">santé cardiaque</span> à l'ère du numérique
          </h4>
        </div>
      </div>
    </div>
  );
}
