import { useState, useCallback, useMemo } from 'react';
import { parseShowingDate, formatShowingDate, calculateMonthlyCost } from '../utils/formatters';

/**
 * Custom hook for managing filter state
 * @param {Array} data - Raw listing data
 * @returns {Object} Filter state and methods
 */
export const useFilters = (data, favorites = []) => {
    // City and Area Filters
    const [propertyTypeFilter, setPropertyTypeFilter] = useState('Lägenhet');

    // ... existing filters ...
    const [cityFilter, setCityFilter] = useState('Uppsala');
    const [areaFilter, setAreaFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [maxMonthlyCostFilter, setMaxMonthlyCostFilter] = useState(null);
    const [municipalityFilter, setMunicipalityFilter] = useState(null);

    // Attribute Filters
    const [topFloorFilter, setTopFloorFilter] = useState(false);
    const [favoritesOnly, setFavoritesOnly] = useState(false);

    // Icon Filters
    const [iconFilters, setIconFilters] = useState({
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
    const [sortBy, setSortBy] = useState('newest');
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
            const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
            if (date < thirtyMinAgo) return; // Past date (>30m ago)

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

    // Compute dynamic municipalities
    const municipalities = useMemo(() => {
        const mMap = new Set();
        data.forEach(item => {
            const source = item.searchSource || '';
            if (source.includes(cityFilter) && item.municipality) {
                mMap.add(item.municipality);
            }
        });
        return Array.from(mMap).sort();
    }, [data, cityFilter]);

    // Filter and sort data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const source = item.searchSource || '';
            const type = item.objectType || 'Lägenhet';

            // 1. Property Type Filter
            if (propertyTypeFilter === 'Lägenhet') {
                if (!type.includes('Lägenhet')) return false;
            } else if (propertyTypeFilter === 'Hus') {
                if (!type.includes('Hus') && !type.includes('Villa') && !type.includes('Gård')) return false;
            }

            // 2. City Filter
            const matchesCity = source.includes(cityFilter);

            if (!matchesCity) return false;


            // 3. Area Filter (within City)
            if (areaFilter && item.area !== areaFilter) return false;
            
            // 3b. Municipality Filter
            if (municipalityFilter && item.municipality !== municipalityFilter) return false;

            // 4. Attributes (Top Floor & Good Deal)
            if (topFloorFilter) {
                const isTopFloorBySource = source.toLowerCase().includes('top floor');
                const isTopFloorByData = item.floor && item.totalFloors && item.floor === item.totalFloors;

                if (!isTopFloorBySource && !isTopFloorByData) return false;
            }


            if (favoritesOnly && !favorites.includes(item.url)) return false;

            // 5. Icon Filters (AND logic)
            if (iconFilters.viewing && formatShowingDate(item.nextShowing) === null) return false;
            // Use daysActive=0 for new items if isNew is missing
            if (iconFilters.new && (!item.isNew && item.daysActive !== 0)) return false;

            // 5b. Viewing date filter
            if (viewingDateFilter) {
                const showingDate = parseShowingDate(item.nextShowing);
                const dateKey = `${showingDate.getFullYear()}-${String(showingDate.getMonth() + 1).padStart(2, '0')}-${String(showingDate.getDate()).padStart(2, '0')}`;
                if (dateKey !== viewingDateFilter) return false;
            }

            if (maxMonthlyCostFilter !== null) {
                const cost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent);
                if (cost !== null && cost > maxMonthlyCostFilter) return false;
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
                const cost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent);
                return cost !== null ? cost : Infinity;
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


            const valA = new Date(a.published || 0).getTime();
            const valB = new Date(b.published || 0).getTime();
            return (valB - valA);
        });
    }, [data, favorites, cityFilter, areaFilter, topFloorFilter, favoritesOnly, iconFilters, sortDirection, sortAscending, searchQuery, viewingDateFilter, maxMonthlyCostFilter, propertyTypeFilter, municipalityFilter]);

    // Sorted Favorites
    const sortedFavorites = useMemo(() => {
        return data
            .filter(item => favorites.includes(item.url))
            .sort((a, b) => {
                // 1. Sort by Next Showing (Earliest first)
                // Only consider showings that would actually display a badge
                const hasShowingA = formatShowingDate(a.nextShowing) !== null;
                const hasShowingB = formatShowingDate(b.nextShowing) !== null;

                if (hasShowingA && !hasShowingB) return -1;
                if (!hasShowingA && hasShowingB) return 1;

                if (hasShowingA && hasShowingB) {
                    const dateA = parseShowingDate(a.nextShowing);
                    const dateB = parseShowingDate(b.nextShowing);
                    if (dateA.getTime() !== dateB.getTime()) {
                        return dateA.getTime() - dateB.getTime();
                    }
                }

                // 2. Sort by Address A-Z
                return (a.address || '').localeCompare(b.address || '', 'sv');
            });
    }, [data, favorites]);

    // Actions
    const handleCityClick = useCallback((city) => {
        if (cityFilter !== city) {
            setCityFilter(city);
            setAreaFilter(null);
            setMunicipalityFilter(null);
        }
    }, [cityFilter]);

    const handlePropertyTypeClick = useCallback((type) => {
        if (propertyTypeFilter !== type) {
            setPropertyTypeFilter(type);
        }
    }, [propertyTypeFilter]);

    const handleAreaSelect = useCallback((area, city, setExpandedCity) => {
        setCityFilter(city);
        setAreaFilter(area);
        setExpandedCity(null);
    }, []);

    const handleSort = useCallback((type) => {
        if (sortBy !== type) {
            setSortBy(type);
            // Default directions for first selection
            if (type === 'monthlyCost' || type === 'viewingSort') {
                setSortAscending(true);
                setSortDirection('asc');
            } else {
                // dealScore and newest default to highest/newest first
                setSortAscending(false);
                setSortDirection('desc');
            }
        }
    }, [sortBy]);

    const toggleIconFilter = useCallback((type) => {
        if (type === 'monthlyCost' || type === 'dealScore' || type === 'newest' || type === 'viewingSort') {
            setIconFilters(prev => {
                const isCurrentlyActive = prev[type];
                if (isCurrentlyActive) return prev;
                return {
                    ...prev,
                    monthlyCost: type === 'monthlyCost',
                    dealScore: type === 'dealScore',
                    newest: type === 'newest',
                    viewingSort: type === 'viewingSort'
                };
            });
            handleSort(type);
            return;
        }

        setIconFilters(prev => {
            const newVal = !prev[type];
            const updates = { ...prev, [type]: newVal };

            if (type === 'viewing' && !newVal) {
                setViewingDateFilter(null);
            }

            return updates;
        });
    }, [handleSort]);

    const toggleTopFloor = useCallback(() => setTopFloorFilter(prev => !prev), []);


    const toggleFavoritesOnly = useCallback(() => setFavoritesOnly(prev => !prev), []);

    const clearFilters = useCallback(() => {
        setAreaFilter(null);
        setTopFloorFilter(false);
        setFavoritesOnly(false);
        setSearchQuery('');
        setViewingDateFilter(null);
        setMaxMonthlyCostFilter(null);
        setMunicipalityFilter(null);
        setIconFilters({
            viewing: false,
            new: false,
            monthlyCost: false,
            dealScore: false,
            newest: true,
            viewingSort: false
        });
    }, []);

    return {
        cityFilter,
        propertyTypeFilter,
        areaFilter,
        searchQuery,
        topFloorFilter,
        favoritesOnly,
        iconFilters,
        viewingDateFilter,
        viewingDates,
        municipalities,
        municipalityFilter,
        sortBy,
        sortDirection,
        sortAscending,
        filteredData,
        sortedFavorites,
        handleCityClick,
        handlePropertyTypeClick,
        handleAreaSelect,
        setSearchQuery,
        toggleIconFilter,
        setViewingDateFilter,
        toggleTopFloor,
        toggleFavoritesOnly,
        handleSort,
        clearFilters,
        maxMonthlyCostFilter,
        setMaxMonthlyCostFilter,
        setMunicipalityFilter
    };
};

export default useFilters;
