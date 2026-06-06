import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IosShareIcon from '@mui/icons-material/IosShare';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';

export default function CardContextMenu({ isOpen, onClose, item, isFavorite, toggleFavorite }) {
    
    // Prevent scrolling when the context menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const booliUrl = item.booliId ? `https://www.booli.se/annons/${item.booliId}` : item.url;

    const handleOpenInBooli = () => {
        window.location.href = booliUrl;
        onClose();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.address || 'Kolla in denna bostad!',
                    text: `Kolla in ${item.address} på Booli.`,
                    url: booliUrl,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(booliUrl);
            alert("Länk kopierad till urklipp!");
        }
        onClose();
    };

    const handleToggleFavorite = () => {
        toggleFavorite(item.url);
        onClose();
    };

    // iOS style Action Sheet
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'var(--bg-overlay)',
                    zIndex: 99999,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '0 8px calc(8px + env(safe-area-inset-bottom)) 8px'
                }}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}
                >
                    {/* Header info about the property */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                                background: `url(${item.imageUrl || item.images?.[0]}) center/cover`
                            }} />
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.address}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.area}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleOpenInBooli}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '0.5px solid var(--border-color)',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '1.1rem',
                                color: 'var(--teal-bright)',
                                cursor: 'pointer'
                            }}
                        >
                            Öppna annons
                            <LaunchRoundedIcon fontSize="small" />
                        </button>

                        <button
                            onClick={handleShare}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '0.5px solid var(--border-color)',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '1.1rem',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            Dela
                            <IosShareIcon fontSize="small" />
                        </button>

                        <button
                            onClick={handleToggleFavorite}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '1.1rem',
                                color: isFavorite ? 'var(--accent-negative)' : 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            {isFavorite ? 'Ta bort från favoriter' : 'Spara som favorit'}
                            {isFavorite ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
                        </button>
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '16px',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: 'var(--teal-bright)',
                            cursor: 'pointer'
                        }}
                    >
                        Avbryt
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
