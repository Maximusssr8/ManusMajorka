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
<<<<<<< HEAD
      return <ServerError onRetry={this.retry} />;
=======
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <p className="text-muted-foreground text-sm">Something went wrong loading this page.</p>
          <button onClick={this.retry} className="px-4 py-2 bg-[#4f8ef7] text-white rounded-lg text-sm hover:bg-[#a88b2a] transition-colors">
            Try again
          </button>
        </div>
      );
>>>>>>> origin/app-theme-cobalt
    }
    return this.props.children;
  }
}
