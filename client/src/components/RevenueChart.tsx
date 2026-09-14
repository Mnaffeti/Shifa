import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Jan', revenue: 400 },
  { name: 'Feb', revenue: 300 },
  { name: 'Mar', revenue: 600 },
  { name: 'Apr', revenue: 450 },
  { name: 'May', revenue: 700 },
  { name: 'Jun', revenue: 550 },
  { name: 'Jul', revenue: 650 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gold text-primary px-3 py-1 rounded-pill shadow-lg font-bold text-sm">
        ${payload[0].value}K
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  return (
    <div className="card h-[360px] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-text-primary">Revenue Statistics</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-teal-light" />
            <span className="text-xs text-text-secondary">Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#B2EAE8]" />
            <span className="text-xs text-text-secondary">Inactive</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EDF2" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `$${value}K`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 4 ? '#3DD6D0' : '#B2EAE8'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
