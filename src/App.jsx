import { useState, useEffect, useMemo, useRef } from 'react';
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
    const [activeTab, setActiveTab] = useState('search'); // 'search', 'saved', 'map', 'profile'
    const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'synced', null

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

    const toggleFavorite = async (url) => {
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
    };

    const { visibleCount, loadMoreRef, hasMore } = useInfiniteScroll(
        isLoading,
        filteredData.length,
        20,
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

                if (liveData.objects && liveData.objects.length > 0 && hasStockholm && hasUppsala) {
                    // Always use live data if it's valid, regardless of local timestamp
                    // Always use live data if it's valid, regardless of local timestamp
                    setData(liveData.objects);
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
            // Swipe Right -> Prev City (Stockholm)
            handleCityClick('Stockholm');
        }
    };

    const renderContent = () => {
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

                        <div className="listings-grid">
                            {displayData.map((item) => (
                                <ListingCard
                                    key={item.url}
                                    item={item}
                                    shouldAnimate={shouldAnimate}
                                    isFavorite={favorites.includes(item.url)}
                                    toggleFavorite={toggleFavorite}
                                />
                            ))}
                            {hasMore && <div ref={loadMoreRef} className="load-more-sentinel">...</div>}
                        </div>
                    </div>
                );
            case 'saved':
                const favoriteItems = data.filter(item => favorites.includes(item.url));
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
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', color: 'inherit' }}
                                    >
                                        Logga ut
                                    </button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', opacity: 0.8 }}>Logga in för att synka dina favoriter mellan enheter</p>
                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                                        {/* Google Sign-in Button - Official Style */}
                                        <button
                                            onClick={signInWithGoogle}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                padding: '0 16px', height: '44px',
                                                background: '#fff', border: '1px solid #dadce0', borderRadius: '4px',
                                                cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500, color: '#3c4043'
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 18 18">
                                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                                                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042z" />
                                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                                            </svg>
                                            Logga in med Google
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {favoriteItems.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon"><FavoriteBorderRoundedIcon sx={{ fontSize: '48px', color: 'rgba(255,255,255,0.2)' }} /></div>
                                <h3>Inga sparade lägenheter ännu</h3>
                                <p>Tryck på hjärtat på en lägenhet för att spara den.</p>
                            </div>
                        ) : (
                            <div className="listings-grid">
                                {favoriteItems.map((item) => (
                                    <ListingCard
                                        key={item.url}
                                        item={item}
                                        shouldAnimate={false}
                                        toggleFavorite={toggleFavorite}
                                        isFavorite={true}
                                        alwaysShowFavorite={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'map':
                return (
                    <>
                        <SearchHeader
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            topFloorFilter={topFloorFilter}
                            toggleTopFloor={toggleTopFloor}
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
                        />

                        <MapView
                            data={filteredData}
                            city={cityFilter}
                            isFavorite={url => favorites.includes(url)}
                            toggleFavorite={toggleFavorite}
                        />
                    </>
                );
            case 'info':
                return (
                    <div className="info-view">
                        <div className="empty-state">
                            <div className="info-stats">
                                <div className="info-stat-item">
                                    <span className="stat-value">{data.length}</span>
                                    <span className="stat-label">Bostäder totalt</span>
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

                                <div className="info-stat-item" style={{ marginTop: '1rem' }}>
                                    <span className="stat-value">{meta?.crawledAt ? formatLastUpdated(meta.crawledAt) : '-'}</span>
                                    <span className="stat-label">Senast uppdaterad</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`app-container tab-${activeTab}`}>
            {/* Header */}
            <header className="mobile-header">
                {/* Minimal header */}
            </header>

            <main className="main-content">
                {renderContent()}
            </main>

            <TabBar activeTab={activeTab} handleTabChange={handleTabChange} />
        </div>
    );
}

export default App;
