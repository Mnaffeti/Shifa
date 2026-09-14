import { useState, useEffect, useRef, ElementType } from 'react';
import {
  ChevronLeft, ChevronRight, AlertTriangle, Plus, Trash2,
  CheckCircle2, FileText, Printer, Pencil, Clock, RotateCcw,
  Activity, Pill, ShieldAlert, Heart, Waves, Thermometer, Eye,
  Scale, Phone, Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, useAppointments } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useChart } from '../context/ChartContext';
import { useConsultations, OrdonnanceItem, Vitals } from '../context/ConsultationContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onNavigate?: (apt: Appointment) => void;
}

const TYPE_FR: Record<string, string> = {
  Consultation: 'Consultation',
  'Follow-up': 'Suivi',
  Surgery: 'Chirurgie',
  Cancelled: 'Annulé',
};

const SEVERITY_LABEL = { mild: 'Légère', moderate: 'Modérée', severe: 'Sévère' };
const SEVERITY_COLOR = {
  mild: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  moderate: 'bg-orange-50 text-orange-800 border-orange-200',
  severe: 'bg-red-100 text-red-800 border-red-200',
};

const TODAY = new Date().toISOString().split('T')[0];
type SoapKey = 'subjectif' | 'objectif' | 'assessment' | 'plan';
type Tab = SoapKey | 'ordonnance';

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

// ─── Initials avatar ──────────────────────────────────────────────────────────

