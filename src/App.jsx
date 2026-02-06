import { useState, useEffect } from 'react';
import dataFile from './listing_data.json?v=4';

// Components
import ListingCard from './components/ListingCard';
import Navigation from './components/Navigation';
import FilterBar from './components/FilterBar';
import SkeletonCard from './components/SkeletonCard';

// Hooks
import useFilters from './hooks/useFilters';
import useInfiniteScroll from './hooks/useInfiniteScroll';

// Utils
import { formatLastUpdated } from './utils/formatters';

function App() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewState, setViewState] = useState('intro');
    const [isScrolled, setIsScrolled] = useState(false);
    const [expandedCity, setExpandedCity] = useState(null);
    const [hasAnimated, setHasAnimated] = useState(false);

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
        handleSort
    } = useFilters(data);

    const { visibleCount, loadMoreRef, hasMore } = useInfiniteScroll(
        isLoading,
        filteredData.length,
        25,
        [cityFilter, areaFilter, topFloorFilter, iconFilters]
    );

    // Initial data load and scroll listener
    useEffect(() => {
        const rawObjects = dataFile?.objects || [];
        setData(rawObjects);

        setTimeout(() => setIsLoading(false), 800);

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
                    {formatLastUpdated(dataFile?.meta?.crawledAt || dataFile?.meta?.generatedAt)}
                </div>

                {/* Listings */}
                {isLoading ? (
                    Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    <>
                        {displayData.map((item) => (
                            <ListingCard
                                key={item.url}
                                item={item}
                                shouldAnimate={shouldAnimate}
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
