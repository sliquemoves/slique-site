// src/lib/ErrorBoundary.jsx
// Top-level error boundary so a render crash doesn't leave a black screen.
// Shows the error message and a refresh button.

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to the JS console so the dev tools always have it.
    console.error('[ErrorBoundary] Render crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            maxWidth: 540,
            width: '100%',
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '36px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 9,
              letterSpacing: '0.55em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: 14,
            }}>
              Slique Moves
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 28,
              fontWeight: 300,
              letterSpacing: '0.1em',
              color: '#fff',
              margin: '0 0 14px 0',
              textTransform: 'uppercase',
            }}>
              Something broke
            </h1>
            <pre style={{
              textAlign: 'left',
              fontSize: 12,
              color: '#ff8a8a',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: 14,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: '14px 0 22px 0',
              maxHeight: 240,
              overflow: 'auto',
            }}>
              {String(this.state.error?.message ?? this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                color: '#000',
                border: '1px solid #fff',
                fontSize: 10,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
