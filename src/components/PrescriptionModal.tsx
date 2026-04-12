import { useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function PrescriptionModal({ isOpen, onClose, patientName }: PrescriptionModalProps) {
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const newMeds = [...medications];
    newMeds[index][field] = value;
    setMedications(newMeds);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(26, 71, 71); // Brand Teal
    doc.text('SHIFA HOSPITAL', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Prescription / Ordonnance', 105, 30, { align: 'center' });
    
    doc.setDrawColor(232, 237, 242);
    doc.line(20, 35, 190, 35);

    // Patient Info
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(`Patient: ${patientName}`, 20, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 45);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [['Medication', 'Dosage', 'Frequency', 'Duration']],
      body: medications.map(m => [m.name, m.dosage, m.frequency, m.duration]),
      headStyles: { fillColor: [26, 71, 71], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 55 }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text('Doctor Signature:', 20, finalY + 30);
    doc.line(20, finalY + 35, 80, finalY + 35);

    doc.save(`Prescription_${patientName.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-card shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-primary text-white">
              <div>
                <h2 className="text-xl font-bold">Ordonnance</h2>
                <p className="text-xs text-white/70 font-medium">Patient: {patientName}</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {medications.map((med, index) => (
                <div key={index} className="p-4 bg-bg-soft rounded-lg border border-border-subtle relative group">
                  <button 
                    onClick={() => removeMedication(index)}
                    className="absolute top-2 right-2 p-1 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Medication Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-btn border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. Paracetamol"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-btn border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. 500mg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-btn border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. 3 times a day"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-btn border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. 7 days"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addMedication}
                className="w-full py-2 border-2 border-dashed border-border-subtle rounded-btn text-sm font-bold text-text-muted hover:text-primary hover:border-primary transition-all"
              >
                + Add Medication
              </button>
            </div>

            <div className="p-6 border-t border-border-subtle flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-btn border border-border-subtle font-bold text-text-secondary hover:bg-bg-soft transition-colors"
              >
                Close
              </button>
              <div className="flex-1 flex gap-3 justify-end">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-btn border border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={generatePDF}
                  className="flex items-center gap-2 px-6 py-2 rounded-btn bg-primary text-white font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
                >
                  <Download size={18} />
                  Export PDF
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
