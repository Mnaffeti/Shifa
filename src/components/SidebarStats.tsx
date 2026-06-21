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
        tone="teal"
      />
      <StatCard
        icon={UserPlus}
        label="Nouveaux Patients"
        value={newPatients.toLocaleString()}
        update="+3"
        tone="lime"
      />
      <StatCard
        icon={Activity}
        label="Cas Actifs"
        value={patients.filter(p => p.status === 'Active').length.toLocaleString()}
        update="-1.2%"
        tone="amber"
      />
      <StatCard
        icon={Heart}
        label="Taux de Récupération"
        value={`${Math.round(recoveryRate)}%`}
        update="+0.5%"
        tone="rose"
      />

      <div className="group relative overflow-hidden rounded-card bg-gradient-to-br from-primary via-primary to-[#0a2a2a] p-6 mt-2 min-h-[180px] flex flex-col justify-end border border-transparent transition-all duration-300 hover:border-accent hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-teal-light/30 blur-3xl" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 text-accent text-[10px] font-medium uppercase tracking-widest mb-3 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-accent" />
            Sujet du jour
          </span>
          <h4 className="text-white text-lg font-medium leading-snug tracking-tight">
            Comment maintenir une <span className="text-accent">santé cardiaque</span> à l'ère du numérique
          </h4>
        </div>
      </div>
    </div>
  );
}
