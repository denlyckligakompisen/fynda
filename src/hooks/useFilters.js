import { useState, useCallback, useMemo } from 'react';
import { parseShowingDate } from '../utils/formatters';

/**
 * Custom hook for managing filter state
 * @param {Array} data - Raw listing data
 * @returns {Object} Filter state and methods
 */
export const useFilters = (data, favorites = []) => {
    // City and Area Filters
    const [cityFilter, setCityFilter] = useState('Uppsala');
    const [areaFilter, setAreaFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Attribute Filters
    const [topFloorFilter, setTopFloorFilter] = useState(false);

    // Icon Filters
    const [iconFilters, setIconFilters] = useState({
        new: false,
        monthlyCost: false,
        dealScore: false,
        newest: true
    });

    // Sorting
    const [sortBy, setSortBy] = useState('dealScore');
    const [sortDirection, setSortDirection] = useState('desc');
    const [activeSortType, setActiveSortType] = useState(null); // which sort is active
    const [sortAscending, setSortAscending] = useState(false); // direction for active sort

    // Filter and sort data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const source = item.searchSource || '';

            // 2. Scope (City)
            if (!source.includes(cityFilter)) return false;

            // 3. Area Filter (within City)
            if (areaFilter && item.area !== areaFilter) return false;

            // 4. Attributes (Top Floor)
            if (topFloorFilter) {
                if (!source.toLowerCase().includes('top floor')) return false;
            }

            // 5. Icon Filters (AND logic)
            // Use daysActive=0 for new items if isNew is missing
            if (iconFilters.new && (!item.isNew && item.daysActive !== 0)) return false;


            // 6. Free text search (Address or Area)
            if (searchQuery) {
                const query = searchQuery.toLowerCase().trim();
                const address = (item.address || '').toLowerCase();
                const area = (item.area || '').toLowerCase();
                if (!address.includes(query) && !area.includes(query)) return false;
            }

            return true;
        }).sort((a, b) => {
            // Helper function for monthly cost calculation
            // ... (rest of sorting logic)
            const calcMonthlyCost = (item) => {
                if (!item.listPrice || item.listPrice <= 0) return Infinity;
                const interest = ((((item.listPrice * 0.85) * 0.01) / 12) * 0.7);
                // const amortization = (item.listPrice * 0.85 * 0.02) / 12; // Excluded from sorting
                const fee = item.rent || 0;
                const operating = item.livingArea ? (50 * item.livingArea) / 12 : 0;
                return interest + fee + operating;
            };

            const direction = sortAscending ? 1 : -1;

            // 1. Monthly cost sorting
            if (iconFilters.monthlyCost) {
                const diff = calcMonthlyCost(a) - calcMonthlyCost(b);
                return sortAscending ? -diff : diff; // default: lowest first
            }

            // 2. Fyndchans sorting (highest positive priceDiff first = best deals)
            if (iconFilters.dealScore) {
                return (b.priceDiff || 0) - (a.priceDiff || 0); // highest diff first
            }

            // 3. Newest sorting (most recent published date first)
            if (iconFilters.newest) {
                const dateA = new Date(a.published || 0);
                const dateB = new Date(b.published || 0);
                return dateB - dateA;
            }

            // Default: newest first (most recent published date)
            const dateA = new Date(a.published || 0);
            const dateB = new Date(b.published || 0);
            return dateB - dateA;
        });
    }, [data, cityFilter, areaFilter, topFloorFilter, iconFilters, sortDirection, favorites, searchQuery]);

    // Actions
    const handleCityClick = useCallback((city) => {
        if (cityFilter !== city) {
            setCityFilter(city);
            setAreaFilter(null);
            // Re-calc max age for city? It's done in useMemo ageStats
        }
    }, [cityFilter]);

    const handleAreaSelect = useCallback((area, city, setExpandedCity) => {
        setCityFilter(city);
        setAreaFilter(area);
        setExpandedCity(null);
    }, []);

    const toggleIconFilter = useCallback((type) => {
        // Handle sort types specially (toggle direction if already active)
        if (type === 'monthlyCost' || type === 'dealScore' || type === 'newest') {
            setIconFilters(prev => {
                const isCurrentlyActive = prev[type];
                if (isCurrentlyActive) {
                    // Don't toggle off if already active (radio button behavior)
                    return prev;
                } else {
                    // Activate this sort, deactivate other sorts
                    return {
                        ...prev,
                        monthlyCost: type === 'monthlyCost',
                        dealScore: type === 'dealScore',
                        newest: type === 'newest'
                    };
                }
            });
            return;
        }

        // Handle regular filters
        setIconFilters(prev => {
            const newVal = !prev[type];
            const updates = {
                ...prev,
                [type]: newVal
            };

            return updates;
        });
    }, []);

    const toggleTopFloor = useCallback(() => {
        setTopFloorFilter(prev => !prev);
    }, []);

    const handleSort = useCallback((type) => {
        if (sortBy === type) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(type);
            setSortDirection('desc');
        }
    }, [sortBy]);

    const clearFilters = useCallback(() => {
        setAreaFilter(null);
        setTopFloorFilter(false);
        setSearchQuery('');
        // Reset age range to full range?
        // Ideally checking ageStats again, but we can't access it easily inside useCallback without dependency
        // We'll leave age range alone for now or reset to strict defaults
        // setAgeRange([0, 1000]);

        setIconFilters({
            new: false,
            monthlyCost: false,
            dealScore: false,
            newest: true
        });
    }, []);

    return {
        // State
        cityFilter,
        areaFilter,
        searchQuery,
        topFloorFilter,
        iconFilters,
        sortBy,
        sortDirection,
        sortAscending,
        filteredData,
        // Actions
        handleCityClick,
        handleAreaSelect,
        setSearchQuery,
        toggleIconFilter,
        toggleTopFloor,
        handleSort,
        clearFilters
    };
};

export default useFilters;
