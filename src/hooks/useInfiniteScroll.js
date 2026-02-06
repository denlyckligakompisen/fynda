import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for infinite scroll with IntersectionObserver
 * @param {boolean} isLoading - Loading state
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Number of items per page
 * @param {Array} dependencies - Dependencies to reset visible count
 * @returns {Object} { visibleCount, loadMoreRef }
 */
export const useInfiniteScroll = (isLoading, totalItems, pageSize = 25, dependencies = []) => {
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const loadMoreRef = useRef(null);

    // Reset visible count when dependencies change
    useEffect(() => {
        setVisibleCount(pageSize);
    }, dependencies);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        if (isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => prev + pageSize);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [isLoading, totalItems, pageSize]);

    return {
        visibleCount,
        loadMoreRef,
        hasMore: visibleCount < totalItems
    };
};

export default useInfiniteScroll;
