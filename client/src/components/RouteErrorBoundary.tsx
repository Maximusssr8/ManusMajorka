import React from 'react';
import ServerError from '@/pages/ServerError';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; retryCount: number; }

export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };
  static getDerivedStateFromError(): Partial<State> { return { hasError: true }; }

  retry = () => {
    // Attempt a silent soft retry on first failure; hard-reload on repeat.
    if (this.state.retryCount < 1) {
      this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
      return;
    }
    if (typeof window !== 'undefined') window.location.reload();
  };

  componentDidCatch() {
    // One silent retry after a brief delay to recover from transient errors
    // (e.g. dynamic import races). Subsequent failures surface the full
    // ServerError page.
    if (this.state.retryCount < 1) setTimeout(this.retry, 500);
  }

  render() {
    if (this.state.hasError) {
      return <ServerError onRetry={this.retry} />;
    }
    return this.props.children;
  }
}
