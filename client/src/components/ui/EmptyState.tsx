import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

/**
 * Explicit empty state (spec §6): one line of text + one action button.
 * The card shrinks to content height — never a stretched blank card.
 */
interface Props {
  icon?: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export default function EmptyState({ icon: Icon, message, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
      {Icon && (
        <span className="w-10 h-10 rounded-full bg-bg-soft flex items-center justify-center">
          <Icon size={18} className="text-[#64748B]" strokeWidth={1.75} />
        </span>
      )}
      <p className="text-sm font-medium text-[#64748B] max-w-[24ch]">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--color-info)] text-white text-sm font-medium hover:brightness-110 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
