import { Plus, Stethoscope, Activity, Scissors, Clock } from 'lucide-react';
import { Appointment } from '../context/AppointmentContext';
import { useTick } from '../lib/useTick';
import { toMinutes, fromMinutes, nowMinutes, ymd } from '../lib/datetime';

/**
 * Hero: vertical time axis 08:00 → 20:00, appointment blocks positioned by real
 * time, a red "now" line, and empty gaps surfaced as bookable slots.
 * Live via useTick (now-line + slot availability update without refresh).
 */

const DAY_START = 8 * 60;   // 08:00
const DAY_END = 20 * 60;    // 20:00
const PX_PER_MIN = 1.4;     // 12h × 60 × 1.4 ≈ 1008px axis
const AXIS_TOP = 8;

const TYPE_ICON: Record<string, any> = {
  Consultation: Stethoscope,
  'Follow-up': Activity,
  Surgery: Scissors,
};

// Status → semantic token color (border-left + text accents)
function statusColor(apt: Appointment): { bar: string; text: string; bg: string } {
  switch (apt.status) {
    case 'Completed': return { bar: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/5' };
    case 'Cancelled': return { bar: 'bg-[var(--color-danger)]', text: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]/5' };
    case 'Pending':   return { bar: 'bg-[var(--color-warn)]', text: 'text-[var(--color-warn)]', bg: 'bg-[var(--color-warn)]/5' };
    default:          return { bar: 'bg-[var(--color-info)]', text: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info)]/5' };
  }
}

interface Props {
  appointments: Appointment[];
  onAppointmentClick?: (apt: Appointment) => void;
  onBookSlot?: (time: string) => void;
  onCreate?: () => void;
}

export default function DayTimeline({ appointments, onAppointmentClick, onBookSlot, onCreate }: Props) {
  useTick();

  const today = ymd();
  const dayApts = appointments
    .filter(a => a.date === today && a.status !== 'Cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = nowMinutes();
  const nowInRange = now >= DAY_START && now <= DAY_END;
  const nowTop = AXIS_TOP + (now - DAY_START) * PX_PER_MIN;

  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START + i * 60);
  const axisHeight = AXIS_TOP * 2 + (DAY_END - DAY_START) * PX_PER_MIN;

  // Bookable gaps: 30min+ windows between consecutive appointments (and before/after).
  const gaps: { start: number; end: number }[] = [];
  let cursor = DAY_START;
  for (const a of dayApts) {
    const s = toMinutes(a.startTime);
    if (s - cursor >= 30) gaps.push({ start: cursor, end: s });
    cursor = Math.max(cursor, toMinutes(a.endTime));
  }
  if (DAY_END - cursor >= 30) gaps.push({ start: cursor, end: DAY_END });

  const isEmpty = dayApts.length === 0;

  return (
    <div className="bg-white rounded-[20px] shadow-card border border-border-subtle overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <Clock size={16} className="text-[var(--color-info)]" strokeWidth={2} />
          <h3 className="text-[15px] font-semibold text-text-primary">Timeline du jour</h3>
        </div>
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest tabular">
          08:00 – 20:00
        </span>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
          <p className="text-sm font-medium text-[#64748B]">Aucun rendez-vous aujourd'hui</p>
          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--color-info)] text-white text-sm font-medium hover:brightness-110 transition-all"
            >
              <Plus size={15} /> Planifier un RDV
            </button>
          )}
        </div>
      ) : (
        <div className="relative px-4 py-2 max-h-[560px] overflow-y-auto">
          <div className="relative" style={{ height: axisHeight }}>
            {/* Hour grid + labels */}
            {hours.map(h => {
              const top = AXIS_TOP + (h - DAY_START) * PX_PER_MIN;
              return (
                <div key={h} className="absolute left-0 right-0 flex items-center gap-3" style={{ top }}>
                  <span className="w-11 text-right text-[11px] font-medium text-text-muted tabular shrink-0">
                    {fromMinutes(h)}
                  </span>
                  <span className="flex-1 h-px bg-border-subtle/70" />
                </div>
              );
            })}

            {/* Bookable gaps */}
            {gaps.map((g, i) => {
              const top = AXIS_TOP + (g.start - DAY_START) * PX_PER_MIN;
              const height = (g.end - g.start) * PX_PER_MIN;
              if (height < 34) return null;
              return (
                <button
                  key={`gap-${i}`}
                  onClick={() => onBookSlot?.(fromMinutes(g.start))}
                  className="group absolute left-[56px] right-2 rounded-xl border border-dashed border-border-subtle hover:border-[var(--color-info)] hover:bg-[var(--color-info)]/5 transition-colors flex items-center justify-center"
                  style={{ top: top + 2, height: height - 4 }}
                >
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted/60 group-hover:text-[var(--color-info)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={12} /> Créneau libre · {fromMinutes(g.start)}
                  </span>
                </button>
              );
            })}

            {/* Appointment blocks */}
            {dayApts.map(apt => {
              const s = toMinutes(apt.startTime);
              const e = toMinutes(apt.endTime);
              const top = AXIS_TOP + (s - DAY_START) * PX_PER_MIN;
              const height = Math.max((e - s) * PX_PER_MIN, 44);
              const c = statusColor(apt);
              const Icon = TYPE_ICON[apt.type] ?? Stethoscope;
              const dim = apt.status === 'Completed';

              return (
                <button
                  key={apt.id}
                  onClick={() => onAppointmentClick?.(apt)}
                  className={`absolute left-[56px] right-2 rounded-xl border border-border-subtle bg-white hover:border-[var(--color-info)]/50 hover:shadow-md transition-all text-left overflow-hidden ${dim ? 'opacity-60' : ''} ${c.bg}`}
                  style={{ top, height }}
                >
                  <span className={`absolute left-0 inset-y-0 w-1 rounded-l-xl ${c.bar}`} />
                  <div className="pl-3.5 pr-3 py-2 flex items-center gap-2.5 h-full">
                    <Icon size={14} className={`${c.text} shrink-0`} strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">{apt.patientName}</p>
                      <p className="text-[11px] text-text-muted tabular leading-tight mt-0.5">
                        {apt.startTime} – {apt.endTime}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Now line */}
            {nowInRange && (
              <div className="absolute left-[48px] right-0 z-20 flex items-center pointer-events-none" style={{ top: nowTop }}>
                <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] shrink-0 -ml-1" />
                <span className="flex-1 h-px bg-[var(--color-danger)]" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
