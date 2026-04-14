import { LucideIcon } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  update: string;
  sparkline?: boolean;
}

export default function StatCard({ icon: Icon, label, value, update, sparkline }: StatCardProps) {
  const data = [
    { h: 40 }, { h: 70 }, { h: 50 }, { h: 90 }, { h: 60 }, { h: 80 }, { h: 45 }
  ];

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F9C4] flex items-center justify-center text-[#B5CC30]">
            <Icon size={20} />
          </div>
          <div>
            <p className="text-lg font-medium text-text-secondary leading-snug">{label}</p>
            <h3 className="text-xl font-bold text-text-primary tabular leading-tight">{value}</h3>
          </div>
        </div>
        <span className="badge bg-[#F3F4F6] text-text-muted text-xs font-light tracking-wide">
          {update}
        </span>
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
