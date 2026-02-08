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
        monthlyCost: false,
        dealScore: false,
        newest: true,
        viewingSort: false
    });

    // Viewing date filter (null = all dates)
    const [viewingDateFilter, setViewingDateFilter] = useState(null);

    // Sorting
    const [sortBy, setSortBy] = useState('dealScore');
    const [sortDirection, setSortDirection] = useState('desc');
    const [activeSortType, setActiveSortType] = useState(null); // which sort is active
    const [sortAscending, setSortAscending] = useState(false); // direction for active sort

    // Compute unique viewing dates from listings with viewings in current city
    const viewingDates = useMemo(() => {
        const dateMap = new Map();
        const now = new Date();

        data.forEach(item => {
            const source = item.searchSource || '';
            if (!source.includes(cityFilter)) return;
            if (!item.nextShowing || !item.nextShowing.fullDateAndTime) return;

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
            // Use nextShowing property directly as hasViewing might be missing
            if (iconFilters.viewing && (!item.nextShowing || !item.nextShowing.fullDateAndTime)) return false;
            // Use daysActive=0 for new items if isNew is missing
            if (iconFilters.new && (!item.isNew && item.daysActive !== 0)) return false;

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
            // Helper function for monthly cost calculation
            const calcMonthlyCost = (item) => {
                if (!item.listPrice || item.listPrice <= 0) return Infinity;
                const interest = ((((item.listPrice * 0.85) * 0.01) / 12) * 0.7);
                const amortization = (item.listPrice * 0.85 * 0.02) / 12;
                const fee = item.rent || 0;
                const operating = item.livingArea ? (50 * item.livingArea) / 12 : 0;
                return interest + amortization + fee + operating;
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

            // 4. Viewing filter sorting (active ONLY when explicitly sorting by viewing)
            if (iconFilters.viewingSort) {
                const dateA = parseShowingDate(a.nextShowing);
                const dateB = parseShowingDate(b.nextShowing);

                // If years are 2099 (no valid date), treat as "last"
                const isValidA = dateA.getFullYear() !== 2099;
                const isValidB = dateB.getFullYear() !== 2099;

                if (isValidA && !isValidB) return -1;
                if (!isValidA && isValidB) return 1;

                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                }
                const hasTimeA = a.nextShowing?.fullDateAndTime?.includes(':') ? 1 : 0;
                const hasTimeB = b.nextShowing?.fullDateAndTime?.includes(':') ? 1 : 0;
                return hasTimeA - hasTimeB;
            }

            // Default: newest first (most recent published date)
            const dateA = new Date(a.published || 0);
            const dateB = new Date(b.published || 0);
            return dateB - dateA;
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
        // Handle sort types specially (toggle direction if already active)
        if (type === 'monthlyCost' || type === 'dealScore' || type === 'newest' || type === 'viewingSort') {
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
                        newest: type === 'newest',
                        viewingSort: type === 'viewingSort'
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

            // Clear viewing date filter when turning off viewing filter
            if (type === 'viewing' && !newVal) {
                setViewingDateFilter(null);
            }

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
        setViewingDateFilter(null);
        setIconFilters({
            bidding: false,
            viewing: false,
            new: false,
            monthlyCost: false,
            dealScore: false,
            newest: true,
            viewingSort: false
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
        sortAscending,
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
