import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback — defaults to the full Elva crash screen */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

/**
 * ErrorBoundary — Catches any React render/lifecycle error and displays a
 * premium Elva-branded recovery screen instead of a blank white void.
 *
 * React requires error boundaries to be *class* components. This is the only
 * class component in the codebase — intentionally kept minimal.
 *
 * Placement: Wrap the root <App /> in main.tsx so every component is covered.
 * For finer-grained recovery, also wrap individual heavy views (Queue, ProfileHub)
 * with their own boundaries so a localised crash doesn't kill the whole player.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorStack: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
      errorStack: error.stack || '',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console so devs can still see the full trace
    console.error('[Elva ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDismiss = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0c 0%, #0f0f13 100%)',
            color: 'white',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '2rem',
            zIndex: 99999,
          }}
        >
          {/* Subtle ambient glow */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            {/* Elva wordmark */}
            <p style={{ fontSize: '11px', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: 0 }}>
              Elva
            </p>

            {/* Glassy error card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                backdropFilter: 'blur(20px)',
                width: '100%',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '1rem', filter: 'grayscale(0.3)' }}>💔</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.92)' }}>
                Something went wrong
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '0 0 1.75rem', lineHeight: 1.6 }}>
                {this.state.errorMessage}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={this.handleReload}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.92)',
                    color: '#0a0a0c',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Reload app
                </button>
                <button
                  onClick={this.handleDismiss}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >
                  Try to recover
                </button>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
              If the problem persists, try clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
