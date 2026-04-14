import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; retryCount: number; }

export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };
  static getDerivedStateFromError(): Partial<State> { return { hasError: true }; }
  retry = () => {
    if (this.state.retryCount < 1) {
      this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
    }
  };
  componentDidCatch() {
    if (this.state.retryCount < 1) setTimeout(this.retry, 500);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <p className="text-muted-foreground text-sm">Something went wrong loading this page.</p>
          <button onClick={this.retry} className="px-4 py-2 bg-[#d4af37] text-white rounded-lg text-sm hover:bg-[#a88b2a] transition-colors">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
