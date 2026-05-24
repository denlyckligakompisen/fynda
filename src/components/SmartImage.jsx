import { useState, useEffect, useRef } from 'react';

/**
 * SmartImage component that handles lazy-loading natively and uses key-based
 * element remounting to guarantee onLoad event firing and smooth fade-in
 * across all browsers, including mobile Safari.
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
    }, [src]);

    // Check if the browser has already loaded the image from cache on mount/change
    useEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            setIsLoaded(true);
        }
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true); // Set to true so that the fallback/placeholder is fully visible (not stuck at opacity 0)
    };

    return (
        <img
            key={src} // Force remounting on src change to ensure new onLoad/onError bindings fire perfectly
            ref={imgRef}
            src={hasError ? '/placeholder.png' : src}
            srcSet={hasError ? undefined : srcSet}
            sizes={hasError ? undefined : sizes}
            alt={alt}
            className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
            onLoad={handleLoad}
            onError={handleError}
            referrerPolicy="no-referrer"
            style={{
                transition: 'opacity 0.4s ease-in-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: isLoaded ? 1 : 0,
            }}
            decoding="async"
        />
    );
};

export default SmartImage;
