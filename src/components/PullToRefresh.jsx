import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import CircularProgress from '@mui/material/CircularProgress';

export default function PullToRefresh({ onRefresh, children }) {
    const [isPulling, setIsPulling] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const currentY = useRef(0);
    const controls = useAnimation();
    
    const maxPull = 100;
    const triggerThreshold = 70;

    const handleTouchStart = (e) => {
        if (window.scrollY > 0 || isRefreshing) return;
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
    };

    const handleTouchMove = (e) => {
        if (!isPulling || isRefreshing) return;
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;
        
        if (diff > 0) {
            // Cancel browser default pull-to-refresh if possible
            if (e.cancelable) {
                e.preventDefault();
            }
            const pulled = Math.min(diff * 0.4, maxPull); // 0.4 resistance factor
            setPullProgress(pulled);
            controls.set({ y: pulled });
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling || isRefreshing) return;
        setIsPulling(false);
        
        if (pullProgress > triggerThreshold) {
            setIsRefreshing(true);
            controls.start({ y: 50 }); // Hold it open at 50px
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                controls.start({ y: 0 });
                setPullProgress(0);
            }
        } else {
            controls.start({ y: 0 });
            setPullProgress(0);
        }
    };

    return (
        <div 
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove} 
            onTouchEnd={handleTouchEnd}
            style={{ position: 'relative', touchAction: 'pan-y' }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: pullProgress / triggerThreshold,
                transform: `translateY(${Math.min(pullProgress - 50, 0)}px)`,
                zIndex: 0
            }}>
                <CircularProgress 
                    size={24} 
                    thickness={4} 
                    sx={{ color: 'var(--text-secondary)' }} 
                    variant={isRefreshing ? "indeterminate" : "determinate"}
                    value={isRefreshing ? undefined : Math.min((pullProgress / triggerThreshold) * 100, 100)}
                />
            </div>
            
            <motion.div 
                animate={controls}
                style={{ position: 'relative', zIndex: 1, background: 'var(--bg-primary)' }}
            >
                {children}
            </motion.div>
        </div>
    );
}
