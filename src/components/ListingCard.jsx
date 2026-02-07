import CountUp from './CountUp';
import { formatPrice, formatShowingDate } from '../utils/formatters';

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
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.address}
                        className="card-image"
                    />
                    {item.isNew && (
                        <div className="new-badge">Nytt</div>
                    )}
                    {item.nextShowing && (
                        <div className="showing-indicator">VISNING IDAG</div>
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
                        <div className="price-row">{formatPrice(item.listPrice)}</div>
                        <div className="metrics-row">
                            {item.livingArea && <span>{item.livingArea} m²</span>}
                            {item.rooms && <span>{item.rooms} rum</span>}
                            {item.rent && <span>{formatPrice(item.rent)}/mån</span>}
                            {item.pricePerSqm && <span>{formatPrice(item.pricePerSqm)}/m²</span>}
                        </div>
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
