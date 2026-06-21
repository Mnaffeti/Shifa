import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { startOfWeek, addDays, format, isSameDay, isToday, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import { useAppointments } from '../context/AppointmentContext';

const TODAY = new Date().toISOString().split('T')[0];

const TYPE_COLORS = {
  Consultation: '#3DD6D0',
  Suivi:        '#C8E04A',
  Chirurgie:    '#1A4747',
};

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-primary text-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-medium tabular">
      {payload[0].value} RDV
    </div>
  );
}

export default function DashboardCharts() {
  const { appointments } = useAppointments();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weeklyData = weekDays.map(day => ({
    label: format(day, 'EEE', { locale: fr }),
    total: appointments.filter(a => isSameDay(new Date(a.date), day)).length,
    isToday: isToday(day),
    isPast: isBefore(day, new Date()) && !isToday(day),
  }));

  const typeData = [
    { name: 'Consultation', value: appointments.filter(a => a.type === 'Consultation').length, color: TYPE_COLORS.Consultation },
    { name: 'Suivi',        value: appointments.filter(a => a.type === 'Follow-up').length,    color: TYPE_COLORS.Suivi },
    { name: 'Chirurgie',    value: appointments.filter(a => a.type === 'Surgery').length,      color: TYPE_COLORS.Chirurgie },
  ].filter(d => d.value > 0);

  const todayApts  = appointments.filter(a => a.date === TODAY);
  const completed  = todayApts.filter(a => a.status === 'Completed').length;
  const upcoming   = todayApts.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length;
  const weekTotal  = weeklyData.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Weekly activity ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-medium text-text-primary tracking-tight">Activité de la semaine</h3>
            <p className="text-xs text-text-muted font-medium mt-1 tabular">
              {weekTotal} rendez-vous cette semaine
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              Aujourd'hui
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-light inline-block" />
              Passé
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-light/30 inline-block" />
              À venir
            </span>
          </div>
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F4" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(26,71,71,0.04)' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={34}>
                {weeklyData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.isToday ? '#C8E04A' : d.isPast ? '#3DD6D0' : '#B2EAE8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-2 gap-6">

        {/* Donut: consultation types */}
        <div className="card flex flex-col">
          <h3 className="text-lg font-medium text-text-primary mb-5 tracking-tight">Types de consultations</h3>
          {typeData.length > 0 ? (
            <div className="flex items-center gap-6 flex-1">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {typeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {typeData.map(d => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-sm font-medium text-text-secondary flex-1">{d.name}</span>
                    <span className="text-sm font-medium text-text-primary tabular">{d.value}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 border-t border-border-subtle pt-3 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-transparent" />
                  <span className="text-sm font-medium text-text-secondary flex-1">Total</span>
                  <span className="text-sm font-medium text-text-primary tabular">
                    {typeData.reduce((s, d) => s + d.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm font-medium flex-1 flex items-center">
              Aucun rendez-vous enregistré.
            </p>
          )}
        </div>

        {/* Today summary */}
        <div className="card flex flex-col">
          <h3 className="text-lg font-medium text-text-primary mb-5 tracking-tight">Aujourd'hui</h3>
          <div className="flex flex-col gap-2.5 flex-1 justify-center">
            <div className="group/row flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-transparent rounded-xl border border-teal-100 hover-row hover:from-teal-100 cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 ring-1 ring-teal-200/70 flex items-center justify-center transition-all duration-300 group-hover/row:scale-105 group-hover/row:rotate-3">
                  <Calendar size={15} className="text-teal-600" strokeWidth={2} />
                </div>
                <span className="text-sm font-medium text-text-secondary">Total</span>
              </div>
              <span className="text-2xl font-medium text-text-primary tabular">{todayApts.length}</span>
            </div>
            <div className="group/row flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-xl border border-emerald-100 hover-row hover:from-emerald-100 cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 ring-1 ring-emerald-200/70 flex items-center justify-center transition-all duration-300 group-hover/row:scale-105 group-hover/row:rotate-3">
                  <CheckCircle2 size={15} className="text-emerald-600" strokeWidth={2} />
                </div>
                <span className="text-sm font-medium text-text-secondary">Terminés</span>
              </div>
              <span className="text-2xl font-medium text-text-primary tabular">{completed}</span>
            </div>
            <div className="group/row flex items-center justify-between p-3 bg-gradient-to-r from-sky-50 to-transparent rounded-xl border border-sky-100 hover-row hover:from-sky-100 cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 ring-1 ring-sky-200/70 flex items-center justify-center transition-all duration-300 group-hover/row:scale-105 group-hover/row:rotate-3">
                  <Clock size={15} className="text-sky-600" strokeWidth={2} />
                </div>
                <span className="text-sm font-medium text-text-secondary">À venir</span>
              </div>
              <span className="text-2xl font-medium text-text-primary tabular">{upcoming}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
