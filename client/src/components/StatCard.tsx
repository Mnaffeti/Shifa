import { LucideIcon } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

export type StatTone = 'teal' | 'lime' | 'amber' | 'rose' | 'sky' | 'violet';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  update?: string;
  sparkline?: boolean;
  tone?: StatTone;
}

const TONE_STYLES: Record<StatTone, { bg: string; ring: string; icon: string; trend: string }> = {
  teal:   { bg: 'bg-teal-50',    ring: 'ring-teal-200/70',    icon: 'text-teal-600',    trend: 'bg-teal-50 text-teal-700 border-teal-200' },
  lime:   { bg: 'bg-lime-50',    ring: 'ring-lime-200/70',    icon: 'text-lime-600',    trend: 'bg-lime-50 text-lime-700 border-lime-200' },
  amber:  { bg: 'bg-amber-50',   ring: 'ring-amber-200/70',   icon: 'text-amber-600',   trend: 'bg-amber-50 text-amber-700 border-amber-200' },
  rose:   { bg: 'bg-rose-50',    ring: 'ring-rose-200/70',    icon: 'text-rose-600',    trend: 'bg-rose-50 text-rose-700 border-rose-200' },
  sky:    { bg: 'bg-sky-50',     ring: 'ring-sky-200/70',     icon: 'text-sky-600',     trend: 'bg-sky-50 text-sky-700 border-sky-200' },
  violet: { bg: 'bg-violet-50',  ring: 'ring-violet-200/70',  icon: 'text-violet-600',  trend: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export default function StatCard({ icon: Icon, label, value, update, sparkline, tone = 'teal' }: StatCardProps) {
  const data = [
    { h: 40 }, { h: 70 }, { h: 50 }, { h: 90 }, { h: 60 }, { h: 80 }, { h: 45 }
  ];

  const t = TONE_STYLES[tone];

  return (
    <div className="card flex flex-col gap-3 group cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${t.bg} ring-1 ${t.ring} flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-3`}>
            <Icon size={20} className={t.icon} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest leading-snug">{label}</p>
            <h3 className="text-2xl font-medium text-text-primary tabular leading-tight mt-0.5">{value}</h3>
          </div>
        </div>
        {update && (
          <span className={`badge border ${t.trend} text-[11px] font-medium tracking-wide tabular`}>
            {update}
          </span>
        )}
      </div>

      {sparkline && (
        <div className="h-12 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Bar dataKey="h" fill="#1A4747" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
