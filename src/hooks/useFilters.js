import { useState, useCallback, useMemo, useEffect } from 'react';
import { parseShowingDate, formatShowingDate, calculateMonthlyCost } from '../utils/formatters';

/**
 * Custom hook for managing filter state
 * @param {Array} data - Raw listing data
 * @returns {Object} Filter state and methods
 */
export const useFilters = (data, favorites = [], analyzedIds = []) => {
    // Read initial search query from URL path and search params
    const initialPath = typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname.substring(1)).trim().replace(/-/g, ' ') : '';
    const isSpecialTab = ['search', 'map', 'info', ''].includes(initialPath.toLowerCase());
    
    // Parse URL Search Params
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlMunicipality = searchParams?.get('municipality') || null;
    const urlArea = searchParams?.get('area') || null;
    const urlQuery = searchParams?.get('q') || '';
    const urlMaxCost = searchParams?.has('maxCost') ? parseInt(searchParams.get('maxCost'), 10) : null;
    const urlFavorites = searchParams?.get('favorites') === 'true';

    const isolatedId = isSpecialTab ? null : initialPath;

    // Area Filters
    const [areaFilter, setAreaFilter] = useState(urlArea);
    const [searchQuery, setSearchQuery] = useState(urlQuery);
    const [maxMonthlyCostFilter, setMaxMonthlyCostFilter] = useState(urlMaxCost);
    const [municipalityFilter, setMunicipalityFilter] = useState(urlMunicipality);

    // Attribute Filters

    const [favoritesOnly, setFavoritesOnly] = useState(urlFavorites);

    // Sync state to URL
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        
        if (municipalityFilter) params.set('municipality', municipalityFilter);
        else params.delete('municipality');
        
        if (areaFilter) params.set('area', areaFilter);
        else params.delete('area');
        
        if (searchQuery) params.set('q', searchQuery);
        else params.delete('q');
        
        if (maxMonthlyCostFilter !== null) params.set('maxCost', maxMonthlyCostFilter.toString());
        else params.delete('maxCost');
        
        if (favoritesOnly) params.set('favorites', 'true');
        else params.delete('favorites');
        
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        
        window.history.replaceState(null, '', newUrl);
    }, [municipalityFilter, areaFilter, searchQuery, maxMonthlyCostFilter, favoritesOnly]);

    // Icon Filters
    const [iconFilters, setIconFilters] = useState({
        viewing: false,
        new: false,
        monthlyCost: false,
        dealScore: false,
        newest: true,
        viewingSort: false,
        lowestPrice: false,
        hasAnalysis: false
    });

    // Viewing date filter (null = all dates)
    const [viewingDateFilter, setViewingDateFilter] = useState(null);

    // Sorting
    const [sortBy, setSortBy] = useState('newest');
    const [sortDirection, setSortDirection] = useState('desc');
    const [activeSortType, setActiveSortType] = useState(null); // which sort is active
    const [sortAscending, setSortAscending] = useState(false); // direction for active sort

    // Compute base filtered data for viewings (all filters EXCEPT viewing-related)
    const baseFilteredDataForViewings = useMemo(() => {
        return data.filter(item => {
            if (areaFilter && item.area?.toLowerCase() !== areaFilter.toLowerCase()) return false;
            if (municipalityFilter && item.municipality?.toLowerCase() !== municipalityFilter.toLowerCase()) return false;
            if (favoritesOnly && !favorites.includes(item.url)) return false;
            if (iconFilters.new && (!item.isNew && item.daysActive !== 0)) return false;
            if (iconFilters.hasAnalysis) {
                const id = String(item.booliId || item.url);
                if (!analyzedIds.includes(id)) return false;
            }
            if (maxMonthlyCostFilter !== null) {
                const cost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent);
                if (cost !== null && cost > maxMonthlyCostFilter) return false;
            }
            if (searchQuery) {
                let query = searchQuery.toLowerCase().trim();
                
                if (query.includes('booli.se/bostad/')) {
                    query = query.split('booli.se/bostad/')[1].split('/')[0].split('?')[0];
                } else if (query.includes('booli.se/annons/')) {
                    query = query.split('booli.se/annons/')[1].split('/')[0].split('?')[0];
                }
                
                const address = (item.address || '').toLowerCase();
                const area = (item.area || '').toLowerCase();
                const municipality = (item.municipality || '').toLowerCase();
                const booliId = String(item.booliId || '').toLowerCase();
                if (!address.includes(query) && !area.includes(query) && !municipality.includes(query) && !booliId.includes(query)) return false;
            }
            return true;
        });
    }, [data, areaFilter, municipalityFilter, favoritesOnly, iconFilters.new, iconFilters.hasAnalysis, maxMonthlyCostFilter, searchQuery, favorites, analyzedIds]);

    // Compute unique viewing dates from listings with viewings in current city
    const viewingDates = useMemo(() => {
        const dateMap = new Map();
        const now = new Date();

        baseFilteredDataForViewings.forEach(item => {
            // No city filter check

            const date = parseShowingDate(item.nextShowing);
            if (date.getFullYear() === 2099) return; // Invalid date
            if (date < now) return; // Past date (already started)

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
    }, [baseFilteredDataForViewings]);

    // Compute dynamic municipalities
    const municipalities = useMemo(() => {
        const mMap = new Set();
        data.forEach(item => {
            if (item.municipality) {
                mMap.add(item.municipality);
            }
        });
        return Array.from(mMap).sort((a, b) => a.localeCompare(b, 'sv'));
    }, [data]);

    // Compute search suggestions (municipalities, areas, and addresses) based on active filters
    const searchSuggestions = useMemo(() => {
        const municipalitiesSet = new Set();
        const areasSet = new Set();
        const addressesSet = new Set();

        data.forEach(item => {
            // Apply main filters so suggestions are relevant
            if (municipalityFilter && item.municipality?.toLowerCase() !== municipalityFilter.toLowerCase()) return;
            if (areaFilter && item.area?.toLowerCase() !== areaFilter.toLowerCase()) return;
            if (favoritesOnly && !favorites.includes(item.url)) return;
            if (maxMonthlyCostFilter !== null) {
                const cost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent);
                if (cost !== null && cost > maxMonthlyCostFilter) return;
            }
            if (iconFilters.new && (!item.isNew && item.daysActive !== 0)) return;
            
            if (item.municipality) municipalitiesSet.add(item.municipality);
            if (item.area) areasSet.add(item.area);
            if (item.address) addressesSet.add(item.address);
        });

        const sortedMunicipalities = Array.from(municipalitiesSet).sort((a, b) => a.localeCompare(b, 'sv'));
        const sortedAreas = Array.from(areasSet).sort((a, b) => a.localeCompare(b, 'sv'));
        const sortedAddresses = Array.from(addressesSet).sort((a, b) => a.localeCompare(b, 'sv'));

        const result = [];
        const seen = new Set();

        [...sortedMunicipalities, ...sortedAreas, ...sortedAddresses].forEach(suggestion => {
            if (!seen.has(suggestion)) {
                seen.add(suggestion);
                result.push(suggestion);
            }
        });

        return result;
    }, [data, municipalityFilter, areaFilter, favoritesOnly, maxMonthlyCostFilter, iconFilters.new, favorites]);

    // Compute min and max possible cost dynamically
    const { minPossibleCost, maxPossibleCost } = useMemo(() => {
        let maxFound = 0;
        let minFound = Infinity;
        data.forEach(item => {
            const cost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent);
            if (cost !== null) {
                if (cost > maxFound) maxFound = cost;
                if (cost < minFound) minFound = cost;
            }
        });
        if (maxFound === 0) return { minPossibleCost: 0, maxPossibleCost: 10000 };
        return {
            minPossibleCost: Math.ceil(minFound / 1000) * 1000,
            maxPossibleCost: Math.ceil(maxFound / 1000) * 1000
        };
    }, [data]);

    // Filter and sort data
    const mapData = useMemo(() => {
        return data.filter(item => {
            const source = item.searchSource || '';
            const type = item.objectType || 'Lägenhet';
            // 3. Area Filter (within City)
            if (areaFilter && item.area?.toLowerCase() !== areaFilter.toLowerCase()) return false;
            
            // 3b. Municipality Filter
            if (municipalityFilter && item.municipality?.toLowerCase() !== municipalityFilter.toLowerCase()) return false;

            // 4. Attributes (Top Floor & Good Deal)



            if (favoritesOnly && !favorites.includes(item.url)) return false;

            // 5. Icon Filters (AND logic)
            if (iconFilters.viewing) {
                if (formatShowingDate(item.nextShowing) === null) return false;
                const showingDate = parseShowingDate(item.nextShowing);
                if (showingDate < new Date()) return false;
            }
            // Use daysActive=0 for new items if isNew is missing
            if (iconFilters.new && (!item.isNew && item.daysActive !== 0)) return false;

            if (iconFilters.hasAnalysis) {
                const id = String(item.booliId || item.url);
                if (!analyzedIds.includes(id)) return false;
            }

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

            // 6. Free text search (Address, Area, or ID)
            if (searchQuery) {
                let query = searchQuery.toLowerCase().trim();
                
                // If the user pasted a full booli URL, extract the ID
                if (query.includes('booli.se/bostad/')) {
                    query = query.split('booli.se/bostad/')[1].split('/')[0].split('?')[0];
                } else if (query.includes('booli.se/annons/')) {
                    query = query.split('booli.se/annons/')[1].split('/')[0].split('?')[0];
                }
                
                const address = (item.address || '').toLowerCase();
                const area = (item.area || '').toLowerCase();
                const municipality = (item.municipality || '').toLowerCase();
                const booliId = String(item.booliId || '').toLowerCase();
                if (!address.includes(query) && !area.includes(query) && !municipality.includes(query) && !booliId.includes(query)) return false;
            }

            return true;
        });
    }, [data, favorites, areaFilter, favoritesOnly, iconFilters, searchQuery, viewingDateFilter, maxMonthlyCostFilter, municipalityFilter, analyzedIds]);

    const filteredData = useMemo(() => {
        let result = mapData;
        if (isolatedId) {
            result = result.filter(item => {
                const booliId = String(item.booliId || '').toLowerCase();
                return booliId.includes(isolatedId.toLowerCase());
            });
        }
        
        return [...result].sort((a, b) => {

            const calcMonthlyCost = (item) => {
                const cost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent);
                return cost !== null ? cost : Infinity;
            };

            const direction = sortAscending ? 1 : -1;

            if (iconFilters.lowestPrice) {
                const valA = a.listPrice || a.estimatedValue;
                const valB = b.listPrice || b.estimatedValue;
                
                const hasA = valA !== undefined && valA !== null && valA !== 0;
                const hasB = valB !== undefined && valB !== null && valB !== 0;
                
                if (!hasA && !hasB) return 0;
                if (!hasA) return 1;
                if (!hasB) return -1;
                
                return (valA - valB) * direction;
            }

            if (iconFilters.monthlyCost) {
                const valA = calcMonthlyCost(a);
                const valB = calcMonthlyCost(b);
                return (valA - valB) * direction;
            }

            if (iconFilters.dealScore) {
                const valA = a.priceDiffPercent || 0;
                const valB = b.priceDiffPercent || 0;
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
    }, [mapData, isolatedId, favorites, areaFilter, favoritesOnly, iconFilters, sortDirection, sortAscending, searchQuery, viewingDateFilter, maxMonthlyCostFilter, municipalityFilter, analyzedIds]);

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
    const handleAreaSelect = useCallback((area, city, setExpandedCity) => {
        setAreaFilter(area);
        setExpandedCity(null);
    }, []);

    const handleSort = useCallback((type) => {
        if (sortBy !== type) {
            setSortBy(type);
            // Default directions for first selection
            if (type === 'monthlyCost' || type === 'viewingSort' || type === 'dealScore' || type === 'lowestPrice') {
                setSortAscending(true);
                setSortDirection('asc');
            } else {
                // newest default to newest first
                setSortAscending(false);
                setSortDirection('desc');
            }
        }
    }, [sortBy]);

    const toggleIconFilter = useCallback((type) => {
        if (type === 'monthlyCost' || type === 'dealScore' || type === 'newest' || type === 'viewingSort' || type === 'lowestPrice') {
            setIconFilters(prev => {
                const isCurrentlyActive = prev[type];
                if (isCurrentlyActive) return prev;
                return {
                    ...prev,
                    monthlyCost: type === 'monthlyCost',
                    dealScore: type === 'dealScore',
                    newest: type === 'newest',
                    viewingSort: type === 'viewingSort',
                    lowestPrice: type === 'lowestPrice'
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




    const toggleFavoritesOnly = useCallback(() => setFavoritesOnly(prev => !prev), []);

    const clearFilters = useCallback(() => {
        setAreaFilter(null);

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
            viewingSort: false,
            lowestPrice: false,
            hasAnalysis: false
        });
    }, []);

    return {
        mapData,
        areaFilter,
        searchQuery,

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
        searchSuggestions,
        analyzedIds,

        handleAreaSelect,
        setSearchQuery,
        toggleIconFilter,
        setViewingDateFilter,

        toggleFavoritesOnly,
        handleSort,
        clearFilters,
        minPossibleCost,
        maxPossibleCost,
        maxMonthlyCostFilter,
        setMaxMonthlyCostFilter,
        setMunicipalityFilter
    };
};

export default useFilters;
