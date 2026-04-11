import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Route-level error boundary. Every /app/* page mounts inside one of these.
 * Shows a branded, actionable crash screen with the underlying error message,
 * a reload button, and a link back to the dashboard — not a dead "something
 * went wrong" with no escape.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry if configured — non-blocking.
    if (typeof window !== 'undefined') {
      const sentry = (window as unknown as { Sentry?: { captureException?: (e: unknown, extra?: unknown) => void } }).Sentry;
      sentry?.captureException?.(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null, retryCount: this.state.retryCount + 1 });
  };

  reload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  goHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/app';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const msg = this.state.error?.message || 'An unexpected error occurred.';
    const stack = this.state.error?.stack?.split('\n').slice(0, 3).join('\n') ?? '';

    return (
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          background: '#080808',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          color: '#ededed',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            background: '#0f0f0f',
            border: '1px solid #1a1a1a',
            borderRadius: 10,
            padding: '32px 28px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
              opacity: 0.5,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 12px rgba(239,68,68,0.6)',
              }}
            />
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#ef4444',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Render error
            </div>
          </div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 10,
              letterSpacing: '-0.01em',
              color: '#ededed',
            }}
          >
            This page couldn&rsquo;t render.
          </h2>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 18 }}>
            Something threw while loading the page. The rest of Majorka still works — you can retry, reload, or head back to the dashboard.
          </p>
          <div
            style={{
              background: '#050505',
              border: '1px solid #1a1a1a',
              borderRadius: 6,
              padding: '12px 14px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#fca5a5',
              marginBottom: 20,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              maxHeight: 120,
              overflow: 'auto',
            }}
          >
            {msg}
            {stack ? '\n\n' + stack : ''}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.retry}
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.reload}
              style={{
                background: 'transparent',
                color: '#ededed',
                border: '1px solid #1a1a1a',
                borderRadius: 6,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hard reload
            </button>
            <button
              type="button"
              onClick={this.goHome}
              style={{
                background: 'transparent',
                color: '#888',
                border: '1px solid #1a1a1a',
                borderRadius: 6,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to dashboard
            </button>
          </div>
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid #1a1a1a',
              fontSize: 11,
              color: '#555',
              lineHeight: 1.6,
            }}
          >
            If this keeps happening, open your browser console and paste the stack trace to{' '}
            <a href="mailto:support@majorka.io" style={{ color: '#d4af37', textDecoration: 'none' }}>
              support@majorka.io
            </a>
            . We&rsquo;ll fix it fast.
          </div>
        </div>
      </div>
    );
  }
}
