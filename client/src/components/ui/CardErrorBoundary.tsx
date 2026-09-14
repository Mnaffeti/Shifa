import * as React from 'react';
import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Per-card error boundary (spec §10): a failing card shows an inline error with
 * a retry button instead of taking down the whole dashboard.
 *
 * Note: this project has no @types/react, so React.Component's members aren't
 * typed for us. We declare the surface we use (props/state/setState) explicitly.
 */
interface Props {
  children: ReactNode;
  label?: string;
}
interface State {
  hasError: boolean;
}

export default class CardErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare setState: (s: State) => void;
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-[16px] border border-[var(--color-danger)]/30 p-5 flex flex-col items-center justify-center gap-3 text-center">
          <span className="w-10 h-10 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-[var(--color-danger)]" strokeWidth={2} />
          </span>
          <p className="text-sm font-medium text-text-primary">
            {this.props.label ?? 'Ce module'} n'a pas pu se charger
          </p>
          <button
            onClick={this.retry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border-subtle text-sm font-medium text-text-secondary hover:border-[var(--color-info)] hover:text-[var(--color-info)] transition-all"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
