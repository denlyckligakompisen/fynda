import CountUp from './CountUp';
import { formatPrice } from '../utils/formatters';

/**
 * Individual listing card component
 */
const ListingCard = ({ item, shouldAnimate }) => {
    const areaDisplay = item.area
        ? `${item.area}${item.city ? `, ${item.city}` : ''}`
        : '';

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="listing-link"
        >
            <article className="listing-card">
                {/* Row 1: Header (Address + Icons) */}
                <div className="listing-header">
                    {item.soldPrice && (
                        <div className="sold-price">
                            <img src="/trophy.png" alt="Slutpris" />
                            <span>{formatPrice(item.soldPrice)}</span>
                        </div>
                    )}
                    <div className="address-container">
                        <div className="address-row">
                            <span className="address">
                                {item.address || 'Adress saknas'}
                            </span>
                            <div className="status-icons">
                                {!!item.isNew && (
                                    <img src="/new.png" alt="Nytt" />
                                )}
                                {!!item.hasViewing && (
                                    <img src="/calendar.png" alt="Visning" />
                                )}
                                {!!item.biddingOpen && (
                                    <img src="/bidding.png" alt="Budgivning pågår" className="no-invert" />
                                )}
                            </div>
                        </div>
                        <span className="area-display">{areaDisplay}</span>
                    </div>
                </div>

                {/* Row 1.5: Property Details (Area, Rooms, Fee) */}
                <div className="property-details">
                    {item.rooms && <span>{item.rooms} rum</span>}
                    {item.livingArea && <span>{item.livingArea} m²</span>}
                    {item.rent && item.rent < 15000 && <span>{formatPrice(item.rent).replace(/\s?kr/g, '')} kr/mån</span>}
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
                            {item.walkingTimeMinutes != null ? (item.walkingTimeMinutes > 30 ? '30+' : item.walkingTimeMinutes) : '-'} min
                        </span>
                    </div>
                    <div className="commute-item">
                        <span className="commute-icon">🚌</span>
                        <span>{item.commuteTimeMinutes != null ? item.commuteTimeMinutes : '-'} min</span>
                    </div>
                    <div className="commute-item">
                        <span className="commute-icon">💧</span>
                        <span>{item.waterDistance != null ? `${(item.waterDistance / 1000).toFixed(1)} km` : '-'}</span>
                    </div>
                </div>
            </article>
        </a>
    );
};

export default ListingCard;
