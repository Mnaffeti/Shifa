import { useRef, useState, type ReactNode } from 'react';
import {
  ChevronLeft, Plus, X, Trash2, Calendar, Stethoscope,
  AlertTriangle, Activity, Heart, Scale, Thermometer, Waves, Ruler,
  Pill, ClipboardList, StickyNote, Paperclip, Upload, FileText,
  ScanLine, Image as ImageIcon, Users, Pencil, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useChart, Attachment } from '../context/ChartContext';
import { useConsultations } from '../context/ConsultationContext';
import { useAppointments, Appointment } from '../context/AppointmentContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import VitalCards from './VitalCards';

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
    <div className="group bg-white rounded-[28px] border border-border-subtle/70 p-6 transition-all duration-300 hover:shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center shrink-0">
            <Icon size={15} className="text-primary/70" strokeWidth={2} />
          </span>
          <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">{title}</h3>
        </div>
        {action}
      </div>
      {count && <p className="text-sm font-medium text-text-secondary -mt-2 mb-4">{count}</p>}
      {children}
    </div>
  );
}

// ─── Ring meter (consultations completed) ───────────────────────────────────

function RingMeter({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const R = 34;
  const C = 2 * Math.PI * R;
  const dash = C * pct;

  return (
    <div className="relative w-[92px] h-[92px] shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={R} fill="none" stroke="var(--color-border-subtle)" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={R} fill="none"
          stroke="var(--color-success)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-text-primary leading-none tabular">{done}</span>
        <span className="text-[10px] font-medium text-text-muted">/ {total}</span>
      </div>
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
    getChart, updateVitals, addProbleme, removeProbleme, addTraitement, removeTraitement,
    addAlerte, removeAlerte, addNote, removeNote, addAttachment, removeAttachment,
  } = useChart();
  const { getPatientConsultations } = useConsultations();
  const { appointments } = useAppointments();
  const { updatePatient } = usePatients();

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

  // Parent / guardian inline editor
  const [editingParent, setEditingParent] = useState(false);
  const [parentDraft, setParentDraft] = useState({
    parentFirstName: patient.parentFirstName ?? '',
    parentLastName: patient.parentLastName ?? '',
    parentComments: patient.parentComments ?? '',
  });

  const openParentEditor = () => {
    setParentDraft({
      parentFirstName: patient.parentFirstName ?? '',
      parentLastName: patient.parentLastName ?? '',
      parentComments: patient.parentComments ?? '',
    });
    setEditingParent(true);
  };

  const saveParent = () => {
    updatePatient(patient.id, {
      parentFirstName: parentDraft.parentFirstName.trim(),
      parentLastName: parentDraft.parentLastName.trim(),
      parentComments: parentDraft.parentComments.trim(),
    });
    setEditingParent(false);
  };

  const hasParent = !!(patient.parentFirstName || patient.parentLastName || patient.parentComments);

  // Identity inline editor
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identityDraft, setIdentityDraft] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    dob: patient.dob,
    gender: patient.gender,
    cin: patient.cin ?? '',
    profession: patient.profession ?? '',
    bloodType: patient.bloodType ?? '',
    phone: patient.phone ?? '',
  });

  const openIdentityEditor = () => {
    setIdentityDraft({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: patient.dob,
      gender: patient.gender,
      cin: patient.cin ?? '',
      profession: patient.profession ?? '',
      bloodType: patient.bloodType ?? '',
      phone: patient.phone ?? '',
    });
    setEditingIdentity(true);
  };

  const saveIdentity = () => {
    updatePatient(patient.id, {
      firstName: identityDraft.firstName.trim(),
      lastName: identityDraft.lastName.trim(),
      dob: identityDraft.dob,
      gender: identityDraft.gender,
      cin: identityDraft.cin.trim(),
      profession: identityDraft.profession.trim(),
      bloodType: identityDraft.bloodType.trim(),
      phone: identityDraft.phone.trim(),
    });
    setEditingIdentity(false);
  };

  // Vitals inline editor
  const [editingVitals, setEditingVitals] = useState(false);
  const [vitalsDraft, setVitalsDraft] = useState({
    bp: '', hr: '', temp: '', spo2: '', weight: '', height: '',
  });

  const openVitalsEditor = () => {
    const cur = chart.dernieresConstantes;
    setVitalsDraft({
      bp: cur?.bp ?? '',
      hr: cur?.hr?.toString() ?? '',
      temp: cur?.temp?.toString() ?? '',
      spo2: cur?.spo2?.toString() ?? '',
      weight: cur?.weight?.toString() ?? '',
      height: cur?.height?.toString() ?? '',
    });
    setEditingVitals(true);
  };

  const saveVitals = () => {
    const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
    updateVitals(patient.id, {
      date: new Date().toISOString().split('T')[0],
      bp: vitalsDraft.bp.trim() || undefined,
      hr: num(vitalsDraft.hr),
      temp: num(vitalsDraft.temp),
      spo2: num(vitalsDraft.spo2),
      weight: num(vitalsDraft.weight),
      height: num(vitalsDraft.height),
    });
    setEditingVitals(false);
  };

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

  // Consultations completed for this patient (drives the ring meter).
  const patientApts = appointments.filter(a => a.patientId === patient.id && a.status !== 'Cancelled');
  const patientDone = patientApts.filter(a => a.status === 'Completed').length;

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
          <div className="group relative bg-white rounded-[28px] border border-border-subtle/70 p-6">
            {editingIdentity ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    autoFocus
                    value={identityDraft.firstName}
                    onChange={e => setIdentityDraft(d => ({ ...d, firstName: e.target.value }))}
                    placeholder="Prénom"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={identityDraft.lastName}
                    onChange={e => setIdentityDraft(d => ({ ...d, lastName: e.target.value }))}
                    placeholder="Nom"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Naissance</span>
                    <input
                      type="date"
                      value={identityDraft.dob}
                      onChange={e => setIdentityDraft(d => ({ ...d, dob: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Genre</span>
                    <select
                      value={identityDraft.gender}
                      onChange={e => setIdentityDraft(d => ({ ...d, gender: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option>Homme</option>
                      <option>Femme</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={identityDraft.cin}
                    onChange={e => setIdentityDraft(d => ({ ...d, cin: e.target.value }))}
                    placeholder="CIN"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={identityDraft.bloodType}
                    onChange={e => setIdentityDraft(d => ({ ...d, bloodType: e.target.value }))}
                    placeholder="Groupe sanguin"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <input
                  value={identityDraft.profession}
                  onChange={e => setIdentityDraft(d => ({ ...d, profession: e.target.value }))}
                  placeholder="Profession"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  value={identityDraft.phone}
                  onChange={e => setIdentityDraft(d => ({ ...d, phone: e.target.value }))}
                  placeholder="Téléphone"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={saveIdentity}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all"
                  >
                    <Check size={15} /> Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingIdentity(false)}
                    className="p-2 rounded-xl border border-border-subtle text-text-muted hover:bg-bg-soft transition-all shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={openIdentityEditor}
                    title="Modifier les informations"
                    className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full bg-bg-soft text-text-muted hover:text-primary transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                )}

                {/* Avatar + name, centered like the reference */}
                <div className="flex flex-col items-center text-center pt-1">
                  <div className="w-[86px] h-[86px] rounded-full overflow-hidden border-4 border-white shadow-md ring-1 ring-border-subtle">
                    <img src={patient.avatar} alt={patient.firstName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-text-primary leading-tight tracking-tight">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-sm font-medium text-text-muted mt-0.5">
                    {calcAge(patient.dob)} ans · {patient.gender}
                  </p>
                </div>

                {/* Blood / Height / Weight tiles (reference layout) */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    ['Groupe', patient.bloodType || '—', ''],
                    ['Taille', v?.height != null ? `${v.height}` : '—', v?.height != null ? 'cm' : ''],
                    ['Poids', v?.weight != null ? `${v.weight}` : '—', v?.weight != null ? 'kg' : ''],
                  ].map(([label, val, unit]) => (
                    <div key={label} className="bg-bg-soft rounded-2xl py-3 px-2 text-center">
                      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-lg font-semibold text-text-primary leading-none tabular">
                        {val}
                        {unit && <span className="text-[11px] text-text-muted font-medium ml-0.5">{unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Remaining identity details */}
                <div className="mt-5 pt-5 border-t border-border-subtle/70 space-y-3">
                  {[
                    ['CIN', patient.cin || '—'],
                    ['Profession', patient.profession || '—'],
                    ['Téléphone', patient.phone || '—'],
                    ['Identifiant', patient.id],
                  ].map(([k, val]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-text-muted font-medium">{k}</span>
                      <span className="text-text-primary font-medium text-right tabular">{val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Suivi des consultations — completed ring */}
          <div className="bg-white rounded-[28px] border border-border-subtle/70 p-6 flex items-center gap-5">
            <RingMeter done={patientDone} total={patientApts.length} />
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">Suivi des consultations</h3>
              <p className="text-sm text-text-muted mt-1">
                {patientApts.length > 0
                  ? `${patientDone} consultation${patientDone !== 1 ? 's' : ''} terminée${patientDone !== 1 ? 's' : ''} sur ${patientApts.length}`
                  : 'Aucune consultation planifiée'}
              </p>
              {patientApts.length - patientDone > 0 && (
                <p className="text-[13px] font-medium text-primary mt-1.5 tabular">
                  {patientApts.length - patientDone} à venir
                </p>
              )}
            </div>
          </div>

          {/* Parent / Tuteur */}
          <SectionCard
            icon={Users}
            title="Parent / Tuteur"
            action={canEdit && !editingParent && (
              <button
                onClick={openParentEditor}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-border-subtle text-text-muted hover:text-primary hover:border-primary/40 transition-all"
                title={hasParent ? 'Modifier' : 'Ajouter un parent / tuteur'}
              >
                {hasParent ? <Pencil size={13} /> : <Plus size={14} />}
              </button>
            )}
          >
            {editingParent ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    autoFocus
                    value={parentDraft.parentFirstName}
                    onChange={e => setParentDraft(d => ({ ...d, parentFirstName: e.target.value }))}
                    placeholder="Prénom"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={parentDraft.parentLastName}
                    onChange={e => setParentDraft(d => ({ ...d, parentLastName: e.target.value }))}
                    placeholder="Nom"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <textarea
                  value={parentDraft.parentComments}
                  onChange={e => setParentDraft(d => ({ ...d, parentComments: e.target.value }))}
                  placeholder="Commentaires (lien de parenté, contact, remarques...)"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveParent}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all"
                  >
                    <Check size={15} /> Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingParent(false)}
                    className="p-2 rounded-xl border border-border-subtle text-text-muted hover:bg-bg-soft transition-all shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : hasParent ? (
              <div className="space-y-2">
                {(patient.parentFirstName || patient.parentLastName) && (
                  <p className="text-sm font-medium text-text-primary">
                    {[patient.parentFirstName, patient.parentLastName].filter(Boolean).join(' ')}
                  </p>
                )}
                {patient.parentComments && (
                  <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {patient.parentComments}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-muted">Aucun parent / tuteur.</p>
            )}
          </SectionCard>

          {/* Antécédents */}
          <SectionCard
            icon={AlertTriangle}
            title="Antécédents"
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
                <p className="text-xs text-text-muted">Aucun antécédent.</p>
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
                  placeholder="Nouvel antécédent..."
                  onAdd={label => { addAlerte(patient.id, label); }}
                  onCancel={() => setAddingAlert(false)}
                />
              )}
            </div>
          </SectionCard>

          {/* Latest vitals */}
          <SectionCard
            icon={Activity}
            title="Dernières constantes"
            action={canEdit && !editingVitals && (
              <button
                onClick={openVitalsEditor}
                title="Modifier les constantes"
                className="w-7 h-7 flex items-center justify-center rounded-full border border-border-subtle text-text-muted hover:text-primary hover:border-primary/40 transition-all"
              >
                <Pencil size={13} />
              </button>
            )}
          >
            {editingVitals ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    ['Tension', 'bp', 'mmHg', 'text', '138/88'],
                    ['Fréq. card.', 'hr', 'bpm', 'number', '76'],
                    ['Température', 'temp', '°C', 'number', '37.0'],
                    ['SpO₂', 'spo2', '%', 'number', '98'],
                    ['Poids', 'weight', 'kg', 'number', '70'],
                    ['Taille', 'height', 'cm', 'number', '175'],
                  ] as const).map(([label, key, unit, type, ph]) => (
                    <label key={key} className="flex flex-col gap-1 bg-bg-soft rounded-xl p-3 border border-border-subtle">
                      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label} <span className="normal-case">({unit})</span></span>
                      <input
                        type={type}
                        step={type === 'number' ? 'any' : undefined}
                        value={vitalsDraft[key]}
                        onChange={e => setVitalsDraft(d => ({ ...d, [key]: e.target.value }))}
                        placeholder={ph}
                        className="w-full bg-transparent text-lg font-medium text-text-primary tabular focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveVitals}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all"
                  >
                    <Check size={15} /> Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingVitals(false)}
                    className="p-2 rounded-xl border border-border-subtle text-text-muted hover:bg-bg-soft transition-all shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {v?.date && (
                  <p className="text-[11px] text-text-muted -mt-2 mb-3 tabular">Saisies le {fmt(v.date)}</p>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  {VITALS.map(vit => (
                    <div key={vit.label} className="bg-bg-soft rounded-2xl p-3">
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
              </>
            )}
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
        <div className="flex flex-col gap-5 xl:sticky xl:top-6">
          <div className="group bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card">
            <div className="flex items-center gap-2.5 mb-1">
              <Stethoscope size={14} className="text-text-muted/50 group-hover:text-primary transition-colors" strokeWidth={1.75} />
              <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-widest">Consultations précédentes</h3>
            </div>
            <p className="text-sm font-medium text-text-secondary mb-5">
              {consultations.length} dossier{consultations.length !== 1 ? 's' : ''}
            </p>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 [scrollbar-width:thin]">
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

          {/* Daily updates — highlighted vitals with mini charts */}
          <VitalCards hr={v?.hr} spo2={v?.spo2} />
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
