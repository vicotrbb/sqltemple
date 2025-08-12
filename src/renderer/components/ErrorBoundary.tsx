import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangleIcon, RefreshIcon } from "./icons/IconLibrary";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-vscode-bg">
          <div className="bg-vscode-bg-secondary border border-vscode-border rounded-lg p-8 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangleIcon className="w-8 h-8 text-vscode-error" />
              <h2 className="text-lg font-semibold text-vscode-text">
                Something went wrong
              </h2>
            </div>
            
            <p className="text-vscode-text-secondary mb-4">
              An unexpected error occurred. You can try reloading the application or reset this component.
            </p>

            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-vscode-text-secondary cursor-pointer hover:text-vscode-text">
                  Error details
                </summary>
                <div className="mt-2 p-3 bg-vscode-bg border border-vscode-border rounded text-xs font-mono text-vscode-text-secondary">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors"
              >
                <RefreshIcon size={16} />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-vscode-bg-quaternary hover:bg-vscode-bg-tertiary text-vscode-text rounded text-sm font-medium transition-colors border border-vscode-border"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;