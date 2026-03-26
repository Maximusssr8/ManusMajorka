import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Auto-reload on chunk load failures (stale deploys) — once only to avoid reload loops
    const isChunkError = error.message?.includes('dynamically imported') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Loading chunk') ||
      error.name === 'ChunkLoadError';
    if (isChunkError) {
      const reloadKey = 'majorka_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      if (!lastReload) {
        sessionStorage.setItem(reloadKey, Date.now().toString());
        window.location.reload();
        return;
      }
    }
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
        padding: '24px',
      }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#0A0A0A',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            marginBottom: 8,
          }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            An unexpected error occurred. Your data is safe — try refreshing the page.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: 24, textAlign: 'left' }}>
              <summary style={{ color: '#9CA3AF', fontSize: 11, cursor: 'pointer', marginBottom: 8 }}>
                Error details
              </summary>
              <pre style={{
                background: '#F9FAFB',
                border: '1px solid #F5F5F5',
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                color: '#6B7280',
                overflow: 'auto',
                maxHeight: 120,
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#6366F1',
                color: '#FAFAFA',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              Refresh page
            </button>
            <a
              href="mailto:support@majorka.io?subject=App Error"
              style={{
                background: '#F9FAFB',
                color: '#374151',
                border: '1px solid #F0F0F0',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Report issue
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
