import { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, Mail, Droplets, FileText, Calendar, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import { Appointment, useAppointments } from '../context/AppointmentContext';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onNavigate?: (apt: Appointment) => void;
}

const TYPE_FR: Record<string, string> = {
  'Consultation': 'Consultation',
  'Follow-up': 'Suivi',
  'Surgery': 'Chirurgie',
  'Cancelled': 'Annulé'
};

const TODAY = new Date().toISOString().split('T')[0];

export default function PatientDetailOverlay({ appointment, onClose, onNavigate }: Props) {
  const { patients } = usePatients();
  const { appointments, markAsCompleted } = useAppointments();
  const { user } = useAuth();

  const patient = patients.find(p => p.id === appointment.patientId);

  const [prescription, setPrescription] = useState(
    () => localStorage.getItem(`shifa_rx_${appointment.patientId}`) || ''
  );
  const [saved, setSaved] = useState(false);

  const todayApts = appointments
    .filter(a => a.date === TODAY && a.status !== 'Cancelled' && a.status !== 'Completed')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentIndex = todayApts.findIndex(a => a.id === appointment.id);
  const prevApt = currentIndex > 0 ? todayApts[currentIndex - 1] : null;
  const nextApt = currentIndex < todayApts.length - 1 ? todayApts[currentIndex + 1] : null;

  const history = appointments
    .filter(a => a.patientId === appointment.patientId && a.id !== appointment.id && a.status === 'Completed')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const handleSave = () => {
    localStorage.setItem(`shifa_rx_${appointment.patientId}`, prescription);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDone = () => {
    if (prescription) localStorage.setItem(`shifa_rx_${appointment.patientId}`, prescription);
    markAsCompleted(appointment.id);
    if (nextApt && onNavigate) {
      onNavigate(nextApt);
    } else {
      onClose();
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ordonnance – ${appointment.patientName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Georgia', serif; padding: 48px; color: #1a1a1a; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #1A9E9E; padding-bottom: 20px; margin-bottom: 28px; }
          .doctor-name { font-size: 22px; font-weight: bold; color: #1A6B5A; margin-bottom: 4px; }
          .doctor-sub { font-size: 13px; color: #555; line-height: 1.6; }
          .clinic-info { text-align: right; font-size: 13px; color: #555; line-height: 1.8; }
          .patient-box { background: #f4f9f8; border-left: 4px solid #1A9E9E; padding: 12px 18px; margin-bottom: 32px; border-radius: 0 8px 8px 0; }
          .patient-box p { font-size: 14px; line-height: 1.8; }
          .rx-symbol { font-size: 48px; font-weight: 900; color: #1A9E9E; opacity: 0.25; margin-bottom: 8px; line-height: 1; }
          .rx-content { font-size: 15px; line-height: 2.2; white-space: pre-wrap; min-height: 220px; border-bottom: 1px dashed #ccc; padding-bottom: 48px; }
          .footer { margin-top: 64px; display: flex; justify-content: flex-end; }
          .signature-block { text-align: center; }
          .signature-line { width: 220px; border-top: 1.5px solid #333; margin-bottom: 8px; }
          .signature-name { font-size: 14px; font-weight: bold; }
          .signature-label { font-size: 11px; color: #888; margin-top: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="doctor-name">${user?.name || 'Dr.'}</div>
            <div class="doctor-sub">
              ${user?.specialty || 'Médecin Spécialiste'}<br />
              ShifaPlus Medical Center
            </div>
          </div>
          <div class="clinic-info">
            Date : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}<br />
            Email : ${user?.email || 'contact@shifa.com'}
          </div>
        </div>
        <div class="patient-box">
          <p><strong>Patient :</strong> ${appointment.patientName}</p>
          <p><strong>ID :</strong> ${appointment.patientId}</p>
          ${patient?.dob ? `<p><strong>Né(e) le :</strong> ${patient.dob}</p>` : ''}
          <p><strong>Type :</strong> ${TYPE_FR[appointment.type] || appointment.type}</p>
        </div>
        <div class="rx-symbol">℞</div>
        <div class="rx-content">${prescription || '(Aucune prescription saisie)'}</div>
        <div class="footer">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">${user?.name || 'Dr.'}</div>
            <div class="signature-label">Signature &amp; Cachet</div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] bg-[#F8FAF9] overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="flex items-center gap-2 text-primary font-bold hover:underline">
            <ChevronLeft size={20} />
            Retour
          </button>

          {/* Patient queue navigation */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-muted">
              {todayApts.length > 0
                ? `Patient ${currentIndex + 1} sur ${todayApts.length} aujourd'hui`
                : "Consultation"}
            </span>
            <button
              onClick={() => prevApt && onNavigate?.(prevApt)}
              disabled={!prevApt}
              title={prevApt ? prevApt.patientName : ''}
              className="p-2 rounded-full border border-border-subtle bg-white hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => nextApt && onNavigate?.(nextApt)}
              disabled={!nextApt}
              title={nextApt ? nextApt.patientName : ''}
              className="p-2 rounded-full border border-border-subtle bg-white hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-8">

          {/* Patient info sidebar */}
          <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-8 flex flex-col items-center text-center h-fit sticky top-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent shadow-lg mb-4">
              <img
                src={patient?.avatar || `https://picsum.photos/seed/${appointment.patientName}/100/100`}
                alt={appointment.patientName}
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary mb-1">{appointment.patientName}</h2>
            <p className="text-sm font-bold text-primary mb-1">{appointment.patientId}</p>
            <p className="text-xs text-text-muted font-medium mb-6">
              {TYPE_FR[appointment.type] || appointment.type} · {appointment.startTime}
            </p>

            {patient && (
              <div className="w-full space-y-3 text-left border-t border-border-subtle pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Phone size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{patient.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Mail size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Droplets size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{patient.bloodType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase">Dernière visite</p>
                    <p className="text-sm font-medium text-text-primary">{patient.lastVisit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mini queue preview */}
            {todayApts.length > 1 && (
              <div className="w-full mt-6 pt-6 border-t border-border-subtle">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">File d'attente</p>
                <div className="space-y-2">
                  {todayApts.map((a, i) => (
                    <button
                      key={a.id}
                      onClick={() => onNavigate?.(a)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all text-xs font-bold ${
                        a.id === appointment.id
                          ? 'bg-primary text-white'
                          : 'bg-bg-soft text-text-secondary hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <span className="w-4 shrink-0 text-center opacity-60">{i + 1}</span>
                      <span className="truncate">{a.patientName}</span>
                      <span className="ml-auto opacity-60 shrink-0">{a.startTime}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex flex-col gap-6">

            {/* Consultation history */}
            {history.length > 0 && (
              <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
                <h3 className="text-base font-bold text-text-primary mb-4">Historique des consultations</h3>
                <div className="space-y-3">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-3 p-3 bg-bg-soft rounded-xl">
                      <div className="w-10 h-10 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0">
                        <span className="text-[9px] font-bold text-text-muted uppercase leading-none">
                          {format(new Date(h.date), 'MMM', { locale: fr })}
                        </span>
                        <span className="text-base font-black text-primary leading-none">
                          {format(new Date(h.date), 'd')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{TYPE_FR[h.type] || h.type}</p>
                        {h.notes && (
                          <p className="text-xs text-text-muted truncate max-w-[320px]">{h.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ordonnance */}
            <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-text-primary">Ordonnance</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-bg-soft text-text-secondary text-xs font-bold hover:bg-primary hover:text-white transition-all border border-border-subtle"
                  >
                    <Printer size={14} />
                    Imprimer
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-pill bg-primary/5 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                  >
                    {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
                  </button>
                </div>
              </div>

              {/* Template header */}
              <div className="border border-border-subtle rounded-xl overflow-hidden">
                <div className="bg-primary/5 border-b border-border-subtle px-5 py-3 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-extrabold text-primary">{user?.name}</p>
                    <p className="text-xs text-text-muted">{user?.specialty || 'Médecin Spécialiste'} · ShifaPlus Medical</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-text-secondary">{format(new Date(), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                <div className="px-5 py-2 bg-white border-b border-border-subtle">
                  <p className="text-xs text-text-secondary">
                    <span className="font-bold">Patient :</span> {appointment.patientName}
                    &nbsp;·&nbsp;
                    <span className="font-bold">ID :</span> {appointment.patientId}
                    {patient?.bloodType && <>&nbsp;·&nbsp;<span className="font-bold">Groupe :</span> {patient.bloodType}</>}
                  </p>
                </div>
                <div className="px-5 pt-2 pb-0 bg-white">
                  <span className="text-3xl font-black text-primary/20 select-none leading-none">℞</span>
                </div>
                <textarea
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  className="w-full px-5 pb-5 pt-1 focus:outline-none resize-none font-mono text-sm text-text-primary placeholder:text-text-muted min-h-[160px] bg-white"
                  placeholder="Médicaments, posologie, durée du traitement..."
                />
              </div>
            </div>

            {/* End consultation */}
            <div className="bg-white rounded-[24px] shadow-card border border-border-subtle p-6">
              <h3 className="text-base font-bold text-text-primary mb-4">Clôturer la consultation</h3>
              <button
                onClick={handleDone}
                className="w-full px-6 py-3 bg-accent text-primary font-bold rounded-pill shadow-md hover:brightness-110 transition-all active:scale-95"
              >
                {nextApt
                  ? `Terminer → ${nextApt.patientName} (${nextApt.startTime})`
                  : 'Terminer la consultation'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
