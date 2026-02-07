import { useState, useEffect } from 'react';
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

    // Custom hooks
    const {
        cityFilter,
        areaFilter,
        searchQuery,
        setSearchQuery,
        topFloorFilter,
        iconFilters,
        viewingDateFilter,
        viewingDates,
        sortBy,
        sortDirection,
        filteredData,
        handleCityClick,
        toggleIconFilter,
        toggleTopFloor,
        setViewingDateFilter,
        handleSort,
        clearFilters
    } = useFilters(data, favorites);

    // Save favorites to localStorage
    useEffect(() => {
        localStorage.setItem('fynda_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (url) => {
        setFavorites(prev =>
            prev.includes(url)
                ? prev.filter(u => u !== url)
                : [...prev, url]
        );
    };

    const { visibleCount, loadMoreRef, hasMore } = useInfiniteScroll(
        isLoading,
        filteredData.length,
        20,
        [cityFilter, areaFilter, topFloorFilter, iconFilters]
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

    const renderContent = () => {
        if (isLoading) {
            return Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />);
        }

        switch (activeTab) {
            case 'search':
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
                            isLoading={isLoading}
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
                    </>
                );
            case 'saved':
                const favoriteItems = data.filter(item => favorites.includes(item.url));
                return (
                    <div className="saved-view">
                        {favoriteItems.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon"><span className="material-symbols-outlined">favorite_border</span></div>
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
