import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function NavbarClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:flex items-baseline gap-2.5 px-4 py-2 rounded-pill bg-white/30 backdrop-blur-md border border-white/40 shadow-sm tabular">
      <span className="text-base font-medium text-text-primary leading-none tracking-tight">
        {format(now, 'HH:mm:ss')}
      </span>
      <span className="text-xs font-medium text-text-muted leading-none">
        {format(now, 'dd/MM/yyyy')}
      </span>
    </div>
  );
}
