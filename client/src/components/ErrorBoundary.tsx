import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { C } from '@/lib/designTokens';
import { captureException } from '@/lib/sentry';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureException(error, { componentStack: info.componentStack });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          gap: 20,
          background: C.bg,
          color: C.text,
          fontFamily: C.fontBody,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: C.redSubtle,
            border: `1px solid ${C.border}`,
          }}
        >
          <AlertTriangle size={26} color={C.red} strokeWidth={2} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <h1
            style={{
              fontFamily: C.fontDisplay,
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.02em',
              color: C.text,
            }}
          >
            We hit a glitch on our end.
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.6,
              color: C.body,
            }}
          >
            An unexpected error stopped this page from rendering. The issue has been reported.
            Reloading should resolve it.
          </p>
          {this.state.error?.message ? (
            <pre
              style={{
                marginTop: 16,
                padding: '10px 14px',
                fontSize: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: C.muted,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          ) : null}
        </div>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: '10px 22px',
            background: C.accent,
            color: C.accentInk,
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: C.fontBody,
            cursor: 'pointer',
            minHeight: 44,
            minWidth: 120,
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
