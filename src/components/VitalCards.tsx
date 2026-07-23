import { useMemo } from 'react';

/**
 * "Daily Updates" style vital cards for the patient file.
 * Compact cards showing a headline value + a small chart:
 *  - Oxygen (SpO₂): dot-bar chart
 *  - Heart rate: ECG-style waveform
 *
 * There is no stored time-series, so a small deterministic trend is
 * synthesized around the latest reading purely for visualization.
 */

// Deterministic pseudo-random so the chart is stable across renders.
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeTrend(base: number, spread: number, count: number, seed: number): number[] {
  const rnd = seeded(seed);
  return Array.from({ length: count }, () => base + (rnd() - 0.5) * 2 * spread);
}

// ── Oxygen dot-bar chart ─────────────────────────────────────────────
function DotBars({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className="flex items-end justify-between gap-1 h-16">
      {values.map((val, i) => {
        // 2–5 dots per column depending on the value
        const dots = 2 + Math.round(((val - min) / range) * 3);
        const faded = i % 3 === 2; // occasional lighter column, like the reference
        return (
          <div key={i} className="flex flex-col-reverse items-center gap-1 flex-1">
            {Array.from({ length: dots }).map((_, d) => (
              <span
                key={d}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color, opacity: faded ? 0.35 : 0.9 }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Heart-rate ECG waveform ──────────────────────────────────────────
function EcgLine({ color, seed }: { color: string; seed: number }) {
  const path = useMemo(() => {
    const rnd = seeded(seed);
    const W = 240;
    const H = 60;
    const mid = H / 2;
    const beats = 4;
    const segW = W / beats;
    let d = `M 0 ${mid}`;
    for (let b = 0; b < beats; b++) {
      const x = b * segW;
      const jitter = (rnd() - 0.5) * 4;
      // baseline wiggle → small bump → sharp QRS spike → small dip → baseline
      d +=
        ` L ${x + segW * 0.15} ${mid + jitter}` +
        ` L ${x + segW * 0.28} ${mid - 5}` +
        ` L ${x + segW * 0.38} ${mid + 3}` +
        ` L ${x + segW * 0.46} ${mid - (H * 0.42)}` + // R spike
        ` L ${x + segW * 0.52} ${mid + (H * 0.28)}` + // S dip
        ` L ${x + segW * 0.6} ${mid}` +
        ` L ${x + segW * 0.78} ${mid - 6}` +
        ` L ${x + segW} ${mid}`;
    }
    return d;
  }, [seed]);

  return (
    <svg viewBox="0 0 240 60" className="w-full h-16" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface VitalCardsProps {
  hr?: number;
  spo2?: number;
}

const ORANGE = '#F97056';

export default function VitalCards({ hr, spo2 }: VitalCardsProps) {
  // seed from the values so each patient's chart looks distinct but stable
  const spo2Seed = Math.round((spo2 ?? 97) * 137 + 11);
  const hrSeed = Math.round((hr ?? 75) * 131 + 7);

  const oxygenTrend = useMemo(
    () => makeTrend(spo2 ?? 97, 1.5, 8, spo2Seed),
    [spo2, spo2Seed]
  );

  const spo2Normal = spo2 === undefined ? null : spo2 >= 95;
  const hrNormal = hr === undefined ? null : hr >= 60 && hr <= 100;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Oxygen */}
      <div className="bg-white rounded-2xl border border-border-subtle p-4 hover-card">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[13px] font-bold text-text-primary">Oxygène</span>
        </div>
        {spo2 !== undefined ? (
          <>
            <StatusPill ok={spo2Normal} okLabel="Normal" lowLabel="Bas" />
            <p className="text-3xl font-bold text-text-primary leading-none mt-1 mb-3 tabular">
              {spo2}
              <span className="text-sm text-text-muted font-medium ml-0.5">%</span>
            </p>
            <DotBars values={oxygenTrend} color={ORANGE} />
          </>
        ) : (
          <Empty />
        )}
      </div>

      {/* Heart rate */}
      <div className="bg-white rounded-2xl border border-border-subtle p-4 hover-card">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[13px] font-bold text-text-primary">Fréq. cardiaque</span>
        </div>
        {hr !== undefined ? (
          <>
            <StatusPill ok={hrNormal} okLabel="Normal" lowLabel={hr < 60 ? 'Bas' : 'Élevé'} />
            <p className="text-3xl font-bold text-text-primary leading-none mt-1 mb-3 tabular">
              {hr}
              <span className="text-sm text-text-muted font-medium ml-1">bpm</span>
            </p>
            <EcgLine color={ORANGE} seed={hrSeed} />
          </>
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

function StatusPill({ ok, okLabel, lowLabel }: { ok: boolean | null; okLabel: string; lowLabel: string }) {
  if (ok === null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-[#F97056]'}`} />
      <span className={ok ? 'text-emerald-600' : 'text-[#F97056]'}>{ok ? okLabel : lowLabel}</span>
    </span>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center h-24 text-center">
      <p className="text-lg font-medium text-text-muted/30">—</p>
      <p className="text-[10px] text-text-muted mt-1">Aucune donnée</p>
    </div>
  );
}
