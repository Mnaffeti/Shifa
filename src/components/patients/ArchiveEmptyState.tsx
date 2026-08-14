import { Plus, RotateCcw } from 'lucide-react';

interface Props {
  /** True when the archive has files but the query/filters match none of them. */
  filtering: boolean;
  onReset: () => void;
  onCreatePatient: () => void;
  canCreate?: boolean;
}

/**
 * Line-art folder holding two documents — drawn inline so it inherits the
 * brand tokens and stays crisp at any size. Deliberately quiet: no fills
 * beyond a faint tint, no medical clip-art.
 */
function FolderIllustration() {
  return (
    <svg width="112" height="88" viewBox="0 0 112 88" fill="none" aria-hidden="true">
      {/* Documents peeking out of the folder */}
      <rect
        x="34" y="12" width="44" height="40" rx="5"
        fill="white" stroke="var(--color-border-subtle)" strokeWidth="1.5"
      />
      <line x1="42" y1="24" x2="66" y2="24" stroke="var(--color-border-subtle)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="42" y1="32" x2="60" y2="32" stroke="var(--color-border-subtle)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Folder back + tab */}
      <path
        d="M14 26a5 5 0 015-5h17l6 8h40a5 5 0 015 5v34a5 5 0 01-5 5H19a5 5 0 01-5-5V26z"
        fill="var(--color-primary)" fillOpacity="0.04"
        stroke="var(--color-primary)" strokeOpacity="0.28" strokeWidth="1.75"
      />
      {/* Folder front flap */}
      <path
        d="M14 42h84v25a5 5 0 01-5 5H19a5 5 0 01-5-5V42z"
        fill="white" fillOpacity="0.7"
        stroke="var(--color-primary)" strokeOpacity="0.2" strokeWidth="1.5"
      />
      {/* Accent medical cross */}
      <path
        d="M56 52v10M51 57h10"
        stroke="var(--color-primary)" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  );
}

/** Polished empty state — distinguishes "no data yet" from "no match". */
export default function ArchiveEmptyState({
  filtering, onReset, onCreatePatient, canCreate = true,
}: Props) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <FolderIllustration />

      <h3 className="text-[17px] font-semibold text-text-primary tracking-tight mt-6">
        {filtering ? 'Aucun dossier ne correspond' : 'Aucun patient pour le moment'}
      </h3>
      <p className="text-[13px] text-text-muted font-normal mt-1.5 max-w-[38ch] leading-relaxed">
        {filtering
          ? 'Essayez un autre nom, ou réinitialisez la recherche et les filtres pour retrouver vos dossiers.'
          : 'Commencez par créer votre premier dossier patient. Il apparaîtra ici, prêt à être consulté.'}
      </p>

      {filtering ? (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 mt-5 h-11 px-5 rounded-[14px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all active:scale-[0.98]"
        >
          <RotateCcw size={15} strokeWidth={1.75} />
          Réinitialiser la recherche
        </button>
      ) : canCreate ? (
        <button
          onClick={onCreatePatient}
          className="group inline-flex items-center gap-2 mt-5 h-11 pl-4 pr-5 rounded-[14px] bg-primary text-white text-[13px] font-semibold shadow-sm hover:brightness-110 transition-all active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
          Nouveau patient
        </button>
      ) : null}
    </div>
  );
}
