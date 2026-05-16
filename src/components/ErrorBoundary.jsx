import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '3rem 1.25rem',
            textAlign: 'center',
            maxWidth: '600px',
            width: '100%',
            margin: '4rem auto',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">⚠️</div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text)', fontSize: 'clamp(1.1rem, 5vw, 1.5rem)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            An unexpected error occurred. This might be caused by a corrupted or unsupported file.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            aria-label="Try again — dismiss this error and retry"
            style={{ minHeight: '44px', minWidth: '44px' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
