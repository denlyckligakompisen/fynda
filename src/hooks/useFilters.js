import { useState, useCallback, useMemo } from 'react';
import { parseShowingDate, formatShowingDate } from '../utils/formatters';

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
    const [goodDealOnly, setGoodDealOnly] = useState(false);

    // Icon Filters
    const [iconFilters, setIconFilters] = useState({
        viewing: false,
        new: false,
        monthlyCost: false,
        dealScore: false,
        newest: true,
        viewingSort: false,
        sqmPrice: false
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

            // 2. City Filter
            const matchesCity = source.includes(cityFilter);

            if (!matchesCity) return false;


            // 3. Area Filter (within City)
            if (areaFilter && item.area !== areaFilter) return false;

            // 4. Attributes (Top Floor & Good Deal)
            if (topFloorFilter) {
                if (!source.toLowerCase().includes('top floor')) return false;
            }

            if (goodDealOnly) {
                if (!item.priceDiff || item.priceDiff <= 0) return false;
            }

            // 5. Icon Filters (AND logic)
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

            const calcMonthlyCost = (item) => {
                const price = item.listPrice || item.estimatedValue || 0;
                if (price <= 0) return Infinity;
                const interest = ((((price * 0.85) * 0.01) / 12) * 0.7);
                const fee = item.rent || 0;
                const operating = item.livingArea ? (50 * item.livingArea) / 12 : 0;
                return interest + fee + operating;
            };

            const direction = sortAscending ? 1 : -1;

            if (iconFilters.monthlyCost) {
                const valA = calcMonthlyCost(a);
                const valB = calcMonthlyCost(b);
                return (valA - valB) * direction;
            }

            if (iconFilters.dealScore) {
                const valA = a.priceDiff || 0;
                const valB = b.priceDiff || 0;
                return (valA - valB) * direction;
            }

            if (iconFilters.newest) {
                const valA = new Date(a.published || 0).getTime();
                const valB = new Date(b.published || 0).getTime();
                return (valA - valB) * direction;
            }

            if (iconFilters.viewingSort) {
                const visA = formatShowingDate(a.nextShowing) !== null;
                const visB = formatShowingDate(b.nextShowing) !== null;
                if (visA && !visB) return -1;
                if (!visA && visB) return 1;
                if (!visA && !visB) return 0;
                const valA = parseShowingDate(a.nextShowing).getTime();
                const valB = parseShowingDate(b.nextShowing).getTime();
                return (valA - valB) * direction;
            }

            if (iconFilters.sqmPrice) {
                const valA = a.pricePerSqm || Infinity;
                const valB = b.pricePerSqm || Infinity;
                return (valA - valB) * direction;
            }

            const valA = new Date(a.published || 0).getTime();
            const valB = new Date(b.published || 0).getTime();
            return (valB - valA);
        });
    }, [data, cityFilter, areaFilter, topFloorFilter, goodDealOnly, iconFilters, sortDirection, sortAscending, searchQuery, viewingDateFilter]);

    // Sorted Favorites
    const sortedFavorites = useMemo(() => {
        return data
            .filter(item => favorites.includes(item.url))
            .sort((a, b) => (a.address || '').localeCompare(b.address || '', 'sv'));
    }, [data, favorites]);

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
        if (type === 'monthlyCost' || type === 'dealScore' || type === 'newest' || type === 'viewingSort' || type === 'sqmPrice') {
            setIconFilters(prev => {
                const isCurrentlyActive = prev[type];
                if (isCurrentlyActive) return prev;
                return {
                    ...prev,
                    monthlyCost: type === 'monthlyCost',
                    dealScore: type === 'dealScore',
                    newest: type === 'newest',
                    viewingSort: type === 'viewingSort',
                    sqmPrice: type === 'sqmPrice'
                };
            });
            handleSort(type);
            return;
        }

        setIconFilters(prev => {
            const newVal = !prev[type];
            const updates = { ...prev, [type]: newVal };

            if (type === 'viewing' && !newVal) setViewingDateFilter(null);

            if (type === 'viewing' && newVal) {
                updates.viewingSort = true;
                updates.monthlyCost = false;
                updates.dealScore = false;
                updates.newest = false;
                updates.sqmPrice = false;
                setSortBy('viewingSort');
                setSortDirection('asc');
                setSortAscending(true);
            }

            if (type === 'viewing' && !newVal) {
                updates.viewingSort = false;
                if (goodDealOnly) {
                    updates.dealScore = true;
                    setSortBy('dealScore');
                    setSortDirection('desc');
                    setSortAscending(false);
                } else {
                    updates.newest = true;
                    setSortBy('newest');
                    setSortDirection('desc');
                    setSortAscending(false);
                }
            }

            return updates;
        });
    }, [goodDealOnly]);

    const toggleTopFloor = useCallback(() => setTopFloorFilter(prev => !prev), []);

    const toggleGoodDeal = useCallback(() => {
        setGoodDealOnly(prev => {
            const newState = !prev;
            if (newState) {
                setIconFilters(prevIcons => ({
                    ...prevIcons,
                    dealScore: true,
                    monthlyCost: false,
                    newest: false,
                    viewingSort: false,
                    sqmPrice: false
                }));
                setSortBy('dealScore');
                setSortDirection('desc');
                setSortAscending(false);
            } else {
                setIconFilters(prevIcons => {
                    const updates = { ...prevIcons, dealScore: false };
                    if (prevIcons.viewing) {
                        updates.viewingSort = true;
                        setSortBy('viewingSort');
                        setSortDirection('asc');
                        setSortAscending(true);
                    } else {
                        updates.newest = true;
                        setSortBy('newest');
                        setSortDirection('desc');
                        setSortAscending(false);
                    }
                    return updates;
                });
            }
            return newState;
        });
    }, []);

    const handleSort = useCallback((type) => {
        if (sortBy === type) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
            setSortAscending(prev => !prev);
        } else {
            setSortBy(type);
            if (type === 'sqmPrice' || type === 'monthlyCost' || type === 'viewingSort') {
                setSortAscending(true);
                setSortDirection('asc');
            } else {
                setSortAscending(false);
                setSortDirection('desc');
            }
        }
    }, [sortBy]);

    const clearFilters = useCallback(() => {
        setAreaFilter(null);
        setTopFloorFilter(false);
        setGoodDealOnly(false);
        setSearchQuery('');
        setViewingDateFilter(null);
        setIconFilters({
            viewing: false,
            new: false,
            monthlyCost: false,
            dealScore: false,
            newest: true,
            viewingSort: false,
            sqmPrice: false
        });
    }, []);

    return {
        cityFilter,
        areaFilter,
        searchQuery,
        topFloorFilter,
        goodDealOnly,
        iconFilters,
        viewingDateFilter,
        viewingDates,
        sortBy,
        sortDirection,
        sortAscending,
        filteredData,
        sortedFavorites,
        handleCityClick,
        handleAreaSelect,
        setSearchQuery,
        toggleIconFilter,
        setViewingDateFilter,
        toggleTopFloor,
        toggleGoodDeal,
        handleSort,
        clearFilters
    };
};

export default useFilters;
