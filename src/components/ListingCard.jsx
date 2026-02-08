import CountUp from './CountUp';
import { formatPrice, formatShowingDate, calculateMonthlyCost } from '../utils/formatters';

/**
 * Individual listing card component
 */
const ListingCard = ({ item, isFavorite, toggleFavorite, alwaysShowFavorite }) => {
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="listing-card-link"
        >
            <article className="listing-card">
                <div className="card-image-wrapper">
                    <img
                        src={item.imageUrl?.replace('1170x0', '350x0') || '/placeholder.png'}
                        alt={item.address}
                        className="card-image"
                    />
                    {(() => {
                        let daysOld = null;
                        if (item.published) {
                            const pubDate = new Date(item.published.replace(' ', 'T'));
                            const now = new Date();
                            daysOld = Math.floor((now - pubDate) / (1000 * 60 * 60 * 24));
                        }
                        if (daysOld !== null && daysOld >= 0) {
                            return (
                                <div className="new-badge">
                                    {daysOld === 1 ? '1 dag' : `${daysOld} dagar`}
                                </div>
                            );
                        }
                        return null;
                    })()}
                    {!!item.searchSource?.toLowerCase().includes('top floor') && (
                        <div className="top-floor-badge">Högst upp</div>
                    )}
                    {!!item.biddingOpen && (
                        <div className="bidding-badge">Budgivning</div>
                    )}
                    {!!(item.nextShowing && formatShowingDate(item.nextShowing)) && (
                        <div className="showing-indicator">
                            {formatShowingDate(item.nextShowing).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="card-details">
                    <div className="card-header">
                        <h3 className="card-address">
                            {item.address || 'Adress saknas'}
                            {item.area && <span className="card-area"> {item.area}</span>}
                        </h3>
                        <button
                            className={`favorite-btn-overlay ${isFavorite ? 'active' : ''} ${alwaysShowFavorite ? 'always-visible' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(item.url);
                            }}
                        >
                            <span className="material-symbols-outlined favorite-icon">
                                favorite
                            </span>
                        </button>
                    </div>

                    <div className="card-info">
                        {item.priceDiff !== undefined && item.priceDiff !== null ? (
                            <div className={`price-diff ${item.priceDiff > 0 ? 'positive' : item.priceDiff < 0 ? 'negative' : 'neutral'}`}>
                                {item.priceDiff > 0 ? '+' : ''}{formatPrice(item.priceDiff)}
                            </div>
                        ) : (
                            <div className="price-diff neutral">
                                -
                            </div>
                        )}
                        <div className="price-row">
                            <span className="list-price">{item.listPrice ? formatPrice(item.listPrice) : 'Utropspris saknas'}</span>
                            {item.estimatedValue && (
                                <span className="estimated-value">
                                    {formatPrice(item.estimatedValue)}
                                </span>
                            )}
                        </div>
                        <div className="metrics-row">
                            {item.rooms && <span>{item.rooms} rum</span>}
                            {item.livingArea && <span>{Math.round(item.livingArea)} m²</span>}
                            {item.floor && <span>vån {item.floor}</span>}
                            {item.pricePerSqm && <span>{formatPrice(item.pricePerSqm)}/m²</span>}
                        </div>
                        {(() => {
                            const price = item.listPrice || 0;
                            const interest = Math.round(((((price * 0.85) * 0.01) / 12) * 0.7));
                            const amortization = Math.round((price * 0.85 * 0.02) / 12);
                            const fee = item.rent || 0;
                            const operating = item.livingArea ? Math.round((50 * item.livingArea) / 12) : 0;
                            const totalWithoutAmortization = interest + fee + operating;
                            const totalWithAmortization = totalWithoutAmortization + amortization;
                            const hasMissingData = price === 0 || fee === 0 || operating === 0;

                            return (
                                <div className="monthly-cost-row">
                                    <span className="monthly-cost-label">Månadskostnad:</span>
                                    <span className="monthly-cost-value">
                                        {hasMissingData && <span className="monthly-cost-warning" title="Data saknas">⚠️</span>}
                                        {formatPrice(totalWithoutAmortization)}
                                    </span>
                                    <div className="monthly-cost-tooltip">
                                        <div className={`tooltip-row ${price === 0 ? 'tooltip-warning' : ''}`}>
                                            <span>Ränta (1%, 85% lån, efter avdrag)</span>
                                            <span>
                                                {price === 0 && <span className="warning-icon" title="Utropspris saknas">⚠️</span>}
                                                {formatPrice(interest)}
                                            </span>
                                        </div>
                                        <div className={`tooltip-row tooltip-amortization ${price === 0 ? 'tooltip-warning' : ''}`}>
                                            <span>Amortering (2%)</span>
                                            <span>
                                                {price === 0 && <span className="warning-icon" title="Utropspris saknas">⚠️</span>}
                                                {amortization === 0 ? '- kr' : `-${formatPrice(amortization)}`}
                                            </span>
                                        </div>
                                        <div className={`tooltip-row ${fee === 0 ? 'tooltip-warning' : ''}`}>
                                            <span>Avgift</span>
                                            <span>
                                                {fee === 0 && <span className="warning-icon" title="Avgift saknas">⚠️</span>}
                                                {formatPrice(fee)}
                                            </span>
                                        </div>
                                        <div className={`tooltip-row ${operating === 0 ? 'tooltip-warning' : ''}`}>
                                            <span>Drift (50 kr/m²/år)</span>
                                            <span>
                                                {operating === 0 && <span className="warning-icon" title="Bostadsarea saknas">⚠️</span>}
                                                {formatPrice(operating)}
                                            </span>
                                        </div>
                                        <div className="tooltip-row tooltip-total">
                                            <span>Totalt (inkl. amortering)</span>
                                            <span>{formatPrice(totalWithAmortization)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="card-footer">
                        <button className="share-btn">
                            <span className="material-symbols-outlined">ios_share</span>
                        </button>
                    </div>
                </div>
            </article>
        </a>
    );
};

export default ListingCard;
