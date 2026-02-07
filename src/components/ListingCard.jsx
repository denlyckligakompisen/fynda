import CountUp from './CountUp';
import { formatPrice, formatShowingDate } from '../utils/formatters';

/**
 * Individual listing card component
 */
const ListingCard = ({ item, shouldAnimate, isFavorite, toggleFavorite }) => {
    const areaDisplay = item.area
        ? `${item.area}${item.city ? `, ${item.city}` : ''}`
        : '';

    const showingStatus = formatShowingDate(item.nextShowing);

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="listing-link"
        >
            <article className="listing-card">
                {showingStatus && (
                    <div className="showing-badge">
                        {showingStatus}
                    </div>
                )}
                {/* Row 1: Header (Address + Icons) */}
                <div className="listing-header">
                    <div className="address-container">
                        <div className="address-row">
                            <span className="address">
                                {item.address || 'Adress saknas'}
                            </span>
                            <div className="status-icons">
                                <button
                                    className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite(item.url);
                                    }}
                                    title={isFavorite ? "Ta bort från favoriter" : "Spara som favorit"}
                                >
                                    {isFavorite ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                    ) : (
                                        <span className="material-symbols-outlined">favorite_border</span>
                                    )}
                                </button>
                                {!!item.isNew && (
                                    <span title="Nytt" className="material-symbols-outlined" style={{ fontSize: '1.2em', color: '#ff5722' }}>whatshot</span>
                                )}
                                {item.daysActive > 50 && (
                                    <span title="Gammalt objekt (50+ dagar)" className="material-symbols-outlined" style={{ fontSize: '1.2em', color: '#64b5f6' }}>ac_unit</span>
                                )}
                                {!!item.biddingOpen && (
                                    <span title="Budgivning pågår" className="material-symbols-outlined" style={{ fontSize: '1.2em', color: '#795548' }}>gavel</span>
                                )}
                            </div>
                        </div>
                        <span className="area-display">{areaDisplay}</span>
                    </div>
                </div>

                {/* Row 1.5: Property Details (Area, Rooms, Fee) */}
                <div className="property-details">
                    {item.rooms && <span>{item.rooms} <span className="unit">rum</span></span>}
                    {item.livingArea && <span>{item.livingArea} <span className="unit">m²</span></span>}
                    {item.rent && <span>{formatPrice(item.rent).replace(/\s?kr/g, '')} <span className="unit">kr/mån</span></span>}
                    {item.listPrice && item.livingArea && (
                        <span>{formatPrice(Math.round(item.listPrice / item.livingArea)).replace(/\s?kr/g, '')} <span className="unit">kr/m²</span></span>
                    )}
                </div>

                {/* Row 2: HERO Metric (Price Difference) */}
                {item.listPrice && (
                    <div className="hero-metric">
                        <div className="price-diff-container">
                            <span className={`price-diff ${item.priceDiff < 0 ? 'negative' : 'positive'}`}>
                                {item.priceDiff > 0 ? '+' : ''}<CountUp end={item.priceDiff} animate={shouldAnimate} />
                            </span>
                            {item.priceDiffPercent && (
                                <span className={`price-diff-percent ${item.priceDiff < 0 ? 'negative' : 'positive'}`}>
                                    {Math.round(item.priceDiffPercent)}%
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Row 3: Secondary Metrics (List Price & Valuation) */}
                <div className="secondary-metrics-grid">
                    <div>
                        <div className="metric-label">Utropspris</div>
                        <div className="metric-value">{formatPrice(item.listPrice)}</div>
                    </div>
                    <div>
                        <div className="metric-label">Värdering</div>
                        <div className="metric-value">{formatPrice(item.estimatedValue)}</div>
                    </div>
                </div>

                {/* Row 4: Commute Info */}
                <div className="commute-info">
                    <div className="commute-item">
                        <span className="commute-icon material-symbols-outlined">directions_walk</span>
                        <span>
                            {item.walkingTimeMinutes != null ? (item.walkingTimeMinutes > 30 ? '30+' : item.walkingTimeMinutes) : '-'} <span className="unit">min</span>
                        </span>
                    </div>
                    <div className="commute-item">
                        <span className="commute-icon material-symbols-outlined">directions_bus</span>
                        <span>{item.commuteTimeMinutes != null ? item.commuteTimeMinutes : '-'} <span className="unit">min</span></span>
                    </div>
                    <div className="commute-item">
                        <span className="commute-icon material-symbols-outlined">water_drop</span>
                        <span>{item.waterDistance != null ? `${(item.waterDistance / 1000).toFixed(1)}` : '-'} <span className="unit">km</span></span>
                    </div>
                </div>
            </article>
        </a>
    );
};

export default ListingCard;
