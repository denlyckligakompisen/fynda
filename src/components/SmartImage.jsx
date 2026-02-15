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
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [imageSrcSet, setImageSrcSet] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
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

    useEffect(() => {
        if (isVisible) {
            // Once visible (after delay), set the real sources
            const img = new Image();
            img.src = src;
            if (srcSet) img.srcset = srcSet;
            if (sizes) img.sizes = sizes;

            img.onload = () => {
                setImageSrc(src);
                if (srcSet) setImageSrcSet(srcSet);
                setIsLoaded(true);
            };
        }
    }, [isVisible, src, srcSet, sizes]);

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            srcSet={imageSrcSet}
            sizes={sizes}
            alt={alt}
            className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
            style={{
                transition: 'opacity 0.4s ease-in-out',
                opacity: isLoaded ? 1 : 0,
            }}
            loading="lazy" // Native lazy loading as a fallback/standard practice
            decoding="async"
        />
    );
};

export default SmartImage;
