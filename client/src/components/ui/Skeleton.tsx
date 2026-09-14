/**
 * Skeleton loaders (spec §10) — geometry matches the real cards so there is no
 * layout shift when data arrives. Respects prefers-reduced-motion.
 */

import { type CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={`bg-border-subtle/70 rounded-md animate-pulse motion-reduce:animate-none ${className}`}
    />
  );
}

/** KPI tile skeleton — 72px, matches KpiRail tiles. */
export function KpiTileSkeleton() {
  return (
    <div className="bg-white rounded-[16px] border border-border-subtle px-4 py-3 flex flex-col justify-center gap-2" style={{ minHeight: 72 }}>
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

/** Chart card skeleton — header + plot area. */
export function ChartCardSkeleton({ height = 160 }: { height?: number }) {
  return (
    <div className="bg-white rounded-[16px] border border-border-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  );
}

/** Sparkline strip skeleton — 64px. */
export function SparklineSkeleton() {
  return (
    <div className="bg-white rounded-[16px] border border-border-subtle px-5 flex items-center gap-4" style={{ height: 64 }}>
      <Skeleton className="h-3 w-28" />
      <div className="flex-1 flex items-end gap-1.5 h-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex items-end" style={{ height: `${30 + (i % 3) * 20}%` }}>
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
