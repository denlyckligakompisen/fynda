import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = (e) => {
            let scrollY = 0;
            if (e && e.target && e.target.scrollTop !== undefined) {
                // If the event comes from a scrollable div
                scrollY = e.target.scrollTop;
            } else {
                scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            }
            
            // To prevent issues with small internal scrolls, only trigger if target is the document or our main panel
            if (!e.target.classList || e.target.classList.contains('desktop-list-panel') || e.target === document) {
                setIsVisible(scrollY > 400);
            }
        };

        // Use capture phase to get scroll events from all elements
        window.addEventListener('scroll', handleScroll, true);
        handleScroll({ target: document });

        return () => window.removeEventListener('scroll', handleScroll, true);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const panel = document.querySelector('.desktop-list-panel');
        if (panel) {
            panel.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    className="scroll-to-top-btn"
                    onClick={scrollToTop}
                    initial={{ opacity: 0, scale: 0.5, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 30 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Till toppen"
                >
                    <KeyboardArrowUpIcon style={{ fontSize: '32px' }} />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default ScrollToTop;
