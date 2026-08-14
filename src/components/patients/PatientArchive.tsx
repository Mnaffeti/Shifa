import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpDown, Check, LayoutGrid, List, Plus, Search, SlidersHorizontal, X,
} from 'lucide-react';
import PatientFileCard from './PatientFileCard';
import ArchiveEmptyState from './ArchiveEmptyState';
import {
  FileTag, PatientFile, SORT_LABELS, SortKey, TAG_LABELS,
  matchesQuery, sortFiles,
} from '../../lib/patientFiles';

interface Props {
  files: PatientFile[];
  onOpen: (file: PatientFile) => void;
  onCreatePatient: () => void;
  canCreate?: boolean;
  onEdit?: (file: PatientFile) => void;
  onDelete?: (file: PatientFile) => void;
}

const FILTERS: FileTag[] = ['followup', 'new', 'review'];

/** Shared control-bar button shell so search / filter / sort stay one system. */
function ControlButton({
  active, onClick, children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-11 px-4 rounded-[14px] border text-[13px] font-medium transition-all duration-200 active:scale-[0.98] ${
        active
          ? 'bg-primary/5 border-primary/25 text-primary'
          : 'bg-white border-border-subtle text-text-secondary hover:border-accent hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function Dropdown({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-60 bg-white border border-border-subtle rounded-[18px] shadow-card-hover z-40 overflow-hidden p-1.5"
    >
      {children}
    </motion.div>
  );
}

/**
 * "Dossiers patients" — the medical archive. Everything a doctor needs to
 * find and open a file: search, tag filters, sort, and list/grid views.
 */
export default function PatientArchive({
  files, onOpen, onCreatePatient, canCreate = true, onEdit, onDelete,
}: Props) {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<FileTag[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const visible = useMemo(() => {
    const filtered = files
      .filter(f => matchesQuery(f, query))
      .filter(f => activeTags.length === 0 || activeTags.some(t => f.tags.includes(t)));
    return sortFiles(filtered, sortKey);
  }, [files, query, activeTags, sortKey]);

  const isFiltering = query.trim().length > 0 || activeTags.length > 0;

  const toggleTag = (tag: FileTag) =>
    setActiveTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));

  const resetFilters = () => {
    setQuery('');
    setActiveTags([]);
  };

  return (
    <section>
      {/* ── Section head ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Dossiers patients
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Accédez rapidement aux dossiers de vos patients
          </p>
        </div>

        <span className="text-[12.5px] font-medium text-text-muted tabular pb-1">
          {visible.length} dossier{visible.length !== 1 ? 's' : ''}
          {isFiltering && files.length !== visible.length ? ` sur ${files.length}` : ''}
        </span>
      </div>

      {/* ── Control bar ── */}
      <div className="flex flex-wrap items-center gap-2.5 mt-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            size={17}
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un patient..."
            aria-label="Rechercher un patient"
            className="w-full h-11 pl-11 pr-4 rounded-[14px] bg-white border border-border-subtle text-[14px] font-normal text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <ControlButton active={activeTags.length > 0} onClick={() => { setFilterOpen(v => !v); setSortOpen(false); }}>
            <SlidersHorizontal size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Filtrer</span>
            {activeTags.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold grid place-items-center tabular">
                {activeTags.length}
              </span>
            )}
          </ControlButton>
          <AnimatePresence>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                <Dropdown>
                  {FILTERS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:bg-bg-soft transition-colors"
                    >
                      {TAG_LABELS[tag]}
                      {activeTags.includes(tag) && <Check size={15} className="text-primary" strokeWidth={2.25} />}
                    </button>
                  ))}
                  {activeTags.length > 0 && (
                    <button
                      onClick={() => setActiveTags([])}
                      className="w-full flex items-center gap-2 px-3 py-2.5 mt-1 border-t border-border-subtle rounded-xl text-[13px] font-medium text-text-muted hover:text-primary transition-colors"
                    >
                      <X size={14} strokeWidth={2} /> Effacer les filtres
                    </button>
                  )}
                </Dropdown>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <div className="relative">
          <ControlButton onClick={() => { setSortOpen(v => !v); setFilterOpen(false); }}>
            <ArrowUpDown size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">Trier</span>
          </ControlButton>
          <AnimatePresence>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                <Dropdown>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
                    <button
                      key={key}
                      onClick={() => { setSortKey(key); setSortOpen(false); }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:bg-bg-soft transition-colors"
                    >
                      {SORT_LABELS[key]}
                      {sortKey === key && <Check size={15} className="text-primary" strokeWidth={2.25} />}
                    </button>
                  ))}
                </Dropdown>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* View switcher */}
        <div className="hidden md:flex items-center gap-1 h-11 p-1 rounded-[14px] bg-white border border-border-subtle">
          {([['list', List], ['grid', LayoutGrid]] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              aria-label={mode === 'list' ? 'Vue liste' : 'Vue grille'}
              aria-pressed={view === mode}
              className={`w-9 h-full rounded-[10px] grid place-items-center transition-all duration-200 ${
                view === mode ? 'bg-primary/5 text-primary' : 'text-text-muted hover:text-primary'
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          ))}
        </div>

        {canCreate && (
          <button
            onClick={onCreatePatient}
            className="group inline-flex items-center gap-2 h-11 pl-4 pr-5 rounded-[14px] bg-primary text-white text-[13px] font-semibold shadow-sm hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
            Nouveau patient
          </button>
        )}
      </div>

      {/* ── Files ── */}
      {visible.length === 0 ? (
        <div className="mt-5 bg-white rounded-[24px] border border-border-subtle">
          <ArchiveEmptyState
            filtering={isFiltering}
            onReset={resetFilters}
            onCreatePatient={onCreatePatient}
            canCreate={canCreate}
          />
        </div>
      ) : (
        <div
          className={`mt-5 ${
            view === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-3' : 'flex flex-col gap-2.5'
          }`}
        >
          {visible.map(file => (
            <PatientFileCard
              key={file.patient.id}
              file={file}
              onOpen={onOpen}
              variant={view}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
