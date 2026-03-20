// ============================================================
// ERROR BOUNDARY — Sayfa seviyesi hata yakalama
// ============================================================

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-900/30 border border-red-800/50 flex items-center justify-center mb-5">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>

          <h2 className="text-slate-100 font-semibold text-base mb-1">
            Beklenmeyen bir hata oluştu
          </h2>
          <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
            {this.state.error?.message ?? 'Bilinmeyen hata'}
          </p>

          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700
                         border border-slate-700 text-slate-300 hover:text-slate-100
                         rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tekrar Dene
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500
                         text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Ana Sayfa
            </button>
          </div>

          {/* Dev mode: stack trace */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-6 text-left max-w-lg w-full">
              <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
                Teknik detaylar
              </summary>
              <pre className="mt-2 text-[10px] text-red-400/70 bg-slate-900 border border-slate-800
                              rounded-lg p-3 overflow-auto max-h-48 leading-relaxed">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Functional wrapper ──────────────────────────────────────
export function ErrorState({
  title = 'Bir hata oluştu',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-900/30 border border-red-800/50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-slate-300 font-medium text-sm">{title}</p>
      {message && (
        <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700
                     border border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tekrar Dene
        </button>
      )}
    </div>
  );
}
