import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center min-h-screen p-8"
          style={{ background: '#0a0b0d', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}
        >
          <div className="flex flex-col items-center w-full max-w-xl">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle size={28} style={{ color: '#ef4444' }} />
            </div>

            <h2
              className="text-xl font-black mb-2"
              style={{ fontFamily: 'Syne, sans-serif', color: '#f0ede8' }}
            >
              Something went wrong
            </h2>
            <p
              className="text-sm mb-6 text-center"
              style={{ color: 'rgba(240,237,232,0.45)', maxWidth: 380 }}
            >
              An unexpected error occurred. You can try reloading the page or heading back to the
              dashboard.
            </p>

            {/* Error details (collapsed by default via details) */}
            {this.state.error && (
              <details
                className="w-full rounded-xl overflow-hidden mb-6"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <summary
                  className="px-4 py-3 text-xs font-semibold cursor-pointer"
                  style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
                >
                  Error details
                </summary>
                <div className="px-4 pb-4">
                  <pre
                    className="text-xs overflow-auto whitespace-pre-wrap rounded-lg p-3"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: 'rgba(240,237,232,0.5)',
                      maxHeight: 200,
                    }}
                  >
                    {this.state.error.stack || this.state.error.message}
                  </pre>
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.location.href = '/app')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(240,237,232,0.6)',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                <Home size={14} />
                Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                  color: '#0a0b0d',
                  fontFamily: 'Syne, sans-serif',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.25)',
                }}
              >
                <RotateCcw size={14} />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
