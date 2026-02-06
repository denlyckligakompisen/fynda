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
                                    {isFavorite ? '❤️' : '🤍'}
                                </button>
                                {!!item.isNew && (
                                    <span title="Nytt" style={{ fontSize: '1.2em' }}>🔥</span>
                                )}
                                {item.daysActive > 50 && (
                                    <span title="Gammalt objekt (50+ dagar)" style={{ fontSize: '1.2em' }}>🧊</span>
                                )}
                                {!!item.biddingOpen && (
                                    <span title="Budgivning pågår" style={{ fontSize: '1.2em' }}>🔨</span>
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
                        <span className="commute-icon">🚶</span>
                        <span>
                            {item.walkingTimeMinutes != null ? (item.walkingTimeMinutes > 30 ? '30+' : item.walkingTimeMinutes) : '-'} <span className="unit">min</span>
                        </span>
                    </div>
                    <div className="commute-item">
                        <span className="commute-icon">🚌</span>
                        <span>{item.commuteTimeMinutes != null ? item.commuteTimeMinutes : '-'} <span className="unit">min</span></span>
                    </div>
                    <div className="commute-item">
                        <span className="commute-icon">💧</span>
                        <span>{item.waterDistance != null ? `${(item.waterDistance / 1000).toFixed(1)}` : '-'} <span className="unit">km</span></span>
                    </div>
                </div>
            </article>
        </a>
    );
};

export default ListingCard;
