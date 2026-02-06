import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing filter state
 * @param {Array} data - Raw listing data
 * @returns {Object} Filter state and methods
 */
export const useFilters = (data) => {
    // City and Area Filters
    const [cityFilter, setCityFilter] = useState('Stockholm');
    const [areaFilter, setAreaFilter] = useState(null);

    // Attribute Filters
    const [topFloorFilter, setTopFloorFilter] = useState(false);

    // Icon Filters
    const [iconFilters, setIconFilters] = useState({
        bidding: false,
        viewing: false,
        new: false,
        nearby: false
    });

    // Sorting
    const [sortBy, setSortBy] = useState('dealScore');
    const [sortDirection, setSortDirection] = useState('desc');

    // Compute unique areas per city
    const stockholmAreas = useMemo(() =>
        [...new Set(data.filter(item =>
            (item.searchSource || '').includes('Stockholm') && item.area
        ).map(item => item.area))].sort(),
        [data]
    );

    const uppsalaAreas = useMemo(() =>
        [...new Set(data.filter(item =>
            (item.searchSource || '').includes('Uppsala') && item.area
        ).map(item => item.area))].sort(),
        [data]
    );

    // Filter and sort data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const source = item.searchSource || '';

            // 1. Scope (City)
            if (!source.includes(cityFilter)) return false;

            // 2. Area Filter (within City)
            if (areaFilter && item.area !== areaFilter) return false;

            // 3. Attributes (Top Floor)
            if (topFloorFilter) {
                if (!source.toLowerCase().includes('top floor')) return false;
            }

            // 4. Icon Filters (AND logic)
            if (iconFilters.bidding && !item.biddingOpen) return false;
            if (iconFilters.viewing && !item.hasViewing) return false;
            if (iconFilters.new && !item.isNew) return false;
            if (iconFilters.nearby && cityFilter !== 'Uppsala') {
                const walking = item.walkingTimeMinutes ?? 999;
                const biking = item.bicycleTimeMinutes ?? 999;
                const transit = item.commuteTimeMinutes ?? 999;

                if (walking >= 15 && transit >= 15) return false;
            }

            return true;
        }).sort((a, b) => {
            const factor = sortDirection === 'desc' ? 1 : -1;
            return factor * ((b.priceDiff || 0) - (a.priceDiff || 0));
        });
    }, [data, cityFilter, areaFilter, topFloorFilter, iconFilters, sortDirection]);

    // Actions
    const handleCityClick = useCallback((city, expandedCity, setExpandedCity) => {
        if (cityFilter !== city) {
            setCityFilter(city);
            setAreaFilter(null);
            setExpandedCity(null);
        } else {
            setExpandedCity(prev => prev === city ? null : city);
        }
    }, [cityFilter]);

    const handleAreaSelect = useCallback((area, city, setExpandedCity) => {
        setCityFilter(city);
        setAreaFilter(area);
        setExpandedCity(null);
    }, []);

    const toggleIconFilter = useCallback((type) => {
        setIconFilters(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
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
        setIconFilters({
            bidding: false,
            viewing: false,
            new: false,
            nearby: false
        });
    }, []);

    return {
        // State
        cityFilter,
        areaFilter,
        topFloorFilter,
        iconFilters,
        sortBy,
        sortDirection,
        filteredData,
        stockholmAreas,
        uppsalaAreas,

        // Actions
        handleCityClick,
        handleAreaSelect,
        toggleIconFilter,
        toggleTopFloor,
        handleSort,
        clearFilters
    };
};

export default useFilters;
