import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      errorInfo: errorInfo.componentStack || 'No stack trace available'
    });

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="card p-8">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-center mb-4">
                Bir Hata Oluştu
              </h1>

              {/* Error Message */}
              <p className="text-text-muted text-center mb-6">
                Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
              </p>

              {/* Error Details (Development only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <summary className="cursor-pointer font-medium text-red-600 dark:text-red-400 mb-2">
                    Hata Detayları (Geliştirici Modu)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <strong className="text-sm">Hata:</strong>
                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong className="text-sm">Stack Trace:</strong>
                        <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
                          {this.state.errorInfo}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="flex-1 sm:flex-none bg-accent hover:bg-accent-hover text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  Sayfayı Yenile
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex-1 sm:flex-none bg-gray-500/20 hover:bg-gray-500/30 font-bold py-3 px-6 rounded-lg transition"
                >
                  Ana Sayfaya Dön
                </button>
              </div>

              {/* Support Message */}
              <div className="mt-6 pt-6 border-t border-input-border">
                <p className="text-sm text-text-muted text-center">
                  Sorun devam ederse, lütfen sistem yöneticinizle iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
