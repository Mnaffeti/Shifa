import { useEffect, useState } from 'react';
import { Check, Clock, Phone, Stethoscope, X, IdCard, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminApi, ApiError, type DoctorRequest } from '../lib/api';
import IssuedCredentialsCard from './IssuedCredentialsCard';

interface Issued {
  name: string;
  matricule: string;
  temporaryPassword: string;
}

/**
 * Admin review queue for doctor account requests: accept (creates the
 * account and shows the temporary password once) or reject.
 */
export default function DoctorRequestsSection({ onAccepted }: { onAccepted: () => void }) {
  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const { requests } = await adminApi.doctorRequests.list();
      setRequests(requests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const pending = requests.filter(r => r.status === 'PENDING');

  const accept = async (r: DoctorRequest) => {
    setBusyId(r.id);
    setError(null);
    try {
      const { doctor, temporaryPassword } = await adminApi.doctorRequests.accept(r.id);
      setIssued({ name: doctor.name, matricule: doctor.matricule, temporaryPassword });
      setRequests(prev => prev.filter(x => x.id !== r.id));
      onAccepted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'acceptation.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (r: DoctorRequest) => {
    setBusyId(r.id);
    setError(null);
    try {
      await adminApi.doctorRequests.reject(r.id);
      setRequests(prev => prev.filter(x => x.id !== r.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec du refus.');
    } finally {
      setBusyId(null);
    }
  };

  if (!isLoading && pending.length === 0 && !issued) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-xl bg-amber-50 grid place-items-center shrink-0">
          <Inbox size={15} className="text-amber-600" strokeWidth={1.75} />
        </span>
        <h2 className="text-[15px] font-semibold text-text-primary tracking-tight">
          Demandes de compte en attente
        </h2>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
            {pending.length}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {pending.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[18px] border border-amber-200/60 p-4 flex items-start gap-4"
            >
              <span className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 grid place-items-center shrink-0 text-[13px] font-semibold text-amber-700">
                {r.name.replace(/^(dr|pr)\.?\s*/i, '').slice(0, 2).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-text-primary tracking-tight truncate">
                  {r.name}
                </h3>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary font-normal tabular">
                    <IdCard size={12} strokeWidth={1.75} className="text-text-muted shrink-0" />
                    {r.matricule}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary font-normal tabular">
                    <Phone size={12} strokeWidth={1.75} className="text-text-muted shrink-0" />
                    {r.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary font-normal">
                    <Stethoscope size={12} strokeWidth={1.75} className="text-text-muted shrink-0" />
                    {r.specialty}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => void reject(r)}
                  disabled={busyId === r.id}
                  title="Refuser"
                  className="w-9 h-9 rounded-xl border border-border-subtle text-text-muted hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 grid place-items-center"
                >
                  <X size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => void accept(r)}
                  disabled={busyId === r.id}
                  title="Accepter"
                  className="w-9 h-9 rounded-xl bg-primary text-white hover:brightness-110 transition-all disabled:opacity-50 grid place-items-center"
                >
                  <Check size={16} strokeWidth={2.25} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <p className="text-[13px] text-text-muted font-normal text-center py-6">Chargement…</p>
        )}
      </div>

      <AnimatePresence>
        {issued && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setIssued(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl p-8"
            >
              <IssuedCredentialsCard
                doctorName={issued.name}
                matricule={issued.matricule}
                temporaryPassword={issued.temporaryPassword}
                onDone={() => setIssued(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-text-muted font-medium">
        <Clock size={11} />
        Les demandes acceptées ou refusées disparaissent de cette liste.
      </div>
    </div>
  );
}
