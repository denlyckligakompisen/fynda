import React from 'react';
import SearchHeader from './SearchHeader';
import TodayShowings from './TodayShowings';
import PullToRefresh from './PullToRefresh';
import MapView from './MapView';
import SkeletonCard from './SkeletonCard';
import ListingCard from './ListingCard';
import { useFilterContext } from '../context/FilterContext';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

import SortingControl from './SortingControl';

const MobileLayout = ({ activeTab, fetchData, hoveredListingUrl, setHoveredListingUrl, handleMarkerClick, shouldAnimate }) => {
    const { filteredData, favorites, toggleFavorite, isLoading, allData, iconFilters, viewingDateFilter, areaFilter, searchQuery, setSearchQuery } = useFilterContext();

    const { visibleCount, setVisibleCount, loadMoreRef, hasMore } = useInfiniteScroll(
        isLoading,
        filteredData.length,
        20,
        [areaFilter, iconFilters, searchQuery, viewingDateFilter]
    );

    const displayData = filteredData.slice(0, visibleCount);

    React.useEffect(() => {
        const handleEnsureVisible = (e) => {
            const url = e.detail.url;
            const index = filteredData.findIndex(item => item.url === url);
            if (index !== -1 && index >= visibleCount) {
                setVisibleCount(index + 5);
            }
        };
        window.addEventListener('ensure-visible', handleEnsureVisible);
        return () => window.removeEventListener('ensure-visible', handleEnsureVisible);
    }, [filteredData, visibleCount, setVisibleCount]);

    if (isLoading) {
        return Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />);
    }

    return (
        <PullToRefresh onRefresh={fetchData}>
                    <section className="mobile-listings-section" aria-label="Bostadslista">
                        {activeTab === 'map' ? (
                            <div className="mobile-map-section">
                                <MapView
                                    data={filteredData}
                                    hoveredListingUrl={hoveredListingUrl}
                                    setHoveredListingUrl={setHoveredListingUrl}
                                    onMarkerClick={handleMarkerClick}
                                    isLoading={isLoading}
                                />
                            </div>
                        ) : (
                            <>
                        <TodayShowings data={filteredData} viewingDateFilter={viewingDateFilter} setHoveredListingUrl={setHoveredListingUrl} handleMarkerClick={handleMarkerClick} />
                        <div className="mobile-section-heading" style={{ alignItems: 'center' }}>
                            <h2 className="desktop-section-title">Bostäder</h2>
                            <span className="desktop-section-count">{filteredData.length}</span>
                            <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                                <SortingControl />
                            </div>
                        </div>

                        <div className="listings-grid">
                            {displayData.length > 0 ? (
                                displayData.map((item, index) => (
                                    <ListingCard
                                        key={item.url}
                                        item={item}
                                        index={index}
                                        shouldAnimate={shouldAnimate}
                                        isFavorite={favorites.includes(item.url)}
                                        toggleFavorite={toggleFavorite}
                                        setHoveredListingUrl={setHoveredListingUrl}
                                        forceHovered={displayData.length === 1}
                                    />
                                ))
                            ) : (
                                !isLoading && (
                                    <div className="empty-state" style={{ textAlign: 'center', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div className="empty-state-icon-wrapper">
                                            <span className="empty-state-emoji">🏜️</span>
                                        </div>
                                        <h3 className="empty-state-title">Inga resultat hittades</h3>
                                        <p className="empty-state-description">
                                            Vi hittade inga bostäder{searchQuery ? ` för "${searchQuery}"` : ''} som matchar dina filter. Prova att ändra sökningen.
                                        </p>
                                    </div>
                                )
                            )}
                            {displayData.length > 0 && hasMore && <div ref={loadMoreRef} className="load-more-sentinel">...</div>}
                        </div>
                            </>
                        )}
                    </section>
        </PullToRefresh>
    );
};

export default MobileLayout;
