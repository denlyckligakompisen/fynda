import { useState, useEffect, useRef } from 'react';

/**
 * SmartImage component that delays loading the image until it has been
 * in the viewport for a specified duration. Use this to prevent
 * excessive network requests during fast scrolling.
 *
 * @param {string} src - The image source URL
 * @param {string} srcSet - The image source set for responsive images
 * @param {string} sizes - The image sizes attribute
 * @param {string} alt - The alt text for the image
 * @param {string} className - The CSS class for the image
 * @param {number} delay - The delay in milliseconds before loading the image (default: 200ms)
 * @param {string} placeholder - URL for a placeholder image (optional)
 */
const SmartImage = ({
    src,
    srcSet,
    sizes,
    alt,
    className,
    delay = 200,
    placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Element is in viewport, start the timer
                        timerRef.current = setTimeout(() => {
                            setIsVisible(true);
                        }, delay);
                    } else {
                        // Element left viewport, clear the timer
                        if (timerRef.current) {
                            clearTimeout(timerRef.current);
                            timerRef.current = null;
                        }
                    }
                });
            },
            {
                rootMargin: '100px 0px', // Load a bit before it enters the viewport vertically
                threshold: 0.01
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [delay]);

    // Check if the browser has already loaded the image from cache
    useEffect(() => {
        if (isVisible && imgRef.current && imgRef.current.complete) {
            setIsLoaded(true);
        }
    }, [isVisible, src]);

    // Reset states if src changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true); // set to true so the fallback image/error view is visible
    };

    return (
        <img
            ref={imgRef}
            src={hasError ? '/placeholder.png' : (isVisible ? src : placeholder)}
            srcSet={hasError ? undefined : (isVisible ? srcSet : undefined)}
            sizes={hasError ? undefined : (isVisible ? sizes : undefined)}
            alt={alt}
            className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
            onLoad={handleLoad}
            onError={handleError}
            style={{
                transition: 'opacity 0.4s ease-in-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: isLoaded ? 1 : 0,
            }}
            loading="lazy" // Native lazy loading as a fallback/standard practice
            decoding="async"
        />
    );
};

export default SmartImage;

