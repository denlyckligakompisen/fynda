import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import dataFile from './listing_data.json';

// Components
import ListingCard from './components/ListingCard';
import Navigation from './components/Navigation';
import FilterBar from './components/FilterBar';
import SkeletonCard from './components/SkeletonCard';
import MapView from './components/MapView';

import TabBar from './components/TabBar';
import SearchHeader from './components/SearchHeader';

// Hooks
import useFilters from './hooks/useFilters';
import useInfiniteScroll from './hooks/useInfiniteScroll';

// Auth & Firebase
import { useAuth } from './context/AuthContext';
import { getFavorites, addFavorite, removeFavorite, syncFavorites } from './services/favoritesService';

// Utils
import { formatLastUpdated } from './utils/formatters';

function App() {
    const [data, setData] = useState([]);
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
        toggleIconFilter,
        toggleTopFloor,
        toggleGoodDeal,
        setViewingDateFilter,
        handleSort,
        clearFilters
    } = useFilters(data, favorites);

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
        15,
        [cityFilter, areaFilter, topFloorFilter, goodDealOnly, iconFilters, searchQuery, viewingDateFilter]
    );

    // Initial data load and scroll listener
    useEffect(() => {
        const loadData = async () => {
            // In development, prioritize local data so we can see local changes (like image extraction)
            // without waiting for a GitHub Action to deploy.
            if (import.meta.env.DEV) {
                console.log('Previewing local data (Development Mode)');
                setData(dataFile?.objects || []);
                setMeta(dataFile?.meta || null);
                setIsLoading(false);
                return;
            }

            try {
                // Fetch from GitHub raw to get latest daily crawl
                // Adding a cache buster timestamp to ensure we get the absolute latest
                const timestamp = new Date().getTime();
                const response = await fetch(`https://raw.githubusercontent.com/denlyckligakompisen/fynda/main/src/listing_data.json?t=${timestamp}`);

                if (!response.ok) {
                    throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
                }

                const liveData = await response.json();

                const hasStockholm = liveData.objects?.some(obj => (obj.searchSource || '').includes('Stockholm'));
                const hasUppsala = liveData.objects?.some(obj => (obj.searchSource || '').includes('Uppsala'));

                if (liveData.objects && Array.isArray(liveData.objects) && liveData.objects.length > 0 && hasStockholm && hasUppsala) {
                    // Data Validation (Security Point 4: Data Handling)
                    // Ensure we only process valid objects with a URL and address
                    const validObjects = liveData.objects.filter(obj =>
                        obj && typeof obj === 'object' && obj.url && obj.address
                    );

                    setData(validObjects);
                    setMeta(liveData.meta || null);
                } else {
                    console.warn('Live data from GitHub is incomplete or empty, falling back to local data');
                    setData(dataFile?.objects || []);
                    setMeta(dataFile?.meta || null);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch live data from GitHub:', error.message);
                setData(dataFile?.objects || []);
                setMeta(dataFile?.meta || null);
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
        if (tabId === 'search') {
            if (activeTab === 'search') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Fallback for some mobile browsers
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            } else {
                setActiveTab('search');
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
        data.forEach(item => {
            // Filter by selected city
            if (cityFilter && item.searchSource && !item.searchSource.includes(cityFilter)) {
                return;
            }
            if (item.address) suggestions.add(item.address);
            if (item.area) suggestions.add(item.area);
        });
        return Array.from(suggestions).sort();
    }, [data, cityFilter]);

    // Global Swipe Helpers
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;

        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && cityFilter === 'Stockholm') {
            // Swipe Left -> Next City (Uppsala)
            handleCityClick('Uppsala');
        }

        if (isRightSwipe && cityFilter === 'Uppsala') {
            // Swipe Right            handleCityClick('Stockholm');
        }
    };

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
                                if (isLoading) {
                                    return Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />);
                                }
                                return (
                                    <div
                                        onTouchStart={onTouchStart}
                                        onTouchMove={onTouchMove}
                                        onTouchEnd={onTouchEnd}
                                        style={{ minHeight: '60vh' }}
                                    >
                                        <SearchHeader
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            topFloorFilter={topFloorFilter}
                                            toggleTopFloor={toggleTopFloor}
                                            goodDealOnly={goodDealOnly}
                                            toggleGoodDeal={toggleGoodDeal}
                                            iconFilters={iconFilters}
                                            toggleIconFilter={toggleIconFilter}
                                            viewingDateFilter={viewingDateFilter}
                                            viewingDates={viewingDates}
                                            setViewingDateFilter={setViewingDateFilter}
                                            cityFilter={cityFilter}
                                            handleCityClick={handleCityClick}
                                            handleSort={handleSort}
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            sortAscending={sortAscending}
                                            isLoading={isLoading}
                                            searchSuggestions={searchSuggestions}
                                        />

                                        <motion.div className="listings-grid" layout>
                                            <AnimatePresence>
                                                {displayData.map((item) => (
                                                    <ListingCard
                                                        key={item.url}
                                                        item={item}
                                                        shouldAnimate={shouldAnimate}
                                                        isFavorite={favorites.includes(item.url)}
                                                        toggleFavorite={toggleFavorite}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                            {hasMore && <div ref={loadMoreRef} className="load-more-sentinel">...</div>}
                                        </motion.div>
                                    </div>
                                );
                            case 'saved':
                                return (
                                    <div className="saved-view">
                                        {/* Auth Section */}
                                        <div className="auth-section" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px' }}>
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
                                                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Logga in för att spara dina favoriter permanent.</p>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={signInWithGoogle}
                                                            style={{
                                                                background: '#fff',
                                                                color: '#000',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            Google
                                                        </button>
                                                        <button
                                                            onClick={signInWithApple}
                                                            style={{
                                                                background: '#000',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '8px 16px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            Apple
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Dina sparade objekt</h2>
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
                                            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                                                <FavoriteBorderRoundedIcon style={{ fontSize: '48px', color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                                                <p style={{ color: 'var(--text-secondary)' }}>Inga sparade favoriter än.</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            case 'map':
                                return (
                                    <MapView
                                        data={filteredData}
                                        city={cityFilter}
                                        favorites={favorites}
                                        toggleFavorite={toggleFavorite}
                                    />
                                );
                            case 'info':
                                return (
                                    <div className="info-view" style={{ padding: '20px' }}>
                                        <h2>Profil & Info</h2>
                                        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                                            <p style={{ color: 'var(--text-secondary)' }}>
                                                Fynda hjälper dig att hitta de bästa bostadskapen i Uppsala och Stockholm.
                                                We analyze data from Booli to find properties that are below market value.
                                            </p>
                                        </div>

                                        <div className="secondary-stats-row" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem' }}>
                                            <div className="info-stat-item">
                                                <span className="stat-value" style={{ fontSize: '1.5rem' }}>
                                                    {data.filter(i => (i.searchSource || '').includes('Stockholm')).length}
                                                </span>
                                                <span className="stat-label" style={{ fontSize: '0.65rem' }}>i Stockholm</span>
                                            </div>
                                            <div className="info-stat-item">
                                                <span className="stat-value" style={{ fontSize: '1.5rem' }}>
                                                    {data.filter(i => (i.searchSource || '').includes('Uppsala')).length}
                                                </span>
                                                <span className="stat-label" style={{ fontSize: '0.65rem' }}>i Uppsala</span>
                                            </div>
                                        </div>

                                        <div className="info-stat-item" style={{ marginTop: '2rem', textAlign: 'center' }}>
                                            <span className="stat-value" style={{ display: 'block', fontSize: '1.2rem' }}>{meta?.crawledAt ? formatLastUpdated(meta.crawledAt) : '-'}</span>
                                            <span className="stat-label">Senast uppdaterad</span>
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
        <div className={`app-container tab-${activeTab}`}>
            <main className="main-content">
                {renderContent()}
            </main>

            <TabBar activeTab={activeTab} handleTabChange={handleTabChange} />
        </div>
    );
}

export default App;
