import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show if scrolled down > 300px AND scrolling UP
            if (currentScrollY > 300 && currentScrollY < lastScrollY.current) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
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
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Scrolla till toppen"
                >
                    <ArrowUpwardRoundedIcon />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default ScrollToTop;
