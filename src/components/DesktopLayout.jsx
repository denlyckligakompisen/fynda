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

const DesktopLayout = ({ fetchData, hoveredListingUrl, setHoveredListingUrl, handleMarkerClick, shouldAnimate }) => {
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

    return (
        <PullToRefresh onRefresh={fetchData}>
            <div className="desktop-layout-wrapper">
                {/* Full width header and showings */}
                <div className="desktop-header-area">
                    <TodayShowings data={filteredData} viewingDateFilter={viewingDateFilter} setHoveredListingUrl={setHoveredListingUrl} handleMarkerClick={handleMarkerClick} />
                </div>

                <div className="desktop-split-container">
                    <section className="desktop-list-panel" aria-label="Bostadslista">
                        <div className="desktop-list-inner">
                            <div className="desktop-section-heading" style={{ alignItems: 'center' }}>
                                <h2 className="desktop-section-title">Bostäder</h2>
                                <span className="desktop-section-count">{filteredData.length}</span>
                                <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                                    <SortingControl />
                                </div>
                            </div>
                            <div className="listings-grid">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                                ) : displayData.length > 0 ? (
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
                                    <div className="empty-state">
                                        <div className="empty-state-icon-wrapper">
                                            <span className="empty-state-emoji">🏜️</span>
                                        </div>
                                        <h3 className="empty-state-title">Inga resultat hittades</h3>
                                        <p className="empty-state-description">
                                            Vi hittade inga bostäder{searchQuery ? ` för "${searchQuery}"` : ''} som matchar dina filter. Prova att ändra sökningen.
                                        </p>
                                    </div>
                                )}
                                {displayData.length > 0 && hasMore && <div ref={loadMoreRef} className="load-more-sentinel">...</div>}
                            </div>
                        </div>
                    </section>
                    <aside className="desktop-map-panel" aria-label="Karta">
                        <MapView
                            city="Uppsala"
                            hoveredListingUrl={hoveredListingUrl}
                            onMarkerClick={handleMarkerClick}
                        />
                    </aside>
                </div>
            </div>
        </PullToRefresh>
    );
};

export default DesktopLayout;
