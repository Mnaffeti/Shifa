import { CalendarDays, CheckCircle2, Hourglass, LogOut } from 'lucide-react';
import StatCard from './StatCard';
import { useAppointments } from '../context/AppointmentContext';

/** Latest endTime ("HH:MM") among a list of appointments, or '' when empty. */
function latestEndTime(apts: { endTime: string }[]): string {
  return apts.reduce((max, a) => (a.endTime > max ? a.endTime : max), '');
}

export default function SidebarStats() {
  const { appointments } = useAppointments();

  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === today && a.status !== 'Cancelled');

  const total = todayApts.length;
  const done = todayApts.filter(a => a.status === 'Completed').length;
  const waiting = todayApts.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length;
  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Estimated end of the working day: the latest end time still ahead of us;
  // once everything is done, fall back to the last appointment's end time.
  const remaining = todayApts.filter(a => a.status !== 'Completed');
  const estimatedEnd =
    remaining.length > 0
      ? latestEndTime(remaining)
      : total > 0
        ? latestEndTime(todayApts)
        : '—';
  const allDone = total > 0 && waiting === 0;

  return (
    <div className="flex flex-col gap-4 w-full max-w-[280px]">
      <StatCard
        icon={CalendarDays}
        label="RDV du jour"
        value={total.toLocaleString()}
        update="aujourd'hui"
        tone="teal"
      />
      <StatCard
        icon={CheckCircle2}
        label="RDV terminés"
        value={done.toLocaleString()}
        update={total > 0 ? `${donePct}%` : undefined}
        tone="lime"
      />
      <StatCard
        icon={Hourglass}
        label="RDV en attente"
        value={waiting.toLocaleString()}
        tone="amber"
      />
      <StatCard
        icon={LogOut}
        label="Fin de journée estimée"
        value={estimatedEnd}
        update={allDone ? 'terminé' : undefined}
        tone="sky"
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
