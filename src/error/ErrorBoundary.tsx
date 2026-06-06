import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallbackScreen } from './ErrorFallbackScreen';
import { logError } from './errorLogger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError(error, { componentStack: info.componentStack ?? undefined, source: 'ErrorBoundary' });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackScreen onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export const ErrorBoundaryProvider = ({ children }: ErrorBoundaryProps) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);
