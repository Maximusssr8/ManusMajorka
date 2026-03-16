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
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#080a0e',
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
            color: '#f0ede8',
            fontFamily: 'Syne, sans-serif',
            marginBottom: 8,
          }}>
            Something went wrong
          </h1>
          <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            An unexpected error occurred. Your data is safe — try refreshing the page.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: 24, textAlign: 'left' }}>
              <summary style={{ color: 'rgba(240,237,232,0.3)', fontSize: 11, cursor: 'pointer', marginBottom: 8 }}>
                Error details
              </summary>
              <pre style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                color: 'rgba(240,237,232,0.5)',
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
                background: '#d4af37',
                color: '#080a0e',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              Refresh page
            </button>
            <a
              href="mailto:support@majorka.io?subject=App Error"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(240,237,232,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
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
