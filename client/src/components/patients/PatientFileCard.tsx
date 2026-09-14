import { ArrowRight, CalendarClock, FileText, History, Pencil, Trash2 } from 'lucide-react';
import {
  PatientFile, TAG_LABELS, TAG_STYLES, fileDate, initials,
} from '../../lib/patientFiles';

interface Props {
  key?: string;
  file: PatientFile;
  onOpen: (file: PatientFile) => void;
  /** Grid mode stacks the metadata instead of laying it out in a row. */
  variant?: 'list' | 'grid';
  onEdit?: (file: PatientFile) => void;
  onDelete?: (file: PatientFile) => void;
}

/**
 * Initials monogram. Deliberately not the stored `avatar` URL: those are
 * random stock photos, which read as noise in a clinical archive and imply
 * a patient likeness the record doesn't actually hold.
 */
function FileAvatar({ file }: { file: PatientFile }) {
  const { patient } = file;
  return (
    <div className="w-[52px] h-[52px] shrink-0 rounded-2xl bg-primary/[0.06] border border-border-subtle grid place-items-center transition-colors duration-300 group-hover:border-accent group-hover:bg-primary/[0.09]">
      <span className="text-[15px] font-semibold text-primary/75 tracking-tight">
        {initials(patient.firstName, patient.lastName)}
      </span>
    </div>
  );
}

/** One metadata line: icon + label + value. */
function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary font-normal">
      <Icon size={13} className="text-text-muted/70 shrink-0" strokeWidth={1.75} />
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-medium tabular">{value}</span>
    </span>
  );
}

/**
 * A patient rendered as a medical file: identity dominates, the appointment is
 * metadata. The folder metaphor is carried by the small tab above the card and
 * the layered edge on its right — deliberately subtle.
 */
export default function PatientFileCard({
  file, onOpen, variant = 'list', onEdit, onDelete,
}: Props) {
  const { patient, age, lastConsultation, nextConsultation, consultationCount } = file;

  const lastLabel = fileDate(lastConsultation);
  const nextLabel = fileDate(nextConsultation);
  const identity = [age !== null ? `${age} ans` : null, patient.gender].filter(Boolean).join(' · ');

  // The lift lives on the wrapper so the folder tab travels with the card.
  return (
    <div className="group relative pt-[7px] transition-transform duration-300 hover:-translate-y-0.5">
      {/* Folder tab — overlaps the card top by 1px so the two read as one
          sheet rather than a detached chip. */}
      <div className="absolute top-0 left-7 h-2 w-16 rounded-t-[6px] bg-white border border-b-0 border-border-subtle transition-colors duration-300 group-hover:border-accent" />
      <div className="absolute top-[7px] left-7 h-px w-16 bg-white z-10 transition-colors duration-300 group-hover:bg-accent/10" />

      {/* Not a <button>: the card holds its own edit/delete controls, which
          may not be nested inside another button. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(file)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(file);
          }
        }}
        aria-label={`Ouvrir le dossier de ${patient.firstName} ${patient.lastName}`}
        className={`relative w-full text-left cursor-pointer bg-white rounded-[18px] border border-border-subtle p-5 flex gap-4 transition-all duration-300 group-hover:border-accent group-hover:shadow-card-hover focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-primary/10 ${
          variant === 'grid' ? 'flex-col' : 'items-center'
        }`}
      >
        {/* Layered "documents inside" edge */}
        <span className="pointer-events-none absolute right-1.5 top-4 bottom-4 w-px bg-border-subtle/70" />
        <span className="pointer-events-none absolute right-3 top-6 bottom-6 w-px bg-border-subtle/40" />

        <div className={`flex items-center gap-4 min-w-0 ${variant === 'grid' ? 'w-full' : ''}`}>
          <FileAvatar file={file} />

          <div className="min-w-0 flex-1">
            {/* Identity carries the strongest hierarchy on the card. */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[17px] font-semibold text-text-primary tracking-tight truncate transition-colors duration-200 group-hover:text-primary">
                {patient.firstName} {patient.lastName}
              </h3>
              {file.tags.map(tag => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${TAG_STYLES[tag]}`}
                >
                  {TAG_LABELS[tag]}
                </span>
              ))}
            </div>
            <p className="text-[12.5px] text-text-muted font-normal mt-0.5 tabular">
              {identity || patient.id}
              <span className="text-text-muted/40 mx-1.5">·</span>
              <span className="font-mono text-[11.5px]">{patient.id}</span>
            </p>
          </div>
        </div>

        {/* Medical metadata — reads as file contents, not as a schedule. */}
        <div
          className={`flex flex-wrap gap-x-5 gap-y-1.5 min-w-0 ${
            variant === 'grid' ? 'w-full pt-1' : 'flex-1 justify-end pr-6'
          }`}
        >
          {lastLabel && <Meta icon={History} label="Dernière consultation" value={lastLabel} />}
          {nextLabel && <Meta icon={CalendarClock} label="Prochaine" value={nextLabel} />}
          {consultationCount > 0 && (
            <Meta
              icon={FileText}
              label="Dossier"
              value={`${consultationCount} consultation${consultationCount > 1 ? 's' : ''}`}
            />
          )}
          {!lastLabel && !nextLabel && consultationCount === 0 && (
            <span className="text-[12.5px] text-text-muted font-normal italic">
              Dossier vide — aucune consultation enregistrée
            </span>
          )}
        </div>

        {/* Actions + open affordance */}
        <div
          className={`flex items-center gap-1 shrink-0 ${
            variant === 'grid' ? 'w-full justify-end border-t border-border-subtle pt-3 mt-1' : ''
          }`}
        >
          {/* Record-management actions stay quiet until the file is hovered. */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              {onEdit && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onEdit(file); }}
                  title="Modifier la fiche"
                  aria-label={`Modifier la fiche de ${patient.firstName} ${patient.lastName}`}
                  className="p-2 rounded-full text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <Pencil size={15} strokeWidth={1.75} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onDelete(file); }}
                  title="Supprimer le dossier"
                  aria-label={`Supprimer le dossier de ${patient.firstName} ${patient.lastName}`}
                  className="p-2 rounded-full text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              )}
            </div>
          )}

          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-muted whitespace-nowrap transition-colors duration-200 group-hover:text-primary">
            Ouvrir le dossier
            <ArrowRight
              size={14}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
