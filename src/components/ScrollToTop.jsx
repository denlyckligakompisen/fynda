import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Use multiple ways to detect scroll for compatibility
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

            // Show button after 400px of scrolling
            setIsVisible(scrollY > 400);
        };

        // Listen to scroll events
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Initial check in case they are already scrolled
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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
