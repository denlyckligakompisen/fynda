import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IosShareIcon from '@mui/icons-material/IosShare';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function IosInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        // Detect Safari (Chrome on iOS has 'crios' instead of 'safari')
        const isSafari = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('fxios');
        };

        // Detect if already installed (standalone)
        const isInStandaloneMode = () => {
            return ('standalone' in window.navigator) && (window.navigator.standalone);
        };

        // Should we show the prompt?
        if (isIos() && isSafari() && !isInStandaloneMode()) {
            const hasSeenPrompt = localStorage.getItem('fynda_ios_prompt_seen');
            if (!hasSeenPrompt) {
                // Show after a small delay
                const timer = setTimeout(() => {
                    setShowPrompt(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleClose = () => {
        setShowPrompt(false);
        localStorage.setItem('fynda_ios_prompt_seen', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            zIndex: 9999,
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                        }}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: '#fff',
                            borderTopLeftRadius: '20px',
                            borderTopRightRadius: '20px',
                            padding: '24px 20px',
                            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
                            zIndex: 10000,
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}
                    >
                        <button 
                            onClick={handleClose}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'rgba(0,0,0,0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000',
                                cursor: 'pointer',
                            }}
                        >
                            <CloseRoundedIcon fontSize="small" />
                        </button>

                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#000',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '24px'
                        }}>
                            F
                        </div>
                        
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 600 }}>Installera Fynda</h3>
                        <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.4 }}>
                            Lägg till appen på din hemskärm för snabbare åtkomst och helskärmsupplevelse.
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f2f2f7', padding: '12px 16px', borderRadius: '12px', width: '100%' }}>
                            <span style={{ fontSize: '0.9rem', color: '#000' }}>1. Tryck på dela-ikonen i menyraden</span>
                            <IosShareIcon style={{ color: '#007aff', marginLeft: 'auto' }} />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f2f2f7', padding: '12px 16px', borderRadius: '12px', width: '100%', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#000' }}>2. Välj <strong>Lägg till på hemskärmen</strong></span>
                            <div style={{ width: '24px', height: '24px', background: '#fff', borderRadius: '6px', marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', fontSize: '18px', fontWeight: 'bold' }}>
                                +
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
