import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import './index.css'
import ReactGA from 'react-ga4'

// Helper to handle bundler default-export wrapping quirks
const getGA = (mod) => {
    if (!mod) return null;
    if (mod.initialize) return mod;
    if (mod.default && mod.default.initialize) return mod.default;
    if (mod.default && mod.default.default && mod.default.default.initialize) return mod.default.default;
    return mod;
};
const ga = getGA(ReactGA);

// Initialize Google Analytics
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID && !import.meta.env.DEV) {
    console.log('ReactGA module structure:', ReactGA, 'resolved to:', ga);
    if (ga && typeof ga.initialize === 'function') {
        ga.initialize(GA_MEASUREMENT_ID);
        ga.send("pageview");
    } else {
        console.error('Failed to resolve ReactGA.initialize');
    }
}

import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)

// Register Service Worker for image caching
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

