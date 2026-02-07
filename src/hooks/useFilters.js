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
        new: false,
        nearby: false,
        favorites: false
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

            // 1. Favorites Filter (special case)
            if (iconFilters.favorites && !favorites.includes(item.url)) return false;

            // 2. Scope (City)
            if (!iconFilters.favorites && !source.includes(cityFilter)) return false;

            // 3. Area Filter (within City)
            if (!iconFilters.favorites && areaFilter && item.area !== areaFilter) return false;

            // 4. Attributes (Top Floor)
            if (topFloorFilter) {
                if (!source.toLowerCase().includes('top floor')) return false;
            }

            // 5. Icon Filters (AND logic)
            if (iconFilters.bidding && !item.biddingOpen) return false;
            if (iconFilters.viewing && !item.hasViewing) return false;
            if (iconFilters.new && !item.isNew) return false;
            if (iconFilters.nearby && cityFilter !== 'Uppsala') {
                const transit = item.commuteTimeMinutes ?? 999;
                if (transit > 30) return false;
            }

            // 6. Free text search (Address or Area)
            if (searchQuery) {
                const query = searchQuery.toLowerCase().trim();
                const address = (item.address || '').toLowerCase();
                const area = (item.area || '').toLowerCase();
                if (!address.includes(query) && !area.includes(query)) return false;
            }

            return true;
        }).sort((a, b) => {
            // Prioritize upcoming showings if viewing filter is active
            if (iconFilters.viewing) {
                const dateA = parseShowingDate(a.nextShowing);
                const dateB = parseShowingDate(b.nextShowing);

                // Primary sort: Chronological by date
                // We compare the date parts (ignoring hours/mins for the primary check if we wanted day-only, 
                // but parseShowingDate returns a full Date, so simple comparison works for global chron)
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                }

                // Secondary sort: If at the exact same time (or both missing time), 
                // maintain consistency. Otherwise, "no time" vs "has time" on the same day.
                const hasTimeA = a.nextShowing?.fullDateAndTime?.includes(':') ? 1 : 0;
                const hasTimeB = b.nextShowing?.fullDateAndTime?.includes(':') ? 1 : 0;

                return hasTimeA - hasTimeB; // Within same day, no-time stays at top (or bottom, user choice, but keeping existing preference)
            }

            const factor = sortDirection === 'desc' ? 1 : -1;
            return factor * ((b.priceDiff || 0) - (a.priceDiff || 0));
        });
    }, [data, cityFilter, areaFilter, topFloorFilter, iconFilters, sortDirection, favorites, searchQuery]);

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
        setSearchQuery('');
        setIconFilters({
            bidding: false,
            viewing: false,
            new: false,
            nearby: false,
            favorites: false
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
        stockholmAreas,
        uppsalaAreas,

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
