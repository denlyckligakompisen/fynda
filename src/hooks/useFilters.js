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

    // Viewing date filter (null = all dates)
    const [viewingDateFilter, setViewingDateFilter] = useState(null);

    // Sorting
    const [sortBy, setSortBy] = useState('dealScore');
    const [sortDirection, setSortDirection] = useState('desc');

    // Compute unique viewing dates from listings with viewings in current city
    const viewingDates = useMemo(() => {
        const dateMap = new Map();
        const now = new Date();

        data.forEach(item => {
            const source = item.searchSource || '';
            if (!source.includes(cityFilter)) return;
            if (!item.hasViewing || !item.nextShowing) return;

            const date = parseShowingDate(item.nextShowing);
            if (date.getFullYear() === 2099) return; // Invalid date
            if (date < now) return; // Past date

            // Create a date key (YYYY-MM-DD)
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, {
                    key: dateKey,
                    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    count: 0
                });
            }
            dateMap.get(dateKey).count++;
        });

        // Sort by date
        return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
    }, [data, cityFilter]);

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

            // 5b. Viewing date filter
            if (viewingDateFilter && iconFilters.viewing) {
                const showingDate = parseShowingDate(item.nextShowing);
                const dateKey = `${showingDate.getFullYear()}-${String(showingDate.getMonth() + 1).padStart(2, '0')}-${String(showingDate.getDate()).padStart(2, '0')}`;
                if (dateKey !== viewingDateFilter) return false;
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
    }, [data, cityFilter, areaFilter, topFloorFilter, iconFilters, viewingDateFilter, sortDirection, favorites, searchQuery]);

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
        setIconFilters(prev => {
            const newVal = !prev[type];
            // Clear viewing date filter when turning off viewing filter
            if (type === 'viewing' && !newVal) {
                setViewingDateFilter(null);
            }
            return {
                ...prev,
                [type]: newVal
            };
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
        setViewingDateFilter(null);
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
        viewingDateFilter,
        viewingDates,
        sortBy,
        sortDirection,
        filteredData,
        // Actions
        handleCityClick,
        handleAreaSelect,
        setSearchQuery,
        toggleIconFilter,
        toggleTopFloor,
        setViewingDateFilter,
        handleSort,
        clearFilters
    };
};

export default useFilters;
