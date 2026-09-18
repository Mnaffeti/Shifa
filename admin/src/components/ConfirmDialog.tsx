import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, type LucideIcon } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  body: string;
  /** Label of the confirming button. */
  confirmLabel: string;
  /** Destructive actions get a red button; reversible ones stay on brand. */
  tone?: 'danger' | 'primary';
  icon?: LucideIcon;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation step for an action that is hard to undo.
 *
 * Follows the doctor app's delete dialog: tinted icon chip, plain-language
 * body, cancel on the left so the destructive button is never the default
 * landing spot for a stray click.
 */
export default function ConfirmDialog({
  open, title, body, confirmLabel, tone = 'danger', icon: Icon = AlertTriangle,
  busy = false, error = null, onCancel, onConfirm,
}: Props) {
  const chip = tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-primary/[0.07] text-primary';
  const button = tone === 'danger'
    ? 'bg-rose-600 text-white hover:brightness-110'
    : 'bg-primary text-white hover:brightness-110';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={busy ? undefined : onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="alertdialog"
            aria-modal="true"
            className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6"
          >
            <span className={`w-11 h-11 rounded-full grid place-items-center ${chip}`}>
              <Icon size={19} strokeWidth={1.75} />
            </span>

            <h2 className="text-[18px] font-semibold text-text-primary tracking-tight mt-4">
              {title}
            </h2>
            <p className="text-[13.5px] text-text-muted font-normal leading-relaxed mt-2">
              {body}
            </p>

            {error && (
              <p className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-[12.5px] font-medium text-rose-700">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2.5 mt-6">
              <button
                onClick={onCancel}
                disabled={busy}
                className="flex-1 h-11 rounded-[14px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent hover:text-primary transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`flex-1 h-11 rounded-[14px] text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${button}`}
              >
                {busy ? 'En cours…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
