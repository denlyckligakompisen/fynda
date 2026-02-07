import { useState, useEffect } from 'react';
import dataFile from './listing_data.json';

// Components
import ListingCard from './components/ListingCard';
import Navigation from './components/Navigation';
import FilterBar from './components/FilterBar';
import SkeletonCard from './components/SkeletonCard';
import MapView from './components/MapView';

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
    const [expandedCity, setExpandedCity] = useState(null);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('fynda_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    // Custom hooks
    const {
        cityFilter,
        areaFilter,
        topFloorFilter,
        iconFilters,
        sortBy,
        sortDirection,
        filteredData,
        stockholmAreas,
        uppsalaAreas,
        handleCityClick,
        handleAreaSelect,
        toggleIconFilter,
        toggleTopFloor,
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
        25,
        [cityFilter, areaFilter, topFloorFilter, iconFilters]
    );

    // Initial data load and scroll listener
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch from GitHub raw to get latest daily crawl
                // Adding a cache buster timestamp to ensure we get the absolute latest
                const timestamp = new Date().getTime();
                const response = await fetch(`https://raw.githubusercontent.com/denlyckligakompisen/fynda/main/src/listing_data.json?t=${timestamp}`);

                if (!response.ok) {
                    throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
                }

                const liveData = await response.json();

                if (liveData.objects && liveData.objects.length > 0) {
                    console.log('Successfully fetched live data from GitHub:', liveData.meta?.crawledAt);
                    setData(liveData.objects);
                    setMeta(liveData.meta || null);
                } else {
                    console.warn('Live data from GitHub is empty, falling back to local data');
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
    const displayData = filteredData.slice(0, visibleCount);

    // Header class logic
    let headerClass = 'app-header';
    if (viewState === 'intro') {
        headerClass += ' intro';
    } else {
        headerClass += ' app';
        if (isScrolled) {
            headerClass += ' minimized';
        }
    }

    return (
        <>
            {/* Sticky Header */}
            <header className={headerClass}>
                <div
                    className="header-logo"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    style={{ cursor: 'pointer' }}
                >
                    fynda.
                </div>
            </header>

            <main>
                {/* Navigation */}
                <Navigation
                    cityFilter={cityFilter}
                    areaFilter={areaFilter}
                    expandedCity={expandedCity}
                    setExpandedCity={setExpandedCity}
                    stockholmAreas={stockholmAreas}
                    uppsalaAreas={uppsalaAreas}
                    handleCityClick={handleCityClick}
                    handleAreaSelect={handleAreaSelect}
                    handleSort={handleSort}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    isLoading={isLoading}
                />

                {/* Filter Bar */}
                <div className="nav-container">
                    <div className="view-toggle-container">
                        <button
                            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            Lista
                        </button>
                        <button
                            className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                            onClick={() => setViewMode('map')}
                        >
                            Karta
                        </button>
                    </div>

                    <FilterBar
                        topFloorFilter={topFloorFilter}
                        toggleTopFloor={toggleTopFloor}
                        iconFilters={iconFilters}
                        toggleIconFilter={toggleIconFilter}
                        cityFilter={cityFilter}
                    />
                </div>

                {/* Last Updated Label */}
                <div className="last-updated">
                    {formatLastUpdated(meta?.crawledAt || meta?.generatedAt || dataFile?.meta?.crawledAt)}
                </div>

                {/* Listings */}
                {isLoading ? (
                    Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : viewMode === 'map' ? (
                    <MapView
                        data={filteredData}
                        city={cityFilter}
                        isFavorite={url => favorites.includes(url)}
                        toggleFavorite={toggleFavorite}
                    />
                ) : filteredData.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔎</div>
                        <h3>Inga fynd matchar dina filter</h3>
                        <p>Prova att rensa något filter för att se fler bostäder.</p>
                        <button className="clear-filters-btn" onClick={clearFilters}>
                            Rensa alla filter
                        </button>
                    </div>
                ) : (
                    <>
                        {displayData.map((item) => (
                            <ListingCard
                                key={item.url}
                                item={item}
                                shouldAnimate={shouldAnimate}
                                isFavorite={favorites.includes(item.url)}
                                toggleFavorite={toggleFavorite}
                            />
                        ))}

                        {/* Loading Sentinel */}
                        {hasMore && (
                            <div ref={loadMoreRef} className="load-more-sentinel">
                                ...
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    );
}

export default App;
