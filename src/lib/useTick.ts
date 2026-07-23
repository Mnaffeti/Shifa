import { useEffect, useState } from 'react';

/**
 * Force a re-render on an interval so time-derived UI (now-line, "next patient
 * in X min", estimated end-of-day) stays live without a manual refresh.
 * Default 30s → minute-resolution UI is never more than 30s stale.
 */
export function useTick(ms = 30_000) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(n => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
