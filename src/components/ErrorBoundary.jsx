import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#000',
                    color: '#fff',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Hoppsan! Något gick fel.</h1>
                    <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                        Appen stötte på ett oväntat fel. Prova att ladda om sidan.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--teal-accent, #3b8d99)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Ladda om appen
                    </button>
                    {import.meta.env.DEV && (
                        <pre style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: '#111',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            textAlign: 'left',
                            maxWidth: '100%',
                            overflow: 'auto',
                            color: '#ff5555'
                        }}>
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
