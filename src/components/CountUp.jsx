import { useState, useEffect, useRef } from 'react';
import { formatPrice } from '../utils/formatters';

/**
 * Animated counter component with intersection observer
 */
const CountUp = ({ end, duration = 1500, animate = true }) => {
    const [count, setCount] = useState(animate ? 0 : end);
    const [hasStarted, setHasStarted] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        if (!animate) {
            setCount(end);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasStarted(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [animate, end]);

    useEffect(() => {
        if (!animate) {
            setCount(end);
            return;
        }

        if (!hasStarted) return;

        let startTime = null;
        let animationFrameId;

        const animateFn = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            setCount(Math.floor(ease * end));

            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(animateFn);
            }
        };

        animationFrameId = window.requestAnimationFrame(animateFn);

        return () => window.cancelAnimationFrame(animationFrameId);
    }, [end, duration, animate, hasStarted]);

    const formatted = formatPrice(count).replace(/\s?kr/g, '').trim();
    return <span ref={elementRef}>{formatted}</span>;
};

export default CountUp;
