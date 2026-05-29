import React from 'react';
import SearchHeader from './SearchHeader';
import TodayShowings from './TodayShowings';
import PullToRefresh from './PullToRefresh';
import MapView from './MapView';
import SkeletonCard from './SkeletonCard';
import ListingCard from './ListingCard';
import { useFilterContext } from '../context/FilterContext';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const DesktopLayout = ({ fetchData, hoveredListingUrl, setHoveredListingUrl, handleMarkerClick, shouldAnimate }) => {
    const { filteredData, favorites, toggleFavorite, isLoading, allData, iconFilters, viewingDateFilter, areaFilter, searchQuery } = useFilterContext();

    const { visibleCount, loadMoreRef, hasMore } = useInfiniteScroll(
        isLoading,
        filteredData.length,
        20,
        [areaFilter, iconFilters, searchQuery, viewingDateFilter]
    );

    const displayData = filteredData.slice(0, visibleCount);

    return (
        <PullToRefresh onRefresh={fetchData}>
            <div className="desktop-layout-wrapper">
                {/* Full width header and showings */}
                <div style={{ padding: '20px 20px 0 20px', maxWidth: '1400px', margin: '0 auto' }}>
                    <SearchHeader />
                    <TodayShowings data={filteredData} viewingDateFilter={viewingDateFilter} />
                </div>

                <div className="desktop-split-container">
                    <div className="desktop-list-panel">
                        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 16px 20px' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                                    Bostäder
                                </h2>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                    {filteredData.length}
                                </span>
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
                                        />
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '100px 20px', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: '120px', height: '120px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                                            <span style={{ fontSize: '48px', filter: 'grayscale(100%) opacity(0.5)' }}>🏜️</span>
                                        </div>
                                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
                                            Inga resultat hittades
                                        </h3>
                                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', maxWidth: '300px', lineHeight: 1.5 }}>
                                            Vi hittade inga bostäder{searchQuery ? ` för "${searchQuery}"` : ''} som matchar dina filter. Prova att ändra sökningen.
                                        </p>
                                    </div>
                                )}
                                {displayData.length > 0 && hasMore && <div ref={loadMoreRef} className="load-more-sentinel">...</div>}
                            </div>
                        </div>
                    </div>
                    <div className="desktop-map-panel">
                        <MapView
                            city="Uppsala"
                            hoveredListingUrl={hoveredListingUrl}
                            onMarkerClick={handleMarkerClick}
                        />
                    </div>
                </div>
            </div>
        </PullToRefresh>
    );
};

export default DesktopLayout;
