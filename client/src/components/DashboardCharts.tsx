import { useState } from 'react';
import { startOfWeek, addDays, isSameDay } from 'date-fns';
import { CalendarPlus, PieChart } from 'lucide-react';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from './ui/EmptyState';
import { shortDate } from '../lib/datetime';

/**
 * Charts picked by data volume (spec §5):
 *  - Weekly activity → a collapsed 64px sparkline strip; bars only when ≥5 data
 *    points across the week, otherwise the empty state.
 *  - Consultation types (3 categories) → NO donut. A horizontal stacked bar +
 *    a value table. Categorical palette validated (dataviz): teal/violet/amber,
 *    identity carried by direct labels + table, never color alone.
 */

// Validated categorical palette (light) — ΔE and contrast checks pass.
const TYPE_META = [
  { key: 'Consultation', label: 'Consultation', color: '#0D9488' },
  { key: 'Follow-up',    label: 'Suivi',        color: '#7C3AED' },
  { key: 'Surgery',      label: 'Chirurgie',    color: '#D97706' },
] as const;

interface Props {
  onCreate?: () => void;
}

export default function DashboardCharts({ onCreate }: Props) {
  const { appointments } = useAppointments();
  const { user } = useAuth();

  const mine = user?.role === 'DOCTOR'
    ? appointments.filter(a => a.doctor === user.name)
    : appointments;

  return (
    <div className="flex flex-col gap-6">
      <WeekSparkline appointments={mine} onCreate={onCreate} />
      <TypeBreakdown appointments={mine} onCreate={onCreate} />
    </div>
  );
}

/* ── Weekly sparkline strip (64px) ─────────────────────────────────────────── */

function WeekSparkline({ appointments, onCreate }: { appointments: Appointment[]; onCreate?: () => void }) {
  const [hover, setHover] = useState<number | null>(null);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dayLabel: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
      count: appointments.filter(a => isSameDay(new Date(a.date), date)).length,
      isToday: isSameDay(date, new Date()),
    };
  });

  const total = days.reduce((s, d) => s + d.count, 0);
  const max = Math.max(...days.map(d => d.count), 1);

  // Bars whenever the week has any activity; empty state only for a truly empty week.
  if (total === 0) {
    return (
      <div className="bg-white rounded-[16px] border border-border-subtle">
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <h3 className="text-sm font-semibold text-text-primary">Activité de la semaine</h3>
        </div>
        <EmptyState
          message="Pas encore d'activité cette semaine"
          actionLabel="Planifier un RDV"
          onAction={onCreate}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-border-subtle px-5 flex items-center gap-5" style={{ height: 64 }}>
      <div className="shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#64748B]">Semaine</p>
        <p className="text-[15px] font-semibold text-text-primary tabular leading-tight">{total} RDV</p>
      </div>

      {/* bars — thin marks, rounded data-ends, today highlighted */}
      <div className="flex-1 flex items-end justify-between gap-2 h-9 relative" role="img" aria-label={`Activité: ${days.map(d => `${d.dayLabel} ${d.count}`).join(', ')}`}>
        {days.map((d, i) => (
          <div
            key={i}
            className="flex-1 h-full flex flex-col justify-end items-center group relative"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className={`w-full max-w-[18px] rounded-[3px] transition-colors ${d.isToday ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-info)]/35 group-hover:bg-[var(--color-info)]/60'}`}
              style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%` }}
            />
            {hover === i && (
              <div className="absolute bottom-full mb-1.5 z-10 px-2 py-1 rounded-md bg-text-primary text-white text-[11px] font-medium tabular whitespace-nowrap shadow-lg">
                {shortDate(d.date)} · {d.count} RDV
              </div>
            )}
          </div>
        ))}
      </div>

      {/* axis labels (text, not color-only) */}
      <div className="hidden sm:flex flex-col justify-center gap-0.5 shrink-0 text-right">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#64748B]">
          <span className="w-2 h-2 rounded-[2px] bg-[var(--color-brand)]" /> Aujourd'hui
        </span>
      </div>
    </div>
  );
}

/* ── Consultation types: horizontal stacked bar + table ────────────────────── */

function TypeBreakdown({ appointments, onCreate }: { appointments: Appointment[]; onCreate?: () => void }) {
  const [hover, setHover] = useState<string | null>(null);

  const rows = TYPE_META.map(t => ({
    ...t,
    value: appointments.filter(a => a.type === t.key).length,
  }));
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="bg-white rounded-[16px] border border-border-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Types de consultations</h3>
        {total > 0 && (
          <span className="text-[11px] font-medium text-[#64748B] tabular">{total} au total</span>
        )}
      </div>

      {total === 0 ? (
        <EmptyState
          icon={PieChart}
          message="Aucun rendez-vous enregistré"
          actionLabel="Planifier un RDV"
          onAction={onCreate}
        />
      ) : (
        <>
          {/* Horizontal stacked bar — 2px surface gaps between segments */}
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-bg-soft" role="img" aria-label={rows.map(r => `${r.label} ${r.value}`).join(', ')}>
            {rows.filter(r => r.value > 0).map((r) => (
              <div
                key={r.key}
                className="h-full transition-opacity first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${(r.value / total) * 100}%`,
                  backgroundColor: r.color,
                  opacity: hover && hover !== r.key ? 0.4 : 1,
                  boxShadow: '0 0 0 1.5px white',
                }}
                title={`${r.label}: ${r.value}`}
              />
            ))}
          </div>

          {/* Value table — legend text label + count + share (identity not color-alone) */}
          <div className="mt-4 flex flex-col gap-2">
            {rows.map(r => (
              <div
                key={r.key}
                onMouseEnter={() => setHover(r.key)}
                onMouseLeave={() => setHover(null)}
                className="flex items-center gap-2.5 text-sm"
              >
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: r.color }} />
                <span className="flex-1 font-medium text-text-secondary">{r.label}</span>
                <span className="font-semibold text-text-primary tabular w-6 text-right">{r.value}</span>
                <span className="text-[#64748B] tabular w-10 text-right">
                  {total > 0 ? Math.round((r.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
