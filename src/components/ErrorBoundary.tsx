import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled UI error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-[#0d0b18] px-6 text-center text-[#f0ece4]">
            <div className="max-w-md rounded-2xl border border-[#2e2945] bg-[#1a1726] p-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#8b7ea8]">
                SOMI
              </p>
              <h1 className="font-display text-3xl font-bold text-[#f0ece4]">
                Something went wrong
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#8b7ea8]">
                We could not load this part of the experience. Please try again.
              </p>
              <button
                type="button"
                onClick={this.handleReset}
                className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
                style={{ background: "#e8a84c", color: "#0d0b18" }}
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
