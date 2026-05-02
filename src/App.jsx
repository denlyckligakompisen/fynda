import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import HouseIcon from '@mui/icons-material/House';
import ApartmentIcon from '@mui/icons-material/Apartment';
import data from './listing_data.json';
import archivedHouses from './houses_archive.json';
import marketTrends from './uppsala_market_trends.json';

// Components
import ListingCard from './components/ListingCard';
import Navigation from './components/Navigation';
import FilterBar from './components/FilterBar';
import SkeletonCard from './components/SkeletonCard';
import MapView from './components/MapView';

import TabBar from './components/TabBar';
import SearchHeader from './components/SearchHeader';
import GlobalHeader from './components/GlobalHeader';
import ScrollToTop from './components/ScrollToTop';

// Hooks
import useFilters from './hooks/useFilters';
import useInfiniteScroll from './hooks/useInfiniteScroll';

// Auth & Firebase
import { useAuth } from './context/AuthContext';
import { getFavorites, addFavorite, removeFavorite, syncFavorites } from './services/favoritesService';

// Utils
import { formatLastUpdated } from './utils/formatters';

function App() {
    // Merge main data with archived houses, ensuring uniqueness by URL
    const mergedObjects = useMemo(() => {
        const combined = [...(data.objects || []), ...(archivedHouses.objects || [])];
        const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
        return unique;
    }, []);

    const [allData, setAllData] = useState(mergedObjects);
    const [meta, setMeta] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewState, setViewState] = useState('intro');
    const [isScrolled, setIsScrolled] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('fynda_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTab, setActiveTab] = useState('search'); // 'search', 'saved', 'map', 'info'
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
        cityFilter,
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
        propertyTypeFilter,
        handlePropertyTypeClick,
        handleCityClick,
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
        [cityFilter, areaFilter, topFloorFilter, iconFilters, searchQuery, viewingDateFilter]
    );

    // Initial data load and scroll listener
    useEffect(() => {
        const loadData = async () => {
            try {
                // Prioritize fetching the absolute latest data from GitHub Actions
                console.log('Fetching latest data from GitHub...');
                let response;
                try {
                    response = await fetch('https://raw.githubusercontent.com/denlyckligakompisen/fynda/main/src/listing_data.json', {
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

                    const combined = [...validObjects, ...(archivedHouses.objects || [])];
                    const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
                    setAllData(unique);
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

    // Extract unique cities from data for the filter
    const availableCities = useMemo(() => {
        const cities = new Set();
        allData.forEach(item => {
            if (item.city) {
                cities.add(item.city);
            } else if (item.searchSource) {
                // Strip "(top floor)" or other annotations if needed, but for now just take the city part
                const source = item.searchSource.split(' (')[0];
                cities.add(source);
            }
        });
        return Array.from(cities).sort();
    }, [allData]);

    // Extract unique property types (grouped)
    const availablePropertyTypes = useMemo(() => {
        const types = new Set();
        allData.forEach(item => {
            const type = item.objectType || '';
            if (type.includes('Lägenhet')) {
                types.add('Lägenhet');
            } else if (type.includes('Hus') || type.includes('Villa') || type.includes('Gård') || type.includes('Radhus') || type.includes('Kedjehus')) {
                types.add('Hus');
            }
        });
        return Array.from(types).sort().reverse(); // Sort so Lägenhet usually comes first
    }, [allData]);

    // Extract unique search suggestions
    const searchSuggestions = useMemo(() => {
        const suggestions = new Set();
        allData.forEach(item => {
            // Filter by selected city
            if (cityFilter && item.searchSource && !item.searchSource.includes(cityFilter)) {
                return;
            }
            if (item.address) suggestions.add(item.address);
            if (item.area) suggestions.add(item.area);
        });
        return Array.from(suggestions).sort();
    }, [allData, cityFilter]);


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
                                            cityFilter={cityFilter}
                                            cities={availableCities}
                                            handleCityClick={handleCityClick}
                                            propertyTypeFilter={propertyTypeFilter}
                                            propertyTypes={availablePropertyTypes}
                                            handlePropertyTypeClick={handlePropertyTypeClick}
                                            handleSort={handleSort}
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            sortAscending={sortAscending}
                                            isLoading={isLoading}
                                            searchSuggestions={searchSuggestions}
                                            filteredCount={filteredData.length}
                                            totalCount={allData.filter(i => (i.searchSource || '').includes(cityFilter)).length}
                                            clearFilters={clearFilters}
                                            maxMonthlyCostFilter={maxMonthlyCostFilter}
                                            setMaxMonthlyCostFilter={setMaxMonthlyCostFilter}
                                            municipalities={municipalities}
                                            municipalityFilter={municipalityFilter}
                                            setMunicipalityFilter={setMunicipalityFilter}
                                        />

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
                            case 'saved':
                                return (
                                    <div className="saved-view">
                                        {/* Auth Section */}
                                        <div className="auth-section" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
                                            {user ? (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <img
                                                            src={user.photoURL}
                                                            alt=""
                                                            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                                                            decoding="async"
                                                        />
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>{user.displayName}</p>
                                                            <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7 }}>
                                                                {syncStatus === 'synced' ? '✓ Synkas' : syncStatus === 'syncing' ? 'Synkar...' : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={signOut}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.1)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            padding: '6px 12px',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Logga ut
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Logga in för att spara dina favoriter mellan enheter</p>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={signInWithGoogle}
                                                            style={{
                                                                background: '#fff',
                                                                color: '#3c4043',
                                                                border: '1px solid #dadce0',
                                                                borderRadius: '24px',
                                                                padding: '8px 16px 8px 12px',
                                                                fontSize: '0.875rem',
                                                                fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                boxShadow: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                                                            }}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844v.001c-.208 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" fillRule="evenodd" />
                                                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" fillRule="evenodd" />
                                                                <path d="M3.964 10.706a5.41 5.41 0 0 1-.282-1.706c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" fillRule="evenodd" />
                                                                <path d="M9 3.58c1.321 0 2.508.455 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332c.708-2.131 2.692-3.715 5.036-3.715z" fill="#EA4335" fillRule="evenodd" />
                                                            </svg>
                                                            Sign in with Google
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                        {sortedFavorites.length > 0 ? (
                                            <motion.div className="listings-grid" layout>
                                                <AnimatePresence>
                                                    {sortedFavorites.map((item) => (
                                                        <ListingCard
                                                            key={item.url}
                                                            item={item}
                                                            isFavorite={true}
                                                            toggleFavorite={toggleFavorite}
                                                            alwaysShowFavorite={true}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </motion.div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                                <FavoriteBorderRoundedIcon style={{ fontSize: '48px', color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '8px' }}>Inga sparade favoriter än</p>
                                            </div>
                                        )}
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
                                            cityFilter={cityFilter}
                                            cities={availableCities}
                                            handleCityClick={handleCityClick}
                                            propertyTypeFilter={propertyTypeFilter}
                                            propertyTypes={availablePropertyTypes}
                                            handlePropertyTypeClick={handlePropertyTypeClick}
                                            handleSort={handleSort}
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            sortAscending={sortAscending}
                                            isLoading={isLoading}
                                            searchSuggestions={searchSuggestions}
                                            filteredCount={filteredData.length}
                                            totalCount={allData.filter(i => (i.searchSource || '').includes(cityFilter)).length}
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
                                                city={cityFilter}
                                                favorites={favorites}
                                                toggleFavorite={toggleFavorite}
                                                iconFilters={iconFilters}
                                                viewingDateFilter={viewingDateFilter}
                                            />
                                        </div>
                                    </div>
                                );
                            case 'info':
                                const cityStats = {};
                                allData.forEach(item => {
                                    const city = item.city || (item.searchSource ? item.searchSource.split(' (')[0] : 'Okänd');
                                    const type = item.objectType || '';
                                    let category = 'Övrigt';
                                    if (type.includes('Lägenhet')) category = 'Lägenheter';
                                    else if (type.includes('Hus') || type.includes('Villa') || type.includes('Gård') || type.includes('Radhus') || type.includes('Kedjehus')) category = 'Hus';
                                    
                                    if (!cityStats[city]) cityStats[city] = {};
                                    if (!cityStats[city][category]) cityStats[city][category] = 0;
                                    cityStats[city][category]++;
                                });

                                return (
                                    <div className="info-view" style={{ 
                                        padding: '40px 20px', 
                                        maxWidth: '500px', 
                                        margin: '0 auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '24px'
                                    }}>
                                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Systeminsikt</h2>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Realtidsstatistik över tillgängliga objekt</p>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {Object.entries(cityStats).sort().map(([city, categories]) => (
                                                <motion.div 
                                                    key={city} 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{ 
                                                        background: 'var(--bg-card)', 
                                                        padding: '20px', 
                                                        borderRadius: '20px', 
                                                        border: '1px solid var(--border-color)',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    <h3 style={{ 
                                                        margin: '0 0 16px 0', 
                                                        fontSize: '0.8rem', 
                                                        textTransform: 'uppercase', 
                                                        letterSpacing: '1.5px',
                                                        color: 'var(--accent-color)',
                                                        fontWeight: 700
                                                    }}>{city}</h3>
                                                    
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {Object.entries(categories).sort().map(([cat, count]) => (
                                                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    {cat === 'Lägenheter' ? <ApartmentIcon style={{ fontSize: '18px', opacity: 0.7 }} /> : <HouseIcon style={{ fontSize: '18px', opacity: 0.7 }} />}
                                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cat}</span>
                                                                </div>
                                                                <div style={{ 
                                                                    background: 'rgba(255, 255, 255, 0.05)', 
                                                                    padding: '4px 12px', 
                                                                    borderRadius: '20px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: 600
                                                                }}>{count} <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.6 }}>st</span></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div style={{ 
                                            marginTop: '24px', 
                                            textAlign: 'center',
                                            padding: '20px',
                                            borderRadius: '20px',
                                            background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.02))'
                                        }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span style={{ 
                                                    width: '8px', 
                                                    height: '8px', 
                                                    borderRadius: '50%', 
                                                    background: '#10b981',
                                                    boxShadow: '0 0 8px #10b981'
                                                }}></span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)' }}>Live Status</span>
                                            </div>
                                            <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {meta?.crawledAt ? formatLastUpdated(meta.crawledAt) : '-'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Senaste synkningen med Booli</span>
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
