import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SmartImage component with native lazy-loading and smooth fade-in.
 * Uses loading="lazy" instead of a custom IntersectionObserver to avoid
 * race conditions with key-based remounting on mobile Safari.
 *
 * @param {string} src - The image source URL
 * @param {string} srcSet - The image source set for responsive images
 * @param {string} sizes - The image sizes attribute
 * @param {string} alt - The alt text for the image
 * @param {string} className - The CSS class for the image
 */
const SmartImage = ({
    src,
    srcSet,
    sizes,
    alt,
    className
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    // Reset states when the image source changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);

        // If the image is already cached, onLoad may not fire reliably.
        // Use rAF to check after the browser has had a paint frame to
        // apply the new src and potentially load from cache.
        const img = imgRef.current;
        if (img) {
            const rafId = requestAnimationFrame(() => {
                if (img.complete && img.naturalWidth > 0) {
                    setIsLoaded(true);
                }
            });
            return () => cancelAnimationFrame(rafId);
        }
    }, [src]);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoaded(true); // Set to true so that the fallback/placeholder is fully visible (not stuck at opacity 0)
    }, []);

    const imgSrc = hasError ? '/placeholder.png' : (src || '/placeholder.png');

    return (
        <img
            ref={imgRef}
            src={imgSrc}
            srcSet={!hasError ? srcSet : undefined}
            sizes={!hasError ? sizes : undefined}
            alt={alt}
            className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            style={{
                transition: 'opacity 0.4s ease-in-out',
                opacity: isLoaded ? 1 : 0,
            }}
        />
    );
};

export default SmartImage;
