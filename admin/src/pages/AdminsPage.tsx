import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, CalendarDays, LogIn, Mail, Plus, RefreshCw, ShieldCheck, Trash2,
} from 'lucide-react';
import { adminApi, ApiError, type AdminAccount } from '../lib/api';
import { fileDateTime, relativeDay } from '../lib/dates';
import CreateAdminModal from '../components/CreateAdminModal';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * The administrator roster.
 *
 * Until now an admin could only be created by running db:create-admin on the
 * server, which needs shell access — so a practice could not add a colleague to
 * the back office on its own.
 */
export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const { admins } = await adminApi.admins.list();
      setAdmins(admins);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminApi.admins.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    } finally {
      setBusy(false);
    }
  };

  // The last admin cannot be removed, so don't offer the button at all.
  const isLastAdmin = admins.length <= 1;

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
            Administrateurs
          </h1>
          <p className="text-[14px] text-text-muted font-normal mt-1.5">
            Les comptes ayant accès à ce back-office
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-[14px] border border-border-subtle bg-white text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} strokeWidth={1.75} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="group inline-flex items-center gap-2 h-11 px-5 rounded-[14px] bg-primary text-white text-[13px] font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-90" />
            Ajouter un administrateur
          </button>
        </div>
      </header>

      <p className="flex items-start gap-2.5 mt-6 px-4 py-3 rounded-[14px] bg-bg-soft border border-border-subtle text-[12.5px] text-text-muted font-normal leading-relaxed">
        <ShieldCheck size={15} className="text-text-muted shrink-0 mt-0.5" strokeWidth={1.75} />
        Un administrateur gère les comptes médecins et consulte le journal, mais
        n'a accès à aucune donnée patient. Le dernier administrateur ne peut pas
        être supprimé.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-3 p-4 rounded-[16px] bg-rose-50 border border-rose-100">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-[13.5px] font-medium text-rose-700">{error}</p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {isLoading && admins.length === 0 && (
          <div className="py-16 text-center">
            <span className="inline-block w-7 h-7 rounded-full border-2 border-border-subtle border-t-primary animate-spin" />
            <p className="text-[13px] font-medium text-text-muted mt-3">Chargement…</p>
          </div>
        )}

        {admins.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            className="group hover-row bg-white rounded-[18px] border border-border-subtle p-5 flex items-center gap-5 flex-wrap"
          >
            <span className="w-12 h-12 rounded-full bg-primary/5 grid place-items-center shrink-0 transition-colors duration-300 group-hover:bg-accent/20">
              <ShieldCheck size={20} className="text-primary" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-[15.5px] font-semibold text-text-primary truncate">{a.name}</p>
                {a.isSelf && (
                  <span className="px-2.5 py-0.5 rounded-pill bg-primary/[0.08] text-primary text-[11px] font-semibold">
                    Vous
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap mt-1.5">
                {a.email && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted font-normal truncate">
                    <Mail size={13} strokeWidth={1.75} />
                    {a.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted font-normal">
                  <CalendarDays size={13} strokeWidth={1.75} />
                  créé {relativeDay(a.createdAt) ?? fileDateTime(a.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <p className="tabular text-[17px] font-semibold text-primary leading-none">
                  {a.loginCount}
                </p>
                <p className="text-[11px] text-text-muted font-normal mt-1">connexions</p>
              </div>
              <div className="text-right min-w-[110px]">
                <p className="text-[12.5px] font-medium text-text-secondary">
                  {a.lastLoginAt ? relativeDay(a.lastLoginAt) ?? fileDateTime(a.lastLoginAt) : '—'}
                </p>
                <p className="text-[11px] text-text-muted font-normal mt-0.5">
                  {a.lastLoginAt ? 'dernière connexion' : 'jamais venu'}
                </p>
              </div>

              {/* Deleting yourself would end your own session; deleting the last
                  admin would lock everyone out. The server refuses both. */}
              {!a.isSelf && !isLastAdmin && (
                <button
                  onClick={() => { setActionError(null); setDeleting(a); }}
                  title="Supprimer"
                  className="w-9 h-9 rounded-[11px] grid place-items-center text-text-muted hover:bg-rose-50 hover:text-rose-600 transition-all"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {admins.length > 0 && (
        <p className="flex items-center gap-2 mt-4 text-[12px] text-text-muted font-normal">
          <LogIn size={13} strokeWidth={1.75} />
          {admins.length} administrateur{admins.length > 1 ? 's' : ''}
        </p>
      )}

      <CreateAdminModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={load}
      />

      <ConfirmDialog
        open={!!deleting}
        tone="danger"
        icon={Trash2}
        title="Supprimer cet administrateur ?"
        body={`${deleting?.name} perdra immédiatement l'accès au back-office. Cette action est irréversible et sera enregistrée dans le journal.`}
        confirmLabel="Supprimer"
        busy={busy}
        error={actionError}
        onCancel={() => { setDeleting(null); setActionError(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
