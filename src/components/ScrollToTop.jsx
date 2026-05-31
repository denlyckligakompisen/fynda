import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = (e) => {
            // Ignore small internal scrolls like dropdowns
            if (e && e.target && e.target.classList) {
                if (e.target.classList.contains('dropdown-menu') || 
                    e.target.classList.contains('autocomplete-dropdown')) {
                    return;
                }
            }

            let currentScrollY = 0;
            if (e && e.target && e.target.classList && e.target.classList.contains('desktop-list-panel')) {
                currentScrollY = e.target.scrollTop;
            } else {
                currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
            }
            
            setIsVisible(currentScrollY > 400);
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
