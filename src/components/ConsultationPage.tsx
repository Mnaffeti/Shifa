import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronLeft, ChevronRight, X, Plus, Trash2, Check, CheckCircle2,
  ClipboardList, Stethoscope, ScrollText, Pill, FileText, Save,
  Phone, AlertTriangle, Activity, Heart, Thermometer, Waves, Scale, Ruler,
  ShieldAlert, Pencil, Clock, Link2, CircleDot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, useAppointments } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useChart, Vitals } from '../context/ChartContext';
import { useConsultations, OrdonnanceItem } from '../context/ConsultationContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onNavigate?: (apt: Appointment) => void;
}

const TODAY = new Date().toISOString().split('T')[0];

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const t = new Date();
  let age = t.getFullYear() - birth.getFullYear();
  const m = t.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < birth.getDate())) age--;
  return age;
}

function fmtDate(iso: string, pattern = 'd MMMM yyyy'): string {
  try { return format(parseISO(iso), pattern, { locale: fr }); }
  catch { try { return format(new Date(iso), pattern, { locale: fr }); } catch { return iso; } }
}

// Some common diagnosis suggestions for the typeahead
const DIAGNOSIS_SUGGESTIONS = [
  'Hypertension artérielle', 'Diabète de type 2', 'Pharyngite aiguë', 'Bronchite aiguë',
  'Infection respiratoire haute', 'Céphalées', 'Lombalgie', 'Gastro-entérite',
  'Rhinopharyngite', 'Anxiété généralisée', 'Asthme', 'Reflux gastro-œsophagien',
];

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

// ─── Initials avatar ──────────────────────────────────────────────────────────

function InitialsAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-primary to-[#0D5C5C] flex items-center justify-center shrink-0"
    >
      <span className="text-white font-bold uppercase" style={{ fontSize: size * 0.34 }}>
        {initials.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Section header (numbered) ──────────────────────────────────────────────

function SectionHeader({
  n, icon: Icon, title, subtitle, badge,
}: { n: number; icon: any; title: string; subtitle: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="relative w-9 h-9 rounded-xl bg-bg-soft border border-border-subtle flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-accent/15 group-hover:border-accent group-hover:rotate-3">
        <Icon size={16} className="text-text-muted/70 group-hover:text-primary transition-colors" strokeWidth={1.75} />
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-medium tabular transition-colors group-hover:bg-text-primary">
          {n}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-text-primary leading-tight tracking-tight">{title}</h3>
        <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
      </div>
      {badge}
    </div>
  );
}

// ─── Vital pill (left sidebar) ──────────────────────────────────────────────

function VitalPill({
  label, value, unit, icon: Icon, warn,
}: { label: string; value?: string | number; unit: string; icon: any; warn?: boolean }) {
  const has = value !== undefined && value !== null && value !== '';
  return (
    <div className={`bg-bg-soft rounded-xl border p-3 ${warn ? 'border-red-300' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} className="text-text-muted/50" strokeWidth={1.75} />
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      {has ? (
        <p className={`text-base font-medium leading-none tabular ${warn ? 'text-red-600' : 'text-text-primary'}`}>
          {value}<span className="text-[10px] text-text-muted font-medium ml-1">{unit}</span>
        </p>
      ) : (
        <p className="text-base font-medium text-text-muted/30 leading-none">—</p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ConsultationPage({ appointment, onClose, onNavigate }: Props) {
  const { patients } = usePatients();
  const { appointments, markAsCompleted } = useAppointments();
  const { user } = useAuth();
  const { getChart, updateVitals, addProbleme, addTraitement } = useChart();
  const {
    getOrCreateDraft, updateSoap, updateDiagnoses, updateOrdonnance, updateConstantes,
    signConsultation, getPatientConsultations, findByAppointment,
  } = useConsultations();

  const patient = patients.find(p => p.id === appointment.patientId);
  const chart = getChart(appointment.patientId);

  // queue / navigation
  const todayApts = appointments
    .filter(a => a.date === TODAY && a.status !== 'Cancelled' && a.status !== 'Completed')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const currentIndex = todayApts.findIndex(a => a.id === appointment.id);
  const prevApt = currentIndex > 0 ? todayApts[currentIndex - 1] : null;
  const nextApt = currentIndex >= 0 && currentIndex < todayApts.length - 1 ? todayApts[currentIndex + 1] : null;

  // ensure a draft exists
  const draftInitRef = useRef(false);
  useEffect(() => {
    draftInitRef.current = false;
  }, [appointment.id]);
  useEffect(() => {
    if (!draftInitRef.current) {
      draftInitRef.current = true;
      getOrCreateDraft(appointment.id, appointment.patientId, user?.name ?? '', appointment.date);
    }
  }, [appointment.id]);

  const consultation = findByAppointment(appointment.id);
  const isDraft = consultation?.status === 'draft';
  const readOnly = !isDraft;

  const historyConsults = getPatientConsultations(appointment.patientId)
    .filter(c => c.status === 'signed' && c.id !== consultation?.id);

  // vitals editing
  const [editingVitals, setEditingVitals] = useState(false);
  const vitals: Vitals = consultation?.constantes ?? { date: TODAY, ...(chart.dernieresConstantes ?? {}) };

  // diagnosis typeahead
  const [dxQuery, setDxQuery] = useState('');
  const [dxFocused, setDxFocused] = useState(false);

  // saved indicator
  const [savedPulse, setSavedPulse] = useState(false);
  const pulse = () => { setSavedPulse(true); setTimeout(() => setSavedPulse(false), 1500); };

  if (!consultation) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-[#F8FAF9] flex items-center justify-center"
      >
        <p className="text-text-muted font-medium">Chargement de la consultation...</p>
      </motion.div>
    );
  }

  const c = consultation;

  // ── handlers ──
  const setReason = (v: string) => { updateSoap(c.id, 'subjectif', v); pulse(); };
  const setExam = (v: string) => { updateSoap(c.id, 'objectif', v); pulse(); };

  const addDiagnosis = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || c.diagnoses.includes(trimmed)) return;
    updateDiagnoses(c.id, [...c.diagnoses, trimmed]);
    setDxQuery('');
    pulse();
  };
  const removeDiagnosis = (label: string) => {
    updateDiagnoses(c.id, c.diagnoses.filter(d => d !== label));
    pulse();
  };

  const addMed = () => {
    updateOrdonnance(c.id, [
      ...c.ordonnance.items,
      { id: uid(), medication: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };
  const updateMed = (item: OrdonnanceItem) => {
    updateOrdonnance(c.id, c.ordonnance.items.map(i => i.id === item.id ? item : i));
    pulse();
  };
  const removeMed = (id: string) => {
    updateOrdonnance(c.id, c.ordonnance.items.filter(i => i.id !== id));
    pulse();
  };

  const setVital = (key: keyof Vitals, val: string) => {
    const next: Vitals = { ...vitals, date: TODAY };
    if (key === 'bp') next.bp = val || undefined;
    else (next as any)[key] = val === '' ? undefined : Number(val);
    updateConstantes(c.id, next);
  };

  const handleFinish = () => {
    // sign the consultation; assessment mirrors diagnoses for history/print
    if (c.diagnoses.length && !c.soap.assessment) {
      updateSoap(c.id, 'assessment', c.diagnoses.join('\n'));
    }
    signConsultation(c.id, user?.name ?? '');

    // 1. vitals → chart latest
    if (c.constantes) updateVitals(appointment.patientId, c.constantes);

    // 2. diagnoses → active conditions (dedupe by label)
    const existingLabels = new Set(chart.problemesActifs.map(p => p.label.toLowerCase()));
    c.diagnoses.forEach(d => {
      if (!existingLabels.has(d.toLowerCase())) addProbleme(appointment.patientId, d);
    });

    // 3. prescription → active meds (dedupe by name)
    const existingMeds = new Set(chart.traitements.map(t => t.name.toLowerCase()));
    c.ordonnance.items.filter(i => i.medication.trim()).forEach(i => {
      if (!existingMeds.has(i.medication.toLowerCase())) {
        addTraitement(appointment.patientId, {
          name: i.medication.trim(),
          dosage: i.dosage.trim(),
          frequency: i.frequency.trim(),
          since: new Date().toISOString().slice(0, 7),
        });
      }
    });

    // 4. mark appointment completed (history entry is the signed consultation itself)
    markAsCompleted(appointment.id);

    if (nextApt && onNavigate) onNavigate(nextApt);
    else onClose();
  };

  const v = vitals;
  const dxFiltered = DIAGNOSIS_SUGGESTIONS.filter(
    s => s.toLowerCase().includes(dxQuery.toLowerCase()) && !c.diagnoses.includes(s)
  ).slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] bg-[#F8FAF9] overflow-y-auto"
    >
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1500px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="inline-flex items-center gap-1.5 px-3 py-1.5 -ml-3 rounded-full text-sm font-medium text-text-secondary hover:text-primary hover:bg-bg-soft transition-colors shrink-0">
              <ChevronLeft size={16} strokeWidth={2} />
              Retour
            </button>
            <span className="text-text-muted/30">/</span>
            <span className="text-sm font-medium text-text-primary truncate">{appointment.patientName}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {todayApts.length > 0 && (
              <span className="hidden sm:block text-[11px] font-medium text-text-muted uppercase tracking-widest tabular mr-2">
                Patient {currentIndex + 1} / {todayApts.length}
              </span>
            )}
            <button
              onClick={() => prevApt && onNavigate?.(prevApt)}
              disabled={!prevApt}
              title={prevApt?.patientName}
              className="p-2 rounded-full border border-border-subtle bg-white hover:border-primary/40 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={15} strokeWidth={2} />
            </button>
            <button
              onClick={() => nextApt && onNavigate?.(nextApt)}
              disabled={!nextApt}
              title={nextApt?.patientName}
              className="p-2 rounded-full border border-border-subtle bg-white hover:border-primary/40 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-7">
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_330px] gap-6 items-start">

          {/* ══ LEFT SIDEBAR ══ */}
          <div className="flex flex-col gap-4 xl:sticky xl:top-24">
            {/* Identity */}
            <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-5 hover-card">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={appointment.patientName} size={44} />
                <div className="min-w-0">
                  <h2 className="text-base font-medium text-text-primary leading-tight truncate">{appointment.patientName}</h2>
                  <p className="text-[11px] text-text-muted tabular tracking-wider mt-0.5">{appointment.patientId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-5 pt-5 border-t border-border-subtle">
                {patient && [
                  ['Âge', `${calcAge(patient.dob)} ans`],
                  ['Genre', patient.gender],
                ].map(([k, val]) => (
                  <div key={k}>
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">{k}</p>
                    <p className="text-sm font-medium text-text-primary">{val}</p>
                  </div>
                ))}
                {patient?.bloodType && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">Groupe sanguin</p>
                    <p className="text-sm font-medium text-text-primary">{patient.bloodType}</p>
                  </div>
                )}
                {patient?.phone && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">Téléphone</p>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1.5 tabular">
                      <Phone size={11} className="text-text-muted/60" strokeWidth={1.75} />{patient.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Medical alerts */}
            <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-5 hover-card">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <AlertTriangle size={11} strokeWidth={1.75} /> Antécédents
              </p>
              <div className="space-y-2">
                {chart.allergies.length === 0 && chart.alertes.length === 0 && (
                  <p className="text-xs text-text-muted">Aucun antécédent.</p>
                )}
                {chart.allergies.map(a => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <ShieldAlert size={14} className="text-rose-500 shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium text-rose-800">{a.substance}</span>
                  </div>
                ))}
                {chart.alertes.map(a => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium text-amber-900">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest vitals */}
            <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-5 hover-card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={11} strokeWidth={1.75} /> Constantes
                </p>
                {isDraft && (
                  <button
                    onClick={() => setEditingVitals(e => !e)}
                    className="text-[11px] font-medium text-primary hover:opacity-80 transition-all inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-primary/[0.06]"
                  >
                    {editingVitals ? <Check size={11} strokeWidth={2} /> : <Pencil size={10} strokeWidth={2} />}
                    {editingVitals ? 'OK' : 'Modifier'}
                  </button>
                )}
              </div>
              {v.date && <p className="text-[11px] text-text-muted -mt-1 mb-3 tabular">Saisies le {fmtDate(v.date, 'd MMM yyyy')}</p>}

              {editingVitals ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    ['bp', 'PA', '120/80', 'text'],
                    ['hr', 'FC', '72', 'number'],
                    ['temp', 'Temp', '37.0', 'number'],
                    ['spo2', 'SpO₂', '98', 'number'],
                    ['weight', 'Poids', '70', 'number'],
                    ['height', 'Taille', '170', 'number'],
                  ] as const).map(([key, label, ph, type]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">{label}</label>
                      <input
                        type={type}
                        defaultValue={(v as any)[key] ?? ''}
                        onBlur={e => setVital(key as keyof Vitals, e.target.value)}
                        placeholder={ph}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border-subtle text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <VitalPill label="PA" value={v.bp} unit="mmHg" icon={Heart} warn={!!v.bp && parseInt(v.bp) >= 140} />
                  <VitalPill label="FC" value={v.hr} unit="bpm" icon={Activity} />
                  <VitalPill label="Temp" value={v.temp} unit="°C" icon={Thermometer} />
                  <VitalPill label="SpO₂" value={v.spo2} unit="%" icon={Waves} />
                  <VitalPill label="Poids" value={v.weight} unit="kg" icon={Scale} />
                  <VitalPill label="Taille" value={v.height} unit="cm" icon={Ruler} />
                </div>
              )}
            </div>
          </div>

          {/* ══ MIDDLE — CONSULTATION ══ */}
          <div className="flex flex-col gap-5 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-medium text-text-primary tracking-tight">
                  {readOnly ? 'Consultation' : 'Nouvelle consultation'}
                </h1>
                <p className="text-sm text-text-muted mt-1 tabular">
                  {fmtDate(appointment.date, 'EEEE d MMMM yyyy')} · RDV #{appointment.id}
                </p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-widest ${
                readOnly ? 'bg-bg-soft text-text-secondary border border-border-subtle' : 'bg-primary/[0.08] text-primary border border-primary/20'
              }`}>
                <CircleDot size={10} className={readOnly ? '' : 'animate-pulse'} strokeWidth={2.5} />
                {readOnly ? 'Signée' : 'Active'}
              </span>
            </div>

            {/* 1. Consultation Reason */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
              className="group bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card"
            >
              <SectionHeader n={1} icon={ClipboardList} title="Motif de consultation" subtitle="Pourquoi le patient consulte aujourd'hui ?" />
              <textarea
                value={c.soap.subjectif}
                onChange={e => setReason(e.target.value)}
                readOnly={readOnly}
                placeholder="Plainte principale, symptômes, motif de consultation..."
                className="w-full min-h-[110px] resize-none px-4 py-3 rounded-2xl border border-border-subtle text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 read-only:bg-bg-soft read-only:cursor-default"
              />
            </motion.div>

            {/* 2. Clinical Examination */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="group bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card"
            >
              <SectionHeader n={2} icon={Stethoscope} title="Examen clinique" subtitle="Documenter les observations de l'examen physique" />
              <textarea
                value={c.soap.objectif}
                onChange={e => setExam(e.target.value)}
                readOnly={readOnly}
                placeholder="Observations de l'examen physique, signes cliniques, symptômes..."
                className="w-full min-h-[130px] resize-none px-4 py-3 rounded-2xl border border-border-subtle text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 read-only:bg-bg-soft read-only:cursor-default"
              />
            </motion.div>

            {/* 3. Diagnosis */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="group bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card"
            >
              <SectionHeader n={3} icon={ScrollText} title="Diagnostic" subtitle="Ajouter un ou plusieurs diagnostics" />

              <div className="flex flex-wrap gap-2 mb-3">
                <AnimatePresence>
                  {c.diagnoses.map(d => (
                    <motion.span
                      key={d}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 text-sm font-medium text-primary"
                    >
                      {d}
                      {!readOnly && (
                        <button onClick={() => removeDiagnosis(d)} className="text-primary/50 hover:text-primary transition-colors">
                          <X size={13} />
                        </button>
                      )}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {c.diagnoses.length === 0 && readOnly && (
                  <p className="text-sm text-text-muted">Aucun diagnostic.</p>
                )}
              </div>

              {!readOnly && (
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      value={dxQuery}
                      onChange={e => setDxQuery(e.target.value)}
                      onFocus={() => setDxFocused(true)}
                      onBlur={() => setTimeout(() => setDxFocused(false), 150)}
                      onKeyDown={e => { if (e.key === 'Enter' && dxQuery.trim()) addDiagnosis(dxQuery); }}
                      placeholder="Rechercher ou saisir un diagnostic..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={() => addDiagnosis(dxQuery)}
                      disabled={!dxQuery.trim()}
                      className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
                    >
                      <Plus size={16} /> Ajouter
                    </button>
                  </div>

                  <AnimatePresence>
                    {dxFocused && dxQuery && dxFiltered.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 right-0 mt-2 bg-white border border-border-subtle rounded-2xl shadow-lg z-20 overflow-hidden"
                      >
                        {dxFiltered.map(s => (
                          <button
                            key={s}
                            onMouseDown={() => addDiagnosis(s)}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-soft hover:text-primary transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* 4. Prescription */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
              className="group bg-white rounded-[20px] shadow-card border border-border-subtle p-6 hover-card"
            >
              <SectionHeader
                n={4} icon={Pill} title="Prescription" subtitle="Médicaments pour cette consultation"
                badge={
                  <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest tabular">
                    {c.ordonnance.items.length} médicament{c.ordonnance.items.length !== 1 ? 's' : ''}
                  </span>
                }
              />

              {/* Allergy warning */}
              {(() => {
                const conflicts = chart.allergies.filter(a =>
                  c.ordonnance.items.some(i => i.medication.toLowerCase().includes(a.substance.toLowerCase()))
                );
                if (!conflicts.length) return null;
                return (
                  <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-300 rounded-xl mb-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 ring-1 ring-rose-300 flex items-center justify-center shrink-0">
                      <AlertTriangle size={15} className="text-rose-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-rose-800">Alerte allergie</p>
                      {conflicts.map(a => (
                        <p key={a.id} className="text-xs text-rose-700 mt-0.5">{a.substance} — {a.reaction}</p>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3">
                <AnimatePresence>
                  {c.ordonnance.items.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="rounded-2xl border border-border-subtle bg-bg-soft p-4"
                    >
                      {readOnly ? (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 ring-1 ring-teal-200 flex items-center justify-center shrink-0">
                            <Pill size={15} className="text-teal-600" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {item.medication}
                              {item.dosage && <span className="ml-2 px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-[11px] font-medium tabular">{item.dosage}</span>}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">{item.frequency} · {item.duration}</p>
                            {item.instructions && <p className="text-[11px] text-text-muted italic mt-0.5">{item.instructions}</p>}
                          </div>
                          <span className="text-[11px] font-semibold text-teal-600 shrink-0 tabular">#{idx + 1}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-teal-100 ring-1 ring-teal-200 flex items-center justify-center shrink-0">
                              <Pill size={14} className="text-teal-600" strokeWidth={2} />
                            </div>
                            <span className="text-[11px] font-semibold text-teal-600 tabular">#{idx + 1}</span>
                            <button
                              onClick={() => removeMed(item.id)}
                              className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-white transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={item.medication}
                              onChange={e => updateMed({ ...item, medication: e.target.value })}
                              placeholder="Médicament"
                              className="px-3 py-2 rounded-xl border border-border-subtle text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                              value={item.dosage}
                              onChange={e => updateMed({ ...item, dosage: e.target.value })}
                              placeholder="Dosage (ex : 500 mg)"
                              className="px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                              value={item.frequency}
                              onChange={e => updateMed({ ...item, frequency: e.target.value })}
                              placeholder="Fréquence (ex : 1 cp × 3/jour)"
                              className="px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                              value={item.duration}
                              onChange={e => updateMed({ ...item, duration: e.target.value })}
                              placeholder="Durée (ex : 7 jours)"
                              className="px-3 py-2 rounded-xl border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <input
                            value={item.instructions ?? ''}
                            onChange={e => updateMed({ ...item, instructions: e.target.value })}
                            placeholder="Instructions — ex : pendant les repas, à jeun..."
                            className="w-full px-3 py-1.5 rounded-xl border border-border-subtle text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {c.ordonnance.items.length === 0 && readOnly && (
                  <p className="text-sm text-text-muted text-center py-4">Aucun médicament prescrit.</p>
                )}

                {!readOnly && (
                  <button
                    onClick={addMed}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border-subtle text-text-muted hover:border-primary/40 hover:text-primary font-medium text-sm transition-all"
                  >
                    <Plus size={15} strokeWidth={2} /> Ajouter un médicament
                  </button>
                )}
              </div>
            </motion.div>

            {/* Footer actions */}
            {!readOnly && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                className="bg-white rounded-[20px] shadow-card border border-border-subtle p-5 flex flex-wrap items-center gap-3"
              >
                <p className="text-sm text-text-muted font-medium flex-1 min-w-[140px]">
                  Prêt à terminer cette consultation ?
                </p>
                <button
                  onClick={() => { onClose(); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-subtle font-medium text-sm text-text-secondary hover:bg-bg-soft transition-all"
                >
                  <Save size={15} strokeWidth={1.75} /> Enregistrer brouillon
                </button>
                <button
                  onClick={() => printOrdonnance(user, appointment, c.ordonnance.items, patient?.dob)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary font-medium text-sm hover:bg-primary/[0.06] transition-all"
                >
                  <FileText size={15} strokeWidth={1.75} /> Générer l'ordonnance
                </button>
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm shadow-sm hover:opacity-90 transition-all active:scale-95"
                >
                  <CheckCircle2 size={16} strokeWidth={1.75} />
                  {nextApt ? 'Terminer & suivant' : 'Terminer la consultation'}
                </button>
              </motion.div>
            )}

            {readOnly && c.ordonnance.items.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => printOrdonnance(user, appointment, c.ordonnance.items, patient?.dob)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary font-medium text-sm hover:bg-primary/[0.06] transition-all"
                >
                  <FileText size={15} strokeWidth={1.75} /> Imprimer l'ordonnance
                </button>
              </div>
            )}
          </div>

          {/* ══ RIGHT — PATIENT HISTORY ══ */}
          <div className="xl:sticky xl:top-24">
            <div className="bg-white rounded-[20px] shadow-card border border-border-subtle p-5 hover-card">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-text-muted/50" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-widest">Historique du patient</h3>
              </div>
              <p className="text-sm font-medium text-text-secondary mb-4">
                {historyConsults.length} consultation{historyConsults.length !== 1 ? 's' : ''} précédente{historyConsults.length !== 1 ? 's' : ''}
              </p>

              <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {historyConsults.length === 0 ? (
                  <p className="text-sm text-text-muted">Aucune consultation antérieure.</p>
                ) : (
                  historyConsults.map((h, i) => {
                    const apt = appointments.find(a => a.id === h.appointmentId);
                    const title = h.diagnoses[0]
                      || h.soap.assessment.split('\n')[0]?.replace(/^[A-Z0-9.]+\s*—\s*/, '')
                      || 'Consultation';
                    const hasRx = h.ordonnance.items.length > 0;
                    const summary = h.soap.plan.split('\n')[0] || h.soap.assessment.split('\n')[0] || '';
                    return (
                      <motion.button
                        key={h.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i }}
                        onClick={() => apt && onNavigate?.(apt)}
                        disabled={!apt}
                        className="w-full text-left p-3.5 rounded-xl border border-border-subtle hover:border-accent hover:bg-bg-soft/50 hover:-translate-y-0.5 transition-all disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:border-border-subtle relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-text-primary leading-tight pr-2">{title}</p>
                          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${hasRx ? 'text-primary' : 'text-text-muted'}`}>
                            {hasRx ? <Link2 size={10} strokeWidth={2} /> : <Clock size={10} strokeWidth={2} />}
                            {hasRx ? 'Rx' : 'Suivi'}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted tabular mt-1">{fmtDate(h.date, 'd MMMM yyyy')}</p>
                        {summary && <p className="text-xs text-text-secondary mt-2 line-clamp-2">{summary}</p>}
                        {hasRx && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {h.ordonnance.items.slice(0, 3).map(m => (
                              <span key={m.id} className="px-2 py-0.5 rounded-md bg-bg-soft border border-border-subtle text-[10px] font-medium text-text-secondary">
                                {m.medication}{m.dosage ? ` ${m.dosage}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save toast */}
      <AnimatePresence>
        {savedPulse && isDraft && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-text-primary text-white text-xs font-medium shadow-xl"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-400/20 ring-1 ring-emerald-400 flex items-center justify-center">
              <Check size={11} strokeWidth={3} className="text-emerald-300" />
            </span>
            Modifications enregistrées
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
