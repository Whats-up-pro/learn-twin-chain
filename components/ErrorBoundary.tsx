import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center max-w-lg mx-auto px-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We encountered an unexpected error while loading this page.
            </p>
            {this.state.error && (
              <details className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <summary className="cursor-pointer font-medium text-red-700 mb-2">
                  Error Details (Click to expand)
                </summary>
                <pre className="text-xs text-red-600 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              <Link 
                to="/dashboard" 
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 mr-2 rotate-180" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
