import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import HouseIcon from '@mui/icons-material/House';
import ApartmentIcon from '@mui/icons-material/Apartment';
import data from './listing_data.json';
import marketTrends from './uppsala_market_trends.json';

// Components
import ListingCard from './components/ListingCard';
import FilterBar from './components/FilterBar';
import SkeletonCard from './components/SkeletonCard';
import MapView from './components/MapView';

import TabBar from './components/TabBar';
import SearchHeader from './components/SearchHeader';
import GlobalHeader from './components/GlobalHeader';
import ScrollToTop from './components/ScrollToTop';
import TodayShowings from './components/TodayShowings';

// Hooks
import useFilters from './hooks/useFilters';
import useInfiniteScroll from './hooks/useInfiniteScroll';

// Auth & Firebase
import { useAuth } from './context/AuthContext';
import { getFavorites, addFavorite, removeFavorite, syncFavorites } from './services/favoritesService';

// Utils
import { formatLastUpdated } from './utils/formatters';

function App() {
    // Merge main data (now just the fetched live data, or fallback local data)
    const [allData, setAllData] = useState(data.objects || []);
    const [meta, setMeta] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewState, setViewState] = useState('intro');
    const [isScrolled, setIsScrolled] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('fynda_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTab, setActiveTab] = useState('search'); // 'search', 'map', 'info'
    const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'synced', null

    // No longer forced to high-contrast dark mode
    useEffect(() => {
        // Classes can be added here if needed for light/dark toggle in future
    }, []);

    // Track page views on tab changes
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", page: `/${activeTab}`, title: activeTab.toUpperCase() });
    }, [activeTab]);

    // Auth
    const { user, loading: authLoading, signInWithGoogle, signInWithApple, signOut } = useAuth();

    // Custom hooks
    const {
        areaFilter,
        searchQuery,
        setSearchQuery,
        topFloorFilter,
        favoritesOnly,
        iconFilters,
        viewingDateFilter,
        viewingDates,
        municipalities,
        municipalityFilter,
        setMunicipalityFilter,
        sortBy,
        sortDirection,
        sortAscending,
        filteredData,
        sortedFavorites,

        toggleIconFilter,
        toggleTopFloor,
        toggleFavoritesOnly,
        setViewingDateFilter,
        handleSort,
        clearFilters,
        maxMonthlyCostFilter,
        setMaxMonthlyCostFilter
    } = useFilters(allData, favorites);

    // Save favorites to localStorage (always, as backup)
    useEffect(() => {
        localStorage.setItem('fynda_favorites', JSON.stringify(favorites));
    }, [favorites]);

    // Sync favorites with Firebase when user logs in
    useEffect(() => {
        if (user && !authLoading) {
            setSyncStatus('syncing');
            const localFavorites = JSON.parse(localStorage.getItem('fynda_favorites') || '[]');
            syncFavorites(user.uid, localFavorites)
                .then(merged => {
                    setFavorites(merged);
                    setSyncStatus('synced');
                })
                .catch(() => setSyncStatus(null));
        }
    }, [user, authLoading]);

    const toggleFavorite = useCallback(async (url) => {
        const isAdding = !favorites.includes(url);

        // Optimistic update
        setFavorites(prev =>
            isAdding
                ? [...prev, url]
                : prev.filter(u => u !== url)
        );

        // Sync to cloud if logged in
        if (user) {
            try {
                if (isAdding) {
                    await addFavorite(user.uid, url);
                } else {
                    await removeFavorite(user.uid, url);
                }
            } catch (error) {
                // Revert on error
                setFavorites(prev =>
                    isAdding
                        ? prev.filter(u => u !== url)
                        : [...prev, url]
                );
            }
        }
    }, [favorites, user]);

    const { visibleCount, loadMoreRef, hasMore } = useInfiniteScroll(
        isLoading,
        filteredData.length,
        20,
        [areaFilter, topFloorFilter, iconFilters, searchQuery, viewingDateFilter]
    );

    // Initial data load and scroll listener
    useEffect(() => {
        const loadData = async () => {
            try {
                // Prioritize fetching the absolute latest data from GitHub Actions
                console.log('Fetching latest data from GitHub...');
                let response;
                try {
                    response = await fetch(`https://raw.githubusercontent.com/denlyckligakompisen/fynda/main/src/listing_data.json?t=${Date.now()}`, {
                        cache: 'no-cache'
                    });
                    if (!response.ok) throw new Error('GitHub fetch failed');
                } catch (e) {
                    console.log('GitHub fetch failed, falling back to local data...');
                    response = await fetch('./listing_data.json', { cache: 'no-cache' });
                }

                if (!response.ok) {
                    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
                }

                const liveData = await response.json();

                if (liveData.objects && Array.isArray(liveData.objects) && liveData.objects.length > 0) {
                    // Data Validation
                    const validObjects = liveData.objects.filter(obj =>
                        obj && typeof obj === 'object' && obj.url && obj.address
                    );

                    setAllData(validObjects);
                    setMeta(liveData.meta || null);
                } else {
                    console.warn('Live data from GitHub is incomplete or empty');
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch live data from GitHub:', error.message);
                setIsLoading(false);
            }
        };

        loadData();

        const introTimer = setTimeout(() => {
            setViewState('app');
        }, 2000);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(introTimer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Animation lock
    useEffect(() => {
        if (!isLoading && !hasAnimated) {
            const timer = setTimeout(() => {
                setHasAnimated(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, hasAnimated]);

    const shouldAnimate = !hasAnimated;

    const handleTabChange = (tabId) => {
        if (tabId === 'search' || tabId === 'search_focus') {
            if (activeTab === 'search' || activeTab === 'search_focus') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Fallback for some mobile browsers
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            } else {
                setActiveTab(tabId);
                window.scrollTo(0, 0);
            }
        } else {
            setActiveTab(tabId);
        }
    };
    const displayData = filteredData.slice(0, visibleCount);


    // Extract unique search suggestions
    const searchSuggestions = useMemo(() => {
        const suggestions = new Set();
        allData.forEach(item => {

            if (item.address) suggestions.add(item.address);
            if (item.area) suggestions.add(item.area);
        });
        return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'sv'));
    }, [allData]);


    const renderContent = () => {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    {(() => {
                        switch (activeTab) {
                            case 'search':
                            case 'search_focus':
                                if (isLoading) {
                                    return Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />);
                                }
                                return (
                                    <div
                                        style={{ minHeight: '60vh' }}
                                    >
                                        <SearchHeader
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            topFloorFilter={topFloorFilter}
                                            toggleTopFloor={toggleTopFloor}
                                            favoritesOnly={favoritesOnly}
                                            toggleFavoritesOnly={toggleFavoritesOnly}
                                            iconFilters={iconFilters}
                                            toggleIconFilter={toggleIconFilter}
                                            viewingDateFilter={viewingDateFilter}
                                            viewingDates={viewingDates}
                                            setViewingDateFilter={setViewingDateFilter}

                                            handleSort={handleSort}
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            sortAscending={sortAscending}
                                            isLoading={isLoading}
                                            searchSuggestions={searchSuggestions}
                                            filteredCount={filteredData.length}
                                            totalCount={allData.length}
                                            clearFilters={clearFilters}
                                            maxMonthlyCostFilter={maxMonthlyCostFilter}
                                            setMaxMonthlyCostFilter={setMaxMonthlyCostFilter}
                                            municipalities={municipalities}
                                            municipalityFilter={municipalityFilter}
                                            setMunicipalityFilter={setMunicipalityFilter}
                                        />

                                        <TodayShowings data={filteredData} viewingDateFilter={viewingDateFilter} />

                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 16px 20px' }}>
                                            <h2 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                                                Bostäder
                                            </h2>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                                {filteredData.length} st
                                            </span>
                                        </div>

                                        <div className="listings-grid">
                                            {displayData.length > 0 ? (
                                                displayData.map((item) => (
                                                    <ListingCard
                                                        key={item.url}
                                                        item={item}
                                                        shouldAnimate={shouldAnimate}
                                                        isFavorite={favorites.includes(item.url)}
                                                        toggleFavorite={toggleFavorite}
                                                    />
                                                ))
                                            ) : (
                                                !isLoading && (
                                                    <div style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
                                                        <SearchOffRoundedIcon style={{ fontSize: '48px', color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                                            Inga resultat{searchQuery ? ` för "${searchQuery}"` : ''}
                                                        </p>
                                                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                                            Prova att ändra dina filter
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                            {displayData.length > 0 && hasMore && <div ref={loadMoreRef} className="load-more-sentinel">...</div>}
                                        </div>
                                    </div>
                                );
                            case 'map':
                                return (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <SearchHeader
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            topFloorFilter={topFloorFilter}
                                            toggleTopFloor={toggleTopFloor}
                                            favoritesOnly={favoritesOnly}
                                            toggleFavoritesOnly={toggleFavoritesOnly}
                                            iconFilters={iconFilters}
                                            toggleIconFilter={toggleIconFilter}
                                            viewingDateFilter={viewingDateFilter}
                                            viewingDates={viewingDates}
                                            setViewingDateFilter={setViewingDateFilter}

                                            handleSort={handleSort}
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            sortAscending={sortAscending}
                                            isLoading={isLoading}
                                            searchSuggestions={searchSuggestions}
                                            filteredCount={filteredData.length}
                                            totalCount={allData.length}
                                            clearFilters={clearFilters}
                                            showSorting={false}
                                            maxMonthlyCostFilter={maxMonthlyCostFilter}
                                            setMaxMonthlyCostFilter={setMaxMonthlyCostFilter}
                                            municipalities={municipalities}
                                            municipalityFilter={municipalityFilter}
                                            setMunicipalityFilter={setMunicipalityFilter}
                                        />
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <MapView
                                                data={filteredData}
                                                city="Uppsala"
                                                favorites={favorites}
                                                toggleFavorite={toggleFavorite}
                                                iconFilters={iconFilters}
                                                viewingDateFilter={viewingDateFilter}
                                            />
                                        </div>
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className={`app-container tab-${activeTab} ${isScrolled ? 'is-scrolled' : ''}`}>
            <GlobalHeader 
                activeTab={activeTab} 
                handleTabChange={handleTabChange}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchSuggestions={searchSuggestions}
                user={user}
                signInWithGoogle={signInWithGoogle}
                signOut={signOut}
            />
            <main className="main-content">
                {renderContent()}
            </main>

            <TabBar
                activeTab={activeTab}
                handleTabChange={handleTabChange}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchSuggestions={searchSuggestions}
            />
            <ScrollToTop />
        </div>
    );
}

export default App;
