import { useRef, useState, type ReactNode } from 'react';
import {
  ChevronLeft, Plus, X, Trash2, Calendar, Stethoscope,
  AlertTriangle, Activity, Heart, Scale, Thermometer, Waves, Ruler,
  Pill, ClipboardList, StickyNote, Paperclip, Upload, FileText,
  ScanLine, Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useChart, Attachment } from '../context/ChartContext';
import { useConsultations } from '../context/ConsultationContext';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  patient: Patient;
  onBack: () => void;
  onOpenConsultation?: (apt: Appointment) => void;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmt(iso: string, pattern = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(iso), pattern, { locale: fr });
  } catch {
    return iso;
  }
}

// ─── Section card shell ─────────────────────────────────────────────────────

function SectionCard({
  icon: Icon, title, count, action, children,
}: {
  icon: any;
  title: string;
  count?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="group bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Icon size={14} className="text-text-muted/50 group-hover:text-primary transition-colors" strokeWidth={1.75} />
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-widest group-hover:text-text-secondary transition-colors">{title}</h3>
        </div>
        {action}
      </div>
      {count && <p className="text-sm font-medium text-text-secondary -mt-2 mb-4">{count}</p>}
      {children}
    </div>
  );
}

// ─── Inline add row (text → onAdd) ──────────────────────────────────────────