function InitialsAvatar({ name, size = 96 }: { name: string; size?: number }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name.slice(0, 2);
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-primary to-[#0D5C5C] flex items-center justify-center shrink-0 border-4 border-white shadow-xl"
    >
      <span className="text-white font-black uppercase" style={{ fontSize: size * 0.32 }}>
        {initials.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Vital card ───────────────────────────────────────────────────────────────

function VitalCard({
  label, value, unit, icon: Icon, accent, editable, onSave, isText,
}: {
  label: string;
  value?: string | number;
  unit: string;
  icon: ElementType;
  accent: string;
  editable?: boolean;
  onSave?: (val: string) => void;
  isText?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value !== undefined && value !== null && value !== '';

  const startEdit = () => {
    if (!editable) return;
    setDraft(hasValue ? String(value) : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (onSave) onSave(draft.trim());
  };

  return (
    <div
      onClick={!editing ? startEdit : undefined}
      className={`bg-white rounded-2xl border p-3 flex flex-col gap-1.5 shadow-sm transition-all ${
        editable && !editing
          ? 'cursor-pointer border-border-subtle hover:border-primary/30 hover:shadow-md'
          : editing
          ? 'border-primary/40 shadow-md ring-2 ring-primary/10'
          : 'border-border-subtle'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-text-muted/50" />
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      </div>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          placeholder={unit}
          type={isText ? 'text' : 'number'}
          className="w-full text-base font-medium text-primary leading-none bg-transparent border-none outline-none placeholder:text-text-muted/30 placeholder:text-sm"
        />
      ) : hasValue ? (
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-text-primary leading-none">{value}</span>
          <span className="text-[10px] text-text-muted">{unit}</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className={`text-sm leading-none ${editable ? 'text-text-muted/30' : 'text-text-muted/20'}`}>—</span>
          {editable && <span className="text-[10px] text-text-muted/40 ml-1 self-end mb-0.5">Saisir</span>}
        </div>
      )}
    </div>
  );
}

// ─── Patient sidebar ──────────────────────────────────────────────────────────

function PatientSidebar({
  appointment, isDraft, onNavigate, todayApts, currentIndex, allPatientConsultations,
  vitals, onVitalsChange, onUnlock, signedBy, signedAt,
}: {
  appointment: Appointment;
  isDraft: boolean | undefined;
  onNavigate?: (apt: Appointment) => void;
  todayApts: Appointment[];
  currentIndex: number;
  allPatientConsultations: ReturnType<ReturnType<typeof useConsultations>['getPatientConsultations']>;
  vitals: Vitals;
  onVitalsChange: (v: Vitals) => void;
  onUnlock?: () => void;
  signedBy?: string;
  signedAt?: string;
}) {
  const { patients } = usePatients();
  const { getChart } = useChart();
  const patient = patients.find(p => p.id === appointment.patientId);
  const chart = getChart(appointment.patientId);
  const v = vitals;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Hero patient card ── */}
      <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden">
        {/* Colored top band */}
        <div className="bg-gradient-to-r from-primary to-[#0D5C5C] px-6 pt-6 pb-10 relative">
          {/* Modifier button — top left of the band */}
          {!isDraft && onUnlock && (
            <button
              onClick={onUnlock}
              className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-all backdrop-blur-sm"
            >
              <Pencil size={11} />
              Modifier
            </button>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-[24px]" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative flex flex-col items-center text-center">
          <InitialsAvatar name={appointment.patientName} size={88} />
          <h2 className="text-xl font-extrabold text-text-primary mt-3 leading-tight">
            {appointment.patientName}
          </h2>
          <p className="text-sm font-bold text-primary mt-0.5">{appointment.patientId}</p>
          {patient && (
            <p className="text-xs text-text-muted font-medium mt-0.5">
              {new Date().getFullYear() - new Date(patient.dob).getFullYear()} ans
              {patient.bloodType && ` · ${patient.bloodType}`}
              {patient.gender && ` · ${patient.gender === 'Homme' ? 'M' : patient.gender === 'Femme' ? 'F' : patient.gender}`}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <span className="px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold">
              {TYPE_FR[appointment.type] || appointment.type} · {appointment.startTime}
            </span>
            {isDraft !== undefined && (
              <span className="px-3 py-1 rounded-full bg-bg-soft border border-border-subtle text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {isDraft ? 'Brouillon' : 'Signé'}
              </span>
            )}
          </div>

          {/* Contact info */}
          {patient && (
            <div className="w-full mt-4 pt-4 border-t border-border-subtle space-y-2 text-left">
              {patient.phone && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone size={12} className="text-text-muted shrink-0" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Mail size={12} className="text-text-muted shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Vitals cards ── */}
      <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-4">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Activity size={11} />
          Constantes
          {v.date && <span className="font-normal normal-case">· {v.date}</span>}
          {isDraft && <span className="ml-auto text-primary/50 font-bold normal-case text-[9px]">Cliquer pour modifier</span>}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <VitalCard label="PA"     value={v.bp}     unit="mmHg" icon={Heart}      accent="bg-red-50 text-red-400"    editable={isDraft} isText onSave={val => onVitalsChange({ ...v, bp: val || undefined })} />
          <VitalCard label="FC"     value={v.hr}     unit="bpm"  icon={Activity}   accent="bg-blue-50 text-blue-400"  editable={isDraft} onSave={val => onVitalsChange({ ...v, hr: val ? Number(val) : undefined })} />
          <VitalCard label="Poids"  value={v.weight} unit="kg"   icon={Scale}      accent="bg-purple-50 text-purple-400" editable={isDraft} onSave={val => onVitalsChange({ ...v, weight: val ? Number(val) : undefined })} />
          <VitalCard label="Temp"   value={v.temp}   unit="°C"   icon={Thermometer} accent="bg-orange-50 text-orange-400" editable={isDraft} onSave={val => onVitalsChange({ ...v, temp: val ? Number(val) : undefined })} />
          <VitalCard label="SpO2"   value={v.spo2}   unit="%"    icon={Waves}       accent="bg-teal-50 text-teal-400"  editable={isDraft} onSave={val => onVitalsChange({ ...v, spo2: val ? Number(val) : undefined })} />
          <VitalCard label="Taille" value={v.height} unit="cm"   icon={Eye}         accent="bg-green-50 text-green-400" editable={isDraft} onSave={val => onVitalsChange({ ...v, height: val ? Number(val) : undefined })} />
        </div>
      </div>

      {/* ── Allergies ── */}
      {chart.allergies.length > 0 && (
        <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-4">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <ShieldAlert size={11} />
            Allergies
          </p>
          <div className="space-y-2">
            {chart.allergies.map(a => (
              <div key={a.id} className="flex items-start justify-between px-3 py-2 rounded-xl border border-border-subtle bg-bg-soft text-xs">
                <div>
                  <p className="font-medium text-text-primary">{a.substance}</p>
                  <p className="text-text-muted text-[10px] mt-0.5">{a.reaction}</p>
                </div>
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider shrink-0 ml-2">
                  {SEVERITY_LABEL[a.severity]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Traitements ── */}
      {chart.traitements.length > 0 && (
        <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-4">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Pill size={11} />
            Traitements chroniques
          </p>
          <div className="space-y-2">
            {chart.traitements.map(t => (
              <div key={t.id} className="flex items-start justify-between px-3 py-2 bg-bg-soft rounded-xl border border-border-subtle">
                <div>
                  <p className="text-xs font-medium text-text-primary">{t.name} <span className="text-text-muted font-normal">{t.dosage}</span></p>
                  <p className="text-[10px] text-text-muted mt-0.5">{t.frequency}</p>
                </div>
                <span className="text-[10px] text-text-muted shrink-0 ml-2 mt-0.5">dep. {t.since}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's queue ── */}
      {todayApts.length > 1 && (
        <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
            File d'attente · {currentIndex + 1}/{todayApts.length}
          </p>
          <div className="space-y-1.5">
            {todayApts.map((a, i) => (
              <button
                key={a.id}
                onClick={() => onNavigate?.(a)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                  a.id === appointment.id
                    ? 'bg-primary text-white'
                    : 'bg-bg-soft text-text-secondary hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <span className="opacity-50 w-4 text-center shrink-0">{i + 1}</span>
                <span className="truncate flex-1">{a.patientName}</span>
                <span className="opacity-60 shrink-0">{a.startTime}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── History mini list ── */}
      {allPatientConsultations.filter(c => c.status === 'signed').length > 0 && (
        <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Historique</p>
          <div className="space-y-1.5">
            {allPatientConsultations.filter(c => c.status === 'signed').slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-bg-soft rounded-xl">
                <span className="text-xs font-bold text-text-primary">{c.date}</span>
                <span className="text-[10px] text-text-muted">{c.doctor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vitals quick-entry ───────────────────────────────────────────────────────

function VitalsRow({ vitals, onChange }: { vitals: Vitals; onChange: (v: Vitals) => void }) {
  const set = (key: keyof Vitals, val: string) =>
    onChange({ ...vitals, [key]: key === 'bp' ? val : val === '' ? undefined : Number(val) });

  return (
    <div className="grid grid-cols-5 gap-3 p-4 bg-bg-soft rounded-xl border border-border-subtle mb-4">
      {[
        { key: 'bp', label: 'PA (mmHg)', placeholder: '120/80', type: 'text' },
        { key: 'hr', label: 'FC (bpm)', placeholder: '72', type: 'number' },
        { key: 'weight', label: 'Poids (kg)', placeholder: '70', type: 'number' },
        { key: 'temp', label: 'Temp (°C)', placeholder: '37.0', type: 'number' },
        { key: 'spo2', label: 'SpO2 (%)', placeholder: '98', type: 'number' },
      ].map(f => (
        <div key={f.key}>
          <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">{f.label}</label>
          <input
            type={f.type}
            value={(vitals as any)[f.key] ?? ''}
            onChange={e => set(f.key as keyof Vitals, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 rounded-lg border border-border-subtle text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Ordonnance line items ────────────────────────────────────────────────────

function OrdonnanceLine({
  item, onUpdate, onRemove, readOnly,
}: {
  key?: string;
  item: OrdonnanceItem;
  onUpdate: (item: OrdonnanceItem) => void;
  onRemove: () => void;
  readOnly: boolean;
}) {
  if (readOnly) {
    return (
      <div className="flex items-start justify-between p-3 bg-bg-soft rounded-xl border border-border-subtle">
        <div>
          <span className="text-sm font-bold text-text-primary">
            {item.medication}
            <span className="font-normal text-text-secondary ml-2">{item.dosage}</span>
          </span>
          <p className="text-xs text-text-secondary mt-0.5">{item.frequency}</p>
          {item.instructions && <p className="text-[11px] text-text-muted italic mt-0.5">{item.instructions}</p>}
        </div>
        <span className="text-xs text-text-muted shrink-0 ml-4">{item.duration}</span>
      </div>
    );
  }

  const set = (key: keyof OrdonnanceItem, val: string) => onUpdate({ ...item, [key]: val });

  return (
    <div className="p-3 rounded-xl border border-border-subtle bg-white space-y-2">
      <div className="grid grid-cols-[1fr_120px_150px_120px] gap-2">
        <input
          value={item.medication}
          onChange={e => set('medication', e.target.value)}
          placeholder="Médicament"
          className="px-3 py-2 rounded-lg border border-border-subtle text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <input
          value={item.dosage}
          onChange={e => set('dosage', e.target.value)}
          placeholder="Dosage"
          className="px-3 py-2 rounded-lg border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <input
          value={item.frequency}
          onChange={e => set('frequency', e.target.value)}
          placeholder="Fréquence"
          className="px-3 py-2 rounded-lg border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-1">
          <input
            value={item.duration}
            onChange={e => set('duration', e.target.value)}
            placeholder="Durée"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <input
        value={item.instructions ?? ''}
        onChange={e => set('instructions', e.target.value)}
        placeholder="Instructions — ex : pendant les repas, à jeun..."
        className="w-full px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

// ─── Allergy warning ──────────────────────────────────────────────────────────

function AllergyWarning({ items, patientId }: { items: OrdonnanceItem[]; patientId: string }) {
  const { getChart } = useChart();
  const conflicts = getChart(patientId).allergies.filter(a =>
    items.some(i => i.medication.toLowerCase().includes(a.substance.toLowerCase()))
  );
  if (!conflicts.length) return null;
  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-3">
      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
      <div>
        <p className="text-sm font-bold text-red-800">Alerte allergie</p>
        {conflicts.map(a => (
          <p key={a.id} className="text-xs text-red-700 mt-0.5">
            {a.substance} ({SEVERITY_LABEL[a.severity]}) — {a.reaction}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Signed SOAP read-only ────────────────────────────────────────────────────

function SignedSOAP({ soap }: { soap: { subjectif: string; objectif: string; assessment: string; plan: string } }) {
  const sections = [
    { key: 'subjectif',  label: 'S — Subjectif'  },
    { key: 'objectif',   label: 'O — Objectif'   },
    { key: 'assessment', label: 'A — Assessment'  },
    { key: 'plan',       label: 'P — Plan'        },
  ] as const;

  return (
    <div className="space-y-3">
      {sections.map(s => (
        <div key={s.key} className="p-4 rounded-xl border border-border-subtle bg-bg-soft">
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2">{s.label}</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
            {(soap as any)[s.key] || <span className="italic text-text-muted/50">Non renseigné</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Print ────────────────────────────────────────────────────────────────────

function printOrdonnance(
  user: { name?: string; specialty?: string; email?: string } | null,
  appointment: Appointment,
  items: OrdonnanceItem[],
  patientDob?: string,
) {
  const win = window.open('', '_blank');
  if (!win) return;
  const rows = items.map((item, i) => `
    <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <strong style="font-size:15px;">${i + 1}. ${item.medication} — ${item.dosage}</strong>
        <span style="font-size:13px;color:#6b7280;">${item.duration}</span>
      </div>
      <div style="font-size:13px;color:#374151;margin-top:3px;">${item.frequency}</div>
      ${item.instructions ? `<div style="font-size:12px;color:#9ca3af;font-style:italic;margin-top:2px;">${item.instructions}</div>` : ''}
    </div>`).join('');

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Ordonnance – ${appointment.patientName}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;padding:48px;color:#111827;}
    .hdr{display:flex;justify-content:space-between;border-bottom:2.5px solid #1A9E9E;padding-bottom:20px;margin-bottom:28px;}
    .dn{font-size:22px;font-weight:bold;color:#1A6B5A;margin-bottom:4px;}.sub{font-size:13px;color:#6b7280;line-height:1.7;}
    .pb{background:#f4f9f8;border-left:4px solid #1A9E9E;padding:12px 18px;margin-bottom:28px;border-radius:0 8px 8px 0;}
    .pb p{font-size:14px;line-height:1.8;}.rx{font-size:52px;font-weight:900;color:#1A9E9E;opacity:.2;line-height:1;margin-bottom:12px;}
    .footer{margin-top:64px;display:flex;justify-content:flex-end;}
    .sl{width:220px;border-top:1.5px solid #333;margin-bottom:8px;}@media print{body{padding:24px;}}</style></head><body>
    <div class="hdr"><div><div class="dn">${user?.name ?? 'Dr.'}</div>
      <div class="sub">${user?.specialty ?? 'Médecin Spécialiste'}<br/>ShifaPlus Medical Center</div></div>
      <div class="sub" style="text-align:right;">Date : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}<br/>${user?.email ?? ''}</div></div>
    <div class="pb">
      <p><strong>Patient :</strong> ${appointment.patientName}</p>
      <p><strong>ID :</strong> ${appointment.patientId}</p>
      ${patientDob ? `<p><strong>Né(e) le :</strong> ${patientDob}</p>` : ''}
    </div>
    <div class="rx">℞</div>${rows || '<p style="color:#9ca3af;font-style:italic;">Aucun médicament prescrit.</p>'}
    <div class="footer"><div style="text-align:center;"><div class="sl"></div>
      <div style="font-size:14px;font-weight:bold;">${user?.name ?? 'Dr.'}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:3px;">Signature &amp; Cachet</div></div></div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PatientDetailOverlay({ appointment, onClose, onNavigate }: Props) {
  const { patients } = usePatients();
  const { appointments, markAsCompleted } = useAppointments();
  const { user } = useAuth();
  const { getChart, updateVitals } = useChart();
  const {
    consultations,
    getOrCreateDraft,
    updateSoap,
    updateOrdonnance,
    updateConstantes,
    signConsultation,
    unlockConsultation,
    addAddendum,
    getPatientConsultations,
    findByAppointment,
  } = useConsultations();

  const [activeTab, setActiveTab] = useState<Tab>('subjectif');
  const [addendumText, setAddendumText] = useState('');
  const [showAddendum, setShowAddendum] = useState(false);

  const patient = patients.find(p => p.id === appointment.patientId);
  const chart = getChart(appointment.patientId);

  const todayApts = appointments
    .filter(a => a.date === TODAY && a.status !== 'Cancelled' && a.status !== 'Completed')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const currentIndex = todayApts.findIndex(a => a.id === appointment.id);
  const prevApt = currentIndex > 0 ? todayApts[currentIndex - 1] : null;
  const nextApt = currentIndex < todayApts.length - 1 ? todayApts[currentIndex + 1] : null;

  const draftInitRef = useRef(false);
  useEffect(() => {
    if (!draftInitRef.current) {
      draftInitRef.current = true;
      getOrCreateDraft(appointment.id, appointment.patientId, user?.name ?? '', appointment.date);
    }
  }, [appointment.id]);

  const consultation = findByAppointment(appointment.id);
  const isDraft = consultation?.status === 'draft';

  const allPatientConsultations = getPatientConsultations(appointment.patientId);
  const lastSignedWithRx = allPatientConsultations.find(
    c => c.status === 'signed' && c.ordonnance.items.length > 0 && c.id !== consultation?.id
  );

  const vitals: Vitals = consultation?.constantes ?? { date: TODAY, ...(chart.dernieresConstantes ?? {}) };

  const handleVitalsChange = (v: Vitals) => {
    if (!consultation) return;
    updateConstantes(consultation.id, { ...v, date: TODAY });
  };

  const handleOrdonnanceUpdate = (item: OrdonnanceItem) => {
    if (!consultation) return;
    updateOrdonnance(consultation.id, consultation.ordonnance.items.map(i => i.id === item.id ? item : i));
  };

  const handleAddItem = () => {
    if (!consultation) return;
    updateOrdonnance(consultation.id, [
      ...consultation.ordonnance.items,
      { id: uid(), medication: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (!consultation) return;
    updateOrdonnance(consultation.id, consultation.ordonnance.items.filter(i => i.id !== id));
  };

  const handleRenouveler = () => {
    if (!consultation || !lastSignedWithRx) return;
    updateOrdonnance(consultation.id, lastSignedWithRx.ordonnance.items.map(i => ({ ...i, id: uid() })));
    setActiveTab('ordonnance');
  };

  const handleSign = () => {
    if (!consultation) return;
    signConsultation(consultation.id, user?.name ?? '');
    if (consultation.constantes) updateVitals(appointment.patientId, consultation.constantes);
    markAsCompleted(appointment.id);
    if (nextApt && onNavigate) onNavigate(nextApt);
    // else: stay open in read-only mode so doctor can review what was signed
  };

  const handleAddAddendum = () => {
    if (!consultation || !addendumText.trim()) return;
    addAddendum(consultation.id, addendumText.trim(), user?.name ?? '');
    setAddendumText('');
    setShowAddendum(false);
  };

  const ALL_TABS = [
    { key: 'subjectif'  as Tab, short: 'S', label: 'Subjectif' },
    { key: 'objectif'   as Tab, short: 'O', label: 'Objectif' },
    { key: 'assessment' as Tab, short: 'A', label: 'Assessment' },
    { key: 'plan'       as Tab, short: 'P', label: 'Plan' },
    { key: 'ordonnance' as Tab, short: 'Rx', label: 'Ordonnance' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[200] bg-[#F8FAF9] overflow-y-auto"
    >
      <div className="max-w-[1400px] mx-auto px-8 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="flex items-center gap-2 text-primary font-bold hover:underline">
            <ChevronLeft size={20} />
            Retour
          </button>
          <div className="flex items-center gap-3">
            {todayApts.length > 0 && (
              <span className="text-sm font-medium text-text-muted">
                Patient {currentIndex + 1} / {todayApts.length}
              </span>
            )}
            <button
              onClick={() => prevApt && onNavigate?.(prevApt)}
              disabled={!prevApt}
              title={prevApt?.patientName}
              className="p-2 rounded-full border border-border-subtle bg-white hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => nextApt && onNavigate?.(nextApt)}
              disabled={!nextApt}
              title={nextApt?.patientName}
              className="p-2 rounded-full border border-border-subtle bg-white hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-[340px_1fr] gap-6 items-start">

          {/* Left sidebar */}
          <div className="sticky top-8">
            <PatientSidebar
              appointment={appointment}
              isDraft={isDraft}
              onNavigate={onNavigate}
              todayApts={todayApts}
              currentIndex={currentIndex}
              allPatientConsultations={allPatientConsultations}
              vitals={vitals}
              onVitalsChange={handleVitalsChange}
              onUnlock={consultation ? () => unlockConsultation(consultation.id) : undefined}
              signedBy={consultation?.signedBy}
              signedAt={consultation?.signedAt}
            />
          </div>

          {/* Right — consultation workspace */}
          <div className="flex flex-col gap-4">
            {!consultation && (
              <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-12 text-center">
                <p className="text-text-muted font-medium">Chargement...</p>
              </div>
            )}

            {consultation && (
              <>
                {/* Tab workspace */}
                <div className="bg-white rounded-[24px] shadow-card border border-border-subtle overflow-hidden">
                  <div className="flex border-b border-border-subtle">
                    {ALL_TABS.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                          activeTab === tab.key ? 'text-primary' : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden font-black">{tab.short}</span>
                        {activeTab === tab.key && (
                          <motion.div layoutId="consultTab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
                        )}
                        {tab.key === 'ordonnance' && consultation.ordonnance.items.length > 0 && (
                          <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black">
                            {consultation.ordonnance.items.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* SOAP tabs */}
                        {activeTab !== 'ordonnance' && (
                          <>
                            {activeTab === 'objectif' && isDraft && (
                              <VitalsRow vitals={vitals} onChange={handleVitalsChange} />
                            )}
                            {activeTab === 'objectif' && !isDraft && consultation.constantes && (
                              <div className="flex flex-wrap gap-4 p-4 bg-bg-soft rounded-xl border border-border-subtle mb-4">
                                {consultation.constantes.bp     && <span className="text-xs"><span className="text-text-muted">PA </span><strong>{consultation.constantes.bp} mmHg</strong></span>}
                                {consultation.constantes.hr     && <span className="text-xs"><span className="text-text-muted">FC </span><strong>{consultation.constantes.hr} bpm</strong></span>}
                                {consultation.constantes.weight && <span className="text-xs"><span className="text-text-muted">Poids </span><strong>{consultation.constantes.weight} kg</strong></span>}
                                {consultation.constantes.temp   && <span className="text-xs"><span className="text-text-muted">Temp </span><strong>{consultation.constantes.temp}°C</strong></span>}
                                {consultation.constantes.spo2   && <span className="text-xs"><span className="text-text-muted">SpO2 </span><strong>{consultation.constantes.spo2}%</strong></span>}
                              </div>
                            )}
                            {isDraft ? (
                              <textarea
                                value={consultation.soap[activeTab as SoapKey]}
                                onChange={e => updateSoap(consultation.id, activeTab as SoapKey, e.target.value)}
                                placeholder={
                                  activeTab === 'subjectif'  ? 'Motif de consultation, plainte principale, histoire de la maladie...' :
                                  activeTab === 'objectif'   ? 'Examen clinique, résultats des examens complémentaires...' :
                                  activeTab === 'assessment' ? 'Diagnostics (codes CIM-10 recommandés, ex : I10 — HTA)...' :
                                  'Plan thérapeutique, prescriptions, suivi prévu, éducation patient...'
                                }
                                className="w-full min-h-[260px] resize-none focus:outline-none font-mono text-sm text-text-primary placeholder:text-text-muted leading-relaxed"
                              />
                            ) : (
                              <SignedSOAP soap={consultation.soap} />
                            )}
                          </>
                        )}

                        {/* Ordonnance tab */}
                        {activeTab === 'ordonnance' && (
                          <div className="space-y-3">
                            <AllergyWarning items={consultation.ordonnance.items} patientId={appointment.patientId} />

                            {isDraft && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={handleAddItem}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-primary text-white text-xs font-bold hover:opacity-90 transition-all"
                                >
                                  <Plus size={13} />
                                  Ajouter
                                </button>
                                {lastSignedWithRx && (
                                  <button
                                    onClick={handleRenouveler}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-bg-soft text-text-secondary text-xs font-bold border border-border-subtle hover:border-primary/40 hover:text-primary transition-all"
                                  >
                                    <RotateCcw size={13} />
                                    Renouveler ({lastSignedWithRx.date})
                                  </button>
                                )}
                                {consultation.ordonnance.items.length > 0 && (
                                  <button
                                    onClick={() => printOrdonnance(user, appointment, consultation.ordonnance.items, patient?.dob)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-bg-soft text-text-secondary text-xs font-bold border border-border-subtle hover:border-primary/40 hover:text-primary transition-all ml-auto"
                                  >
                                    <Printer size={13} />
                                    Imprimer
                                  </button>
                                )}
                              </div>
                            )}

                            {!isDraft && consultation.ordonnance.items.length > 0 && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => printOrdonnance(user, appointment, consultation.ordonnance.items, patient?.dob)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-bg-soft text-xs font-bold border border-border-subtle hover:text-primary transition-all"
                                >
                                  <Printer size={13} />
                                  Imprimer
                                </button>
                              </div>
                            )}

                            {isDraft && consultation.ordonnance.items.length > 0 && (
                              <div className="grid grid-cols-[1fr_120px_150px_120px] gap-2 px-3">
                                {['Médicament', 'Dosage', 'Fréquence', 'Durée'].map(h => (
                                  <span key={h} className="text-[10px] font-black text-text-muted uppercase tracking-wider">{h}</span>
                                ))}
                              </div>
                            )}

                            {consultation.ordonnance.items.length === 0 ? (
                              <div className="text-center py-12 text-text-muted">
                                <FileText size={36} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Aucun médicament prescrit</p>
                                {isDraft && lastSignedWithRx && (
                                  <p className="text-xs mt-1 opacity-60">Utilisez "Renouveler" pour reprendre la dernière ordonnance</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {consultation.ordonnance.items.map(item => (
                                  <OrdonnanceLine
                                    key={item.id}
                                    item={item}
                                    onUpdate={handleOrdonnanceUpdate}
                                    onRemove={() => handleRemoveItem(item.id)}
                                    readOnly={!isDraft}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Addenda (signed only) */}
                {!isDraft && (
                  <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Pencil size={15} className="text-text-muted" />
                        <h3 className="text-sm font-bold text-text-primary">Addenda</h3>
                      </div>
                      {!showAddendum && (
                        <button onClick={() => setShowAddendum(true)} className="text-xs font-bold text-primary hover:underline">
                          + Ajouter
                        </button>
                      )}
                    </div>
                    {consultation.addenda.length === 0 && !showAddendum && (
                      <p className="text-xs text-text-muted">Aucun addendum.</p>
                    )}
                    {consultation.addenda.map((ad, i) => (
                      <div key={i} className="mb-3 p-3 bg-bg-soft rounded-xl border border-border-subtle">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={11} className="text-text-muted" />
                          <span className="text-[10px] text-text-muted">
                            {ad.addedBy} · {format(new Date(ad.addedAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{ad.text}</p>
                      </div>
                    ))}
                    {showAddendum && (
                      <div className="space-y-2">
                        <textarea
                          value={addendumText}
                          onChange={e => setAddendumText(e.target.value)}
                          placeholder="Correction ou précision à apporter..."
                          className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm font-medium"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowAddendum(false); setAddendumText(''); }}
                            className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm font-bold text-text-secondary hover:bg-bg-soft transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleAddAddendum}
                            disabled={!addendumText.trim()}
                            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sign bar (draft only) */}
                {isDraft && (
                  <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-5 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">Signer la consultation</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Une fois signé, le dossier est verrouillé. Seuls des addenda sont possibles.
                      </p>
                    </div>
                    <button
                      onClick={handleSign}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-pill shadow-lg hover:opacity-90 transition-all active:scale-95 shrink-0"
                    >
                      <CheckCircle2 size={18} />
                      {nextApt ? `Signer → ${nextApt.patientName}` : 'Signer & Clôturer'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
