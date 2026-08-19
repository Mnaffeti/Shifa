import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Phone, RefreshCw, Search, Stethoscope, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { demoApi, type DemoLead } from '../lib/api';
import { relativeDay } from '../lib/patientFiles';

/** Admin-only view of everyone who opened the demo from the pre-login gate. */
export default function AdminVisitorsPage() {
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const { leads } = await demoApi.leads();
      setLeads(leads);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l =>
      `${l.name} ${l.phone} ${l.specialty ?? ''}`.toLowerCase().includes(q),
    );
  }, [leads, query]);

  const totalVisits = useMemo(() => leads.reduce((n, l) => n + l.visits, 0), [leads]);

  const fmt = (iso: string) => {
    try {
      return format(parseISO(iso), 'd MMM yyyy, HH:mm', { locale: fr });
    } catch {
      return iso;
    }
  };

  const stats = [
    { label: 'Visiteurs', value: leads.length, icon: Users },
    { label: 'Ouvertures totales', value: totalVisits, icon: CalendarDays },
    { label: 'Revenus', value: leads.filter(l => l.visits > 1).length, icon: RefreshCw },
  ];

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Visiteurs de la démo
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Les médecins qui ont ouvert la démonstration depuis la page d'accueil
          </p>
        </div>

        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-[14px] border border-border-subtle bg-white text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all disabled:opacity-60"
        >
          <RefreshCw size={15} strokeWidth={1.75} className={isLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </header>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-[18px] border border-border-subtle p-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary/5 grid place-items-center shrink-0">
                <stat.icon size={15} className="text-primary" strokeWidth={1.75} />
              </span>
              <span className="text-[11.5px] font-medium text-text-muted tracking-tight truncate">
                {stat.label}
              </span>
            </div>
            <p className="text-[30px] font-semibold text-text-primary tracking-tight leading-none mt-3 tabular">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search
          size={17}
          strokeWidth={1.75}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un nom, un téléphone ou une spécialité..."
          className="w-full h-11 pl-11 pr-4 rounded-[14px] bg-white border border-border-subtle text-[14px] font-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
        />
      </div>

      {/* List */}
      {error ? (
        <div className="mt-5 bg-white rounded-[24px] border border-rose-100 p-8 text-center">
          <p className="text-[13.5px] font-medium text-rose-700">{error}</p>
        </div>
      ) : isLoading ? (
        <p className="text-[13px] text-text-muted font-normal text-center py-14">Chargement…</p>
      ) : visible.length === 0 ? (
        <div className="mt-5 bg-white rounded-[24px] border border-border-subtle py-14 text-center">
          <span className="w-12 h-12 rounded-2xl bg-bg-soft grid place-items-center mx-auto">
            <Users size={20} className="text-text-muted" strokeWidth={1.5} />
          </span>
          <h3 className="text-[15px] font-semibold text-text-primary tracking-tight mt-4">
            {leads.length === 0 ? 'Aucun visiteur pour le moment' : 'Aucun résultat'}
          </h3>
          <p className="text-[13px] text-text-muted font-normal mt-1.5">
            {leads.length === 0
              ? 'Les médecins qui ouvrent la démo apparaîtront ici.'
              : 'Essayez un autre nom, téléphone ou spécialité.'}
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {visible.map(lead => (
            <div
              key={lead.id}
              className="bg-white rounded-[18px] border border-border-subtle p-4 flex items-start gap-4 transition-all duration-300 hover:border-accent hover:shadow-card-hover"
            >
              <span className="w-11 h-11 rounded-xl bg-primary/[0.06] border border-border-subtle grid place-items-center shrink-0 text-[13px] font-semibold text-primary/75">
                {lead.name.replace(/^(dr|pr)\.?\s*/i, '').slice(0, 2).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-text-primary tracking-tight truncate">
                    {lead.name}
                  </h3>
                  {lead.visits > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/[0.08] border border-primary/15 text-[10.5px] font-medium text-primary">
                      {lead.visits} visites
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary font-normal tabular">
                    <Phone size={12} strokeWidth={1.75} className="text-text-muted shrink-0" />
                    {lead.phone}
                  </span>
                  {lead.specialty && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary font-normal">
                      <Stethoscope size={12} strokeWidth={1.75} className="text-text-muted shrink-0" />
                      {lead.specialty}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[12px] text-text-primary font-medium tabular">
                  {relativeDay(lead.lastSeenAt.slice(0, 10)) ?? ''}
                </p>
                <p className="text-[11px] text-text-muted font-normal tabular mt-0.5">
                  {fmt(lead.lastSeenAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
