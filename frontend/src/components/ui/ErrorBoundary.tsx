import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div role="alert" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 40, textAlign: 'center', minHeight: 300,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#ffebee',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
          }}>
            <AlertTriangle size={32} color="#d93025" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
            Bir hata oluştu
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 400 }}>
            {this.state.error?.message || 'Beklenmeyen bir hata meydana geldi.'}
          </p>
          <button className="btn btn-primary" onClick={this.handleReset}>
            <RefreshCw size={16} /> Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