function InlineAdd({
  placeholder, onAdd, onCancel,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); setValue(''); }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
        onClick={() => { if (value.trim()) { onAdd(value.trim()); setValue(''); } }}
        className="p-2 rounded-xl bg-primary text-white hover:opacity-90 transition-all shrink-0"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={onCancel}
        className="p-2 rounded-xl border border-border-subtle text-text-muted hover:bg-bg-soft transition-all shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PatientChartPage({ patient, onBack, onOpenConsultation }: Props) {
  const { user } = useAuth();
  const {
    getChart, addProbleme, removeProbleme, addTraitement, removeTraitement,
    addAlerte, removeAlerte, addNote, removeNote, addAttachment, removeAttachment,
  } = useChart();
  const { getPatientConsultations } = useConsultations();
  const { appointments } = useAppointments();

  const chart = getChart(patient.id);
  const consultations = getPatientConsultations(patient.id).filter(c => c.status === 'signed');
  const canEdit = user?.role === 'DOCTOR';

  const v = chart.dernieresConstantes;

  // local UI state for the inline editors
  const [addingCondition, setAddingCondition] = useState(false);
  const [addingAlert, setAddingAlert] = useState(false);
  const [addingMed, setAddingMed] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [medDraft, setMedDraft] = useState({ name: '', dosage: '', frequency: '' });
  const [preview, setPreview] = useState<Attachment | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const kind: Attachment['kind'] = file.type.startsWith('image/')
          ? (/scan/i.test(file.name) ? 'scan' : 'photo')
          : 'document';
        addAttachment(patient.id, {
          name: file.name,
          kind,
          mimeType: file.type,
          dataUrl,
          addedBy: user?.name ?? '',
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const VITALS = [
    { label: 'Tension', value: v?.bp, unit: 'mmHg', icon: Heart },
    { label: 'Fréq. card.', value: v?.hr, unit: 'bpm', icon: Activity },
    { label: 'Température', value: v?.temp, unit: '°C', icon: Thermometer },
    { label: 'SpO₂', value: v?.spo2, unit: '%', icon: Waves },
    { label: 'Poids', value: v?.weight, unit: 'kg', icon: Scale },
    { label: 'Taille', value: v?.height, unit: 'cm', icon: Ruler },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 px-3 py-1.5 -ml-3 rounded-full text-sm font-medium text-text-secondary hover:text-primary hover:bg-bg-soft transition-colors">
          <ChevronLeft size={16} strokeWidth={2} />
          Retour aux patients
        </button>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_320px] gap-6 items-start">

        {/* ══ LEFT PANEL ══ */}
        <div className="flex flex-col gap-5 xl:sticky xl:top-6">
          {/* Identity */}
          <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card">
            <h2 className="text-xl font-medium text-text-primary leading-tight tracking-tight">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-[11px] font-medium text-text-muted tabular mt-1 tracking-wider">{patient.id}</p>

            <div className="mt-5 pt-5 border-t border-border-subtle space-y-3">
              {[
                ['Âge', `${calcAge(patient.dob)} ans`],
                ['Genre', patient.gender],
                ['Groupe sanguin', patient.bloodType],
                ['Téléphone', patient.phone || '—'],
              ].map(([k, val]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted font-medium">{k}</span>
                  <span className="text-text-primary font-medium text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical alerts */}
          <SectionCard
            icon={AlertTriangle}
            title="Alertes médicales"
            action={canEdit && (
              <button
                onClick={() => setAddingAlert(v => !v)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-border-subtle text-text-muted hover:text-primary hover:border-primary/40 transition-all"
              >
                <Plus size={14} />
              </button>
            )}
          >
            <div className="space-y-2">
              {chart.alertes.length === 0 && !addingAlert && (
                <p className="text-xs text-text-muted">Aucune alerte.</p>
              )}
              {chart.alertes.map(a => (
                <div
                  key={a.id}
                  className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200"
                >
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" strokeWidth={2} />
                  <span className="text-sm font-medium text-amber-900 flex-1">{a.label}</span>
                  {canEdit && (
                    <button
                      onClick={() => removeAlerte(patient.id, a.id)}
                      className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-700 transition-all"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              {addingAlert && (
                <InlineAdd
                  placeholder="Nouvelle alerte..."
                  onAdd={label => { addAlerte(patient.id, label); }}
                  onCancel={() => setAddingAlert(false)}
                />
              )}
            </div>
          </SectionCard>

          {/* Latest vitals */}
          <SectionCard icon={Activity} title="Dernières constantes">
            {v?.date && (
              <p className="text-[11px] text-text-muted -mt-2 mb-3 tabular">Saisies le {fmt(v.date)}</p>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              {VITALS.map(vit => (
                <div key={vit.label} className="bg-bg-soft rounded-xl p-3 border border-border-subtle">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <vit.icon size={11} className="text-text-muted/50" strokeWidth={1.75} />
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{vit.label}</span>
                  </div>
                  {vit.value !== undefined && vit.value !== '' ? (
                    <p className="text-lg font-medium text-text-primary leading-none tabular">
                      {vit.value}
                      <span className="text-[10px] text-text-muted font-medium ml-1">{vit.unit}</span>
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-text-muted/30 leading-none">—</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ══ MIDDLE SECTION ══ */}
        <div className="flex flex-col gap-5">
          {/* Active conditions */}
          <SectionCard
            icon={ClipboardList}
            title="Conditions actives"
            count={`${chart.problemesActifs.length} condition${chart.problemesActifs.length !== 1 ? 's' : ''} diagnostiquée${chart.problemesActifs.length !== 1 ? 's' : ''}`}
            action={canEdit && (
              <button
                onClick={() => setAddingCondition(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-primary hover:bg-primary/[0.06] transition-all"
              >
                <Plus size={13} /> Ajouter
              </button>
            )}
          >
            <div className="flex flex-wrap gap-2">
              {chart.problemesActifs.map(p => (
                <span
                  key={p.id}
                  className="group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-sm font-medium text-violet-800"
                >
                  {p.cimCode && <span className="text-[10px] font-semibold text-violet-500 tabular">{p.cimCode}</span>}
                  {p.label}
                  {canEdit && (
                    <button
                      onClick={() => removeProbleme(patient.id, p.id)}
                      className="text-violet-400 hover:text-red-500 transition-colors ml-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </span>
              ))}
              {chart.problemesActifs.length === 0 && !addingCondition && (
                <p className="text-sm text-text-muted">Aucune condition active.</p>
              )}
            </div>
            {addingCondition && (
              <div className="mt-3">
                <InlineAdd
                  placeholder="Nouvelle condition (ex : Hypertension)..."
                  onAdd={label => { addProbleme(patient.id, label); }}
                  onCancel={() => setAddingCondition(false)}
                />
              </div>
            )}
          </SectionCard>

          {/* Current medications */}
          <SectionCard
            icon={Pill}
            title="Médicaments actifs"
            count={`${chart.traitements.length} prescription${chart.traitements.length !== 1 ? 's' : ''} active${chart.traitements.length !== 1 ? 's' : ''}`}
            action={canEdit && (
              <button
                onClick={() => setAddingMed(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-primary hover:bg-primary/[0.06] transition-all"
              >
                <Plus size={13} /> Ajouter
              </button>
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {chart.traitements.map(t => (
                <div
                  key={t.id}
                  className="group relative bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100 p-4 transition-all hover:border-teal-300 hover:-translate-y-0.5"
                >
                  {canEdit && (
                    <button
                      onClick={() => removeTraitement(patient.id, t.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-white transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <div className="w-9 h-9 rounded-xl bg-teal-100 ring-1 ring-teal-200 flex items-center justify-center mb-3 transition-transform group-hover:rotate-6">
                    <Pill size={15} className="text-teal-600" strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium text-text-primary leading-tight">{t.name}</p>
                  <p className="text-xs text-teal-700 mt-0.5 tabular font-medium">{t.dosage}</p>
                  <p className="text-xs text-text-secondary font-medium mt-2">{t.frequency}</p>
                </div>
              ))}
              {chart.traitements.length === 0 && !addingMed && (
                <p className="text-sm text-text-muted">Aucun médicament actif.</p>
              )}
            </div>
            {addingMed && (
              <div className="mt-4 p-4 rounded-2xl border border-border-subtle bg-bg-soft space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    autoFocus
                    value={medDraft.name}
                    onChange={e => setMedDraft({ ...medDraft, name: e.target.value })}
                    placeholder="Médicament"
                    className="px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={medDraft.dosage}
                    onChange={e => setMedDraft({ ...medDraft, dosage: e.target.value })}
                    placeholder="Dosage (ex : 5 mg)"
                    className="px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={medDraft.frequency}
                    onChange={e => setMedDraft({ ...medDraft, frequency: e.target.value })}
                    placeholder="Fréquence"
                    className="px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setAddingMed(false); setMedDraft({ name: '', dosage: '', frequency: '' }); }}
                    className="px-4 py-2 rounded-xl border border-border-subtle text-sm font-bold text-text-secondary hover:bg-white transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (!medDraft.name.trim()) return;
                      addTraitement(patient.id, {
                        name: medDraft.name.trim(),
                        dosage: medDraft.dosage.trim(),
                        frequency: medDraft.frequency.trim(),
                        since: new Date().toISOString().slice(0, 7),
                      });
                      setMedDraft({ name: '', dosage: '', frequency: '' });
                      setAddingMed(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* My notes */}
          <SectionCard
            icon={StickyNote}
            title="Mes notes"
            action={canEdit && !addingNote && (
              <button
                onClick={() => setAddingNote(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-primary hover:bg-primary/[0.06] transition-all"
              >
                <Plus size={13} /> Ajouter
              </button>
            )}
          >
            {addingNote && (
              <div className="mb-4 space-y-2">
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Saisir une note clinique..."
                  className="w-full min-h-[90px] px-4 py-3 rounded-2xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setAddingNote(false); setNoteText(''); }}
                    className="px-4 py-2 rounded-xl border border-border-subtle text-sm font-bold text-text-secondary hover:bg-bg-soft transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (!noteText.trim()) return;
                      addNote(patient.id, noteText.trim(), user?.name ?? '');
                      setNoteText('');
                      setAddingNote(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2.5">
              {chart.notes.length === 0 && !addingNote && (
                <p className="text-sm text-text-muted">Aucune note.</p>
              )}
              {chart.notes.map(n => (
                <div key={n.id} className="group relative p-4 rounded-xl bg-bg-soft border border-border-subtle">
                  {canEdit && (
                    <button
                      onClick={() => removeNote(patient.id, n.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-white transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap pr-6">{n.text}</p>
                  <p className="text-[11px] text-text-muted font-medium mt-2 tabular">
                    {n.author} · {fmt(n.createdAt, 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Attachments */}
          <SectionCard
            icon={Paperclip}
            title="Documents & images"
            count={`${chart.attachments.length} fichier${chart.attachments.length !== 1 ? 's' : ''}`}
            action={canEdit && (
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-primary hover:bg-primary/[0.06] transition-all"
              >
                <Upload size={13} /> Téléverser
              </button>
            )}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            />

            {canEdit && (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                className="mb-4 flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-border-subtle text-text-muted hover:border-primary/40 hover:text-primary cursor-pointer transition-all"
              >
                <ScanLine size={20} strokeWidth={1.5} />
                <p className="text-xs font-medium">Glissez vos scanners / photos cliniques ici, ou cliquez</p>
              </div>
            )}

            {chart.attachments.length === 0 ? (
              <p className="text-sm text-text-muted">Aucun document.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {chart.attachments.map(a => {
                  const isImage = a.mimeType.startsWith('image/');
                  return (
                    <div
                      key={a.id}
                      className="group relative rounded-xl border border-border-subtle bg-bg-soft overflow-hidden"
                    >
                      <button
                        onClick={() => isImage && setPreview(a)}
                        className="block w-full aspect-square bg-white"
                      >
                        {isImage ? (
                          <img src={a.dataUrl} alt={a.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/50 gap-2">
                            <FileText size={26} strokeWidth={1.5} />
                          </div>
                        )}
                      </button>
                      <div className="px-2.5 py-2 flex items-center gap-1.5 border-t border-border-subtle">
                        {a.kind === 'scan' ? <ScanLine size={11} className="text-text-muted/60 shrink-0" />
                          : a.kind === 'photo' ? <ImageIcon size={11} className="text-text-muted/60 shrink-0" />
                          : <FileText size={11} className="text-text-muted/60 shrink-0" />}
                        <span className="text-[11px] font-medium text-text-secondary truncate">{a.name}</span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => removeAttachment(patient.id, a.id)}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/95 text-text-muted hover:text-red-500 shadow-sm transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="xl:sticky xl:top-6">
          <div className="group bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card">
            <div className="flex items-center gap-2.5 mb-1">
              <Stethoscope size={14} className="text-text-muted/50 group-hover:text-primary transition-colors" strokeWidth={1.75} />
              <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-widest">Consultations précédentes</h3>
            </div>
            <p className="text-sm font-medium text-text-secondary mb-5">
              {consultations.length} dossier{consultations.length !== 1 ? 's' : ''}
            </p>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {consultations.length === 0 ? (
                <p className="text-sm text-text-muted">Aucune consultation signée.</p>
              ) : (
                consultations.map(c => {
                  const apt = appointments.find(a => a.id === c.appointmentId);
                  const title = c.soap.assessment.split('\n')[0]?.replace(/^[A-Z0-9.]+\s*—\s*/, '') || 'Consultation';
                  const hasRx = c.ordonnance.items.length > 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => apt && onOpenConsultation?.(apt)}
                      disabled={!apt}
                      className="w-full text-left p-4 rounded-xl border border-border-subtle hover:border-accent hover:bg-bg-soft/50 hover:-translate-y-0.5 transition-all disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:border-border-subtle group/row"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted tabular mb-1.5">
                        <Calendar size={10} strokeWidth={2} />
                        {fmt(c.date, 'd MMMM yyyy')}
                      </div>
                      <p className="text-sm font-medium text-text-primary leading-tight">{title}</p>
                      <div className="mt-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${
                          hasRx
                            ? 'bg-teal-50 border-teal-200 text-teal-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {hasRx ? 'Ordonnance' : 'Sans Rx'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image preview lightbox */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/70 backdrop-blur-sm"
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X size={22} />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={preview.dataUrl}
              alt={preview.name}
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
