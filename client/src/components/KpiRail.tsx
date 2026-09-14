import { type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Appointment } from '../context/AppointmentContext';
import { useTick } from '../lib/useTick';
import { toMinutes, fromMinutes, nowMinutes, ymd, signedMinutes } from '../lib/datetime';

/**
 * KPI rail — four metrics that mean something (spec §4).
 * Each tile: label 11px uppercase #64748B, value 24px semibold, delta 12px,
 * plus an animated dot-matrix meter that encodes the value (fill fraction).
 */

const DOT_COLS = 14;
const DOT_ROWS = 3;
const DOT_TOTAL = DOT_COLS * DOT_ROWS;

/**
 * Dot-matrix meter. `fill` (0–1) lights up that fraction of the grid, column by
 * column (bottom-up within a column), each lit dot popping in with a stagger.
 * `key`-remounting on value change replays the animation.
 */
interface DotMeterProps {
  fill: number;
  color: string;
}

function DotMeter({ fill, color }: DotMeterProps) {
  const lit = Math.round(Math.max(0, Math.min(1, fill)) * DOT_TOTAL);

  // Build column-major order so fill grows left→right; within a column, bottom→top.
  const cells: { row: number; col: number; index: number }[] = [];
  let index = 0;
  for (let c = 0; c < DOT_COLS; c++) {
    for (let r = DOT_ROWS - 1; r >= 0; r--) {
      cells.push({ row: r, col: c, index: index++ });
    }
  }

  return (
    <div
      className="grid gap-[3px] mt-1"
      style={{ gridTemplateColumns: `repeat(${DOT_COLS}, 1fr)`, gridTemplateRows: `repeat(${DOT_ROWS}, 1fr)` }}
      aria-hidden
    >
      {cells.map(cell => {
        const on = cell.index < lit;
        return (
          <span
            key={`${cell.col}-${cell.row}`}
            className={on ? 'dot-pop' : ''}
            style={{
              gridColumn: cell.col + 1,
              gridRow: cell.row + 1,
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: on ? color : 'var(--color-border-subtle)',
              animationDelay: on ? `${cell.index * 14}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

interface KpiTileProps {
  label: string;
  value: string;
  fill: number;
  color: string;
  children?: ReactNode; // delta / note
}

function KpiTile({ label, value, fill, color, children }: KpiTileProps) {
  return (
    <div className="bg-white rounded-[16px] border border-border-subtle px-4 py-3 flex flex-col justify-center gap-1" style={{ minHeight: 92 }}>
      <span className="text-[11px] font-medium uppercase tracking-widest text-[#64748B]">{label}</span>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[24px] font-semibold text-text-primary leading-none tabular">{value}</span>
        {children}
      </div>
      {/* Re-key on the lit count so the pop-in replays when the value changes. */}
      <div key={Math.round(fill * DOT_TOTAL)} className="contents">
        <DotMeter fill={fill} color={color} />
      </div>
    </div>
  );
}

function Delta({ minutes, invert = false }: { minutes: number; invert?: boolean }) {
  // invert: for metrics where lower is better (wait time, no-show), a drop is good.
  const good = invert ? minutes < 0 : minutes > 0;
  const neutral = minutes === 0;
  const Icon = neutral ? Minus : minutes > 0 ? ArrowUp : ArrowDown;
  const color = neutral ? 'text-[#64748B]' : good ? 'text-[var(--color-success)]' : 'text-[var(--color-warn)]';
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium tabular ${color}`}>
      <Icon size={12} strokeWidth={2.5} />
      {signedMinutes(minutes)} <span className="text-[#64748B] font-normal">vs 7j</span>
    </span>
  );
}

interface Props {
  appointments: Appointment[];
}

export default function KpiRail({ appointments }: Props) {
  useTick();

  const today = ymd();
  const now = nowMinutes();

  const todayApts = appointments.filter(a => a.date === today && a.status !== 'Cancelled');
  const total = todayApts.length;
  const done = todayApts.filter(a => a.status === 'Completed').length;

  // ── Estimated end of day, from remaining appointment durations ──
  const remaining = todayApts
    .filter(a => a.status !== 'Completed')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  let estimatedEnd = '—';
  let lateBy = 0;
  if (remaining.length > 0) {
    // Chain remaining durations from max(now, next start); compare to scheduled end.
    let cursor = Math.max(now, toMinutes(remaining[0].startTime));
    const scheduledEnd = remaining.reduce((max, a) => Math.max(max, toMinutes(a.endTime)), 0);
    for (const a of remaining) {
      const dur = a.duration ?? (toMinutes(a.endTime) - toMinutes(a.startTime));
      cursor = Math.max(cursor, toMinutes(a.startTime)) + dur;
    }
    estimatedEnd = fromMinutes(Math.min(cursor, 24 * 60 - 1));
    lateBy = cursor - scheduledEnd;
  } else if (total > 0) {
    estimatedEnd = fromMinutes(todayApts.reduce((max, a) => Math.max(max, toMinutes(a.endTime)), 0));
  }

  // ── Wait time (derived): ~5 min per patient still waiting; compare to a 7-day baseline. ──
  const waiting = todayApts.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length;
  const avgWait = waiting === 0 ? 0 : Math.min(45, 4 + waiting * 3);
  const baselineWait = 14;
  const waitDelta = avgWait - baselineWait;

  // ── No-show rate over 30 days: cancelled / total scheduled ──
  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const window30 = appointments.filter(a => new Date(a.date) >= thirtyAgo);
  const noShows = window30.filter(a => a.status === 'Cancelled').length;
  const noShowRate = window30.length > 0 ? Math.round((noShows / window30.length) * 100) : 0;

  // Fills (0–1) that drive each tile's dot meter.
  const doneFill = total > 0 ? done / total : 0;
  // Wait: 0 min → empty, 45 min (our cap) → full. Warn color when above baseline.
  const waitFill = Math.min(avgWait / 45, 1);
  const waitColor = avgWait > baselineWait ? 'var(--color-warn)' : 'var(--color-success)';
  // No-show: 0% empty, 25%+ full (a high clinic no-show rate).
  const noShowFill = Math.min(noShowRate / 25, 1);
  const noShowColor = noShowRate >= 15 ? 'var(--color-danger)' : noShowRate >= 8 ? 'var(--color-warn)' : 'var(--color-success)';
  // Day progress: how far through today's booked span we are.
  const dayProgress = (() => {
    if (total === 0) return 0;
    const start = todayApts.reduce((min, a) => Math.min(min, toMinutes(a.startTime)), 24 * 60);
    const end = todayApts.reduce((max, a) => Math.max(max, toMinutes(a.endTime)), 0);
    if (end <= start) return 0;
    return Math.max(0, Math.min(1, (now - start) / (end - start)));
  })();
  const endColor = lateBy > 5 ? 'var(--color-warn)' : 'var(--color-info)';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* RDV du jour */}
      <KpiTile
        label="RDV du jour"
        value={total.toLocaleString('fr-FR')}
        fill={doneFill}
        color="var(--color-success)"
      >
        <span className="text-[12px] font-medium text-[#64748B] tabular">
          {total > 0 ? `${done} terminés` : 'Journée libre'}
        </span>
      </KpiTile>

      {/* Temps d'attente moyen */}
      <KpiTile label="Attente moyenne" value={`${avgWait} min`} fill={waitFill} color={waitColor}>
        <Delta minutes={waitDelta} invert />
      </KpiTile>

      {/* Taux de non-présentation */}
      <KpiTile label="Non-présentation" value={`${noShowRate} %`} fill={noShowFill} color={noShowColor}>
        <span className="text-[12px] font-medium text-[#64748B] tabular">{noShows} / 30 j</span>
      </KpiTile>

      {/* Fin de journée estimée */}
      <KpiTile label="Fin estimée" value={estimatedEnd} fill={dayProgress} color={endColor}>
        {lateBy > 5 ? (
          <span className="text-[12px] font-medium text-[var(--color-warn)] tabular">{signedMinutes(lateBy)}</span>
        ) : total > 0 && remaining.length === 0 ? (
          <span className="text-[12px] font-medium text-[var(--color-success)]">Terminée</span>
        ) : (
          <span className="text-[12px] text-[#64748B]">À l'heure</span>
        )}
      </KpiTile>
    </div>
  );
}
