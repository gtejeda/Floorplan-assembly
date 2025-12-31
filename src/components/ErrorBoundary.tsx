import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-400 text-5xl mb-4">!</div>
            <h1 className="text-xl font-semibold text-gray-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-4">
              An unexpected error occurred. You can try to recover or reload the page.
            </p>
            {this.state.error && (
              <details className="text-left mb-4">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 rounded text-red-300 text-xs overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
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

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
}

export function CanvasErrorBoundary({ children, componentName = 'Canvas' }: CanvasErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
          <div className="text-center p-4">
            <p className="text-lg mb-2">{componentName} failed to load</p>
            <p className="text-sm">Try refreshing the page</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
