import { useState, useCallback, useMemo } from 'react';
import { parseShowingDate } from '../utils/formatters';

/**
 * Custom hook for managing filter state
 * @param {Array} data - Raw listing data
 * @returns {Object} Filter state and methods
 */
export const useFilters = (data, favorites = []) => {
    // City and Area Filters
    const [cityFilter, setCityFilter] = useState('Stockholm');
    const [areaFilter, setAreaFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Attribute Filters
    const [topFloorFilter, setTopFloorFilter] = useState(false);

    // Icon Filters
    const [iconFilters, setIconFilters] = useState({
        bidding: false,
        viewing: false,
        new: false
    });

    // Sorting
    const [sortBy, setSortBy] = useState('dealScore');
    const [sortDirection, setSortDirection] = useState('desc');

    // Compute unique areas per city

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
            if (iconFilters.bidding && !item.biddingOpen) return false;
            if (iconFilters.viewing && !item.hasViewing) return false;
            if (iconFilters.new && !item.isNew) return false;


            // 6. Free text search (Address or Area)
            if (searchQuery) {
                const query = searchQuery.toLowerCase().trim();
                const address = (item.address || '').toLowerCase();
                const area = (item.area || '').toLowerCase();
                if (!address.includes(query) && !area.includes(query)) return false;
            }

            return true;
        }).sort((a, b) => {
            // 1. New filter sorting (most recent first)
            if (iconFilters.new) {
                const dateA = new Date(a.published || 0);
                const dateB = new Date(b.published || 0);
                return dateB - dateA;
            }

            // 2. Viewing filter sorting
            if (iconFilters.viewing) {
                const dateA = parseShowingDate(a.nextShowing);
                const dateB = parseShowingDate(b.nextShowing);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                }
                const hasTimeA = a.nextShowing?.fullDateAndTime?.includes(':') ? 1 : 0;
                const hasTimeB = b.nextShowing?.fullDateAndTime?.includes(':') ? 1 : 0;
                return hasTimeA - hasTimeB;
            }

            const factor = sortDirection === 'desc' ? 1 : -1;
            return factor * ((b.priceDiff || 0) - (a.priceDiff || 0));
        });
    }, [data, cityFilter, areaFilter, topFloorFilter, iconFilters, sortDirection, favorites, searchQuery]);

    // Actions
    // Actions
    const handleCityClick = useCallback((city) => {
        if (cityFilter !== city) {
            setCityFilter(city);
            setAreaFilter(null);
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
        setSearchQuery('');
        setIconFilters({
            bidding: false,
            viewing: false,
            new: false
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
