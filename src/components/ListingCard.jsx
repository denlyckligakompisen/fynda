import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { formatPrice, formatShowingDate, calculateMonthlyCost } from '../utils/formatters';
import {
    CalendarMonthRounded as CalendarMonthRoundedIcon,
    WarningRounded as WarningRoundedIcon,
    BarChartRounded as BarChartRoundedIcon,
    FavoriteRounded as FavoriteRoundedIcon,
    FavoriteBorderRounded as FavoriteBorderRoundedIcon,
    MapRounded as MapRoundedIcon,
    LocationOnRounded as LocationOnRoundedIcon,
    GavelRounded as GavelRoundedIcon,
    InfoOutlined as InfoOutlinedIcon,
    LaunchRounded as LaunchRoundedIcon
} from '@mui/icons-material';
import SmartImage from './SmartImage';

const MonthlyCostTooltip = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculation logic moved from inline
    const price = item.listPrice || item.estimatedValue || 0;
    const isEstimated = !item.listPrice && !!item.estimatedValue;

    const interest = Math.round((((price * 0.85) * 0.02) / 12) * 0.7);
    const grossInterest = Math.round((((price * 0.85) * 0.02) / 12));
    const amortization = Math.round((price * 0.85 * 0.02) / 12);
    const isHouse = item.objectType && !item.objectType.toLowerCase().includes('lägenhet');

    const fee = item.rent || 0;
    const operatingCost = item.operatingCost || 0;

    const hasMissingData = !interest || !amortization || (isHouse ? !operatingCost : !fee);

    // Matches formatter.js logic
    const totalRecurringCosts = fee + operatingCost;

    const displayCost = interest + totalRecurringCosts;
    const totalCost = grossInterest + amortization + totalRecurringCosts;
    const totalCostNet = interest + amortization + totalRecurringCosts;

    return (
        <div
            className={`card-monthly-cost-row has-tooltip ${isOpen ? 'tooltip-open' : ''}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseLeave={() => setIsOpen(false)}
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoOutlinedIcon sx={{ fontSize: '14px', opacity: 0.4 }} />
                {formatPrice(displayCost)}/mån
                {hasMissingData && (
                    <WarningRoundedIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', opacity: 0.5 }} />
                )}
                {isEstimated && (
                    <BarChartRoundedIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', opacity: 0.5 }} />
                )}
            </span>
            <div className="cost-tooltip">
                <div className="tooltip-row">
                    <span>Ränta (2%, 85% lån, efter avdrag):</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isEstimated && <BarChartRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', opacity: 0.5 }} />}
                        {formatPrice(interest)}/mån
                    </span>
                </div>
                <div className="tooltip-row" style={{ marginTop: '4px' }}>
                    <span>Amortering (2%):</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                        {isEstimated && <BarChartRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', opacity: 0.5 }} />}
                        -{formatPrice(amortization)}/mån
                    </span>
                </div>
                <div className="tooltip-row">
                    <span>{isHouse ? 'Driftkostnad:' : 'Avgift:'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isHouse ? (
                            <>
                                {!operatingCost && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', opacity: 0.5 }} />}
                                {formatPrice(operatingCost)}/mån
                            </>
                        ) : (
                            <>
                                {!fee && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', opacity: 0.5 }} />}
                                {formatPrice(fee + operatingCost)}/mån
                            </>
                        )}
                    </span>
                </div>
                <div className="tooltip-divider"></div>
                <div className="tooltip-row total">
                    <span style={{ fontWeight: 'normal' }}>Totalt (före avdrag):</span>
                    <span>{formatPrice(totalCost)}/mån</span>
                </div>
                {isHouse && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="tooltip-row" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                            <span>Lagfart (1,5%):</span>
                            <span>{formatPrice(Math.round(price * 0.015))}</span>
                        </div>
                        <div className="tooltip-row" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                            <span>Pantbrev (2% av nytt lån):</span>
                            <span>0-{formatPrice(Math.round(price * 0.85 * 0.02))}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Individual listing card component
 */
const ListingCard = memo(({ item, isFavorite, toggleFavorite, alwaysShowFavorite, variant = 'list' }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = (e) => {
        // Prevent click from bubbling to map (which would close the popup)
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        window.open(item.url, '_blank');
    };

    // Calculate derived values
    const daysActive = useMemo(() => {
        if (item.daysActive !== undefined) return item.daysActive;
        if (!item.published) return 0;
        return Math.floor((new Date() - new Date(item.published.replace(' ', 'T'))) / (1000 * 60 * 60 * 24));
    }, [item.daysActive, item.published]);

    const monthlyCost = useMemo(() =>
        calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent, item.operatingCost),
        [item.listPrice, item.estimatedValue, item.rent, item.operatingCost]);

    const city = useMemo(() =>
        item.city || (item.searchSource && item.searchSource.includes('Uppsala') ? 'Uppsala' : 'Stockholm'),
        [item.city, item.searchSource]);

    const isTopFloor = useMemo(() => {
        const source = item.searchSource || '';
        const isTopBySource = source.toLowerCase().includes('top floor');
        const isTopByData = item.floor && item.totalFloors && item.floor === item.totalFloors;
        return isTopBySource || isTopByData;
    }, [item.searchSource, item.floor, item.totalFloors]);

    const isHouse = useMemo(() =>
        item.objectType && !item.objectType.toLowerCase().includes('lägenhet'),
        [item.objectType]);

    const type = item.objectType || "Lägenhet";

    // Features
    const hasLift = false;
    const hasBalcony = false;

    // Map variant styles override
    const wrapperStyle = variant === 'map' ? {
        display: 'block',
        borderRadius: '16px',
        overflow: 'hidden',
        width: '100%', // Fill the popup width
        margin: '0',
        boxShadow: 'none'
    } : {
        position: 'relative',
        display: 'block',
        marginBottom: '24px'
    };

    return (
        <motion.div
            layout={variant === 'list'} // Only animate layout changes in list view
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`listing-card-wrapper ${variant}`}
            style={wrapperStyle}
        >
            <article
                className={`listing-card ${isFavorite ? 'favorite' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {/* Image Section */}
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-image-link"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="card-image-container">
                        {(() => {
                            const baseUrl = item.imageUrl?.split('_')[0]; // Get everything before the size suffix
                            if (!baseUrl || !item.imageUrl.includes('bcdn.se')) {
                                return <img src={item.imageUrl || '/placeholder.png'} alt={item.address} className="card-image-main" loading="lazy" decoding="async" />;
                            }

                            // Professional web way: responsive sizes
                            const src400 = `${baseUrl}_400x300.jpg`;
                            const src800 = `${baseUrl}_800x600.jpg`;
                            const srcDefault = `${baseUrl}_800x600.jpg`; // Standard fallback

                            return (
                                <SmartImage
                                    src={srcDefault}
                                    srcSet={`${src400} 400w, ${src800} 800w`}
                                    sizes="(max-width: 600px) 400px, 800px"
                                    alt={item.address}
                                    className="card-image-main"
                                />
                            );
                        })()}


                        {/* Showing Badge (Bottom Left) */}
                        {(() => {
                            const showText = formatShowingDate(item.nextShowing);
                            if (!showText) return null;
                            return (
                                <div className="showing-badge">
                                    <CalendarMonthRoundedIcon style={{ fontSize: '14px' }} />
                                    <span>{showText}</span>
                                </div>
                            );
                        })()}

                        <div className="image-badges-top-right">
                            {!!item.biddingOpen && (
                                <div className="image-badge-bidding">
                                    <span>Budgivning</span>
                                </div>
                            )}
                            {!!isTopFloor && (
                                <div className="image-badge-topfloor">
                                    Högst upp
                                </div>
                            )}
                            {!!item.isSold && (
                                <div className="image-badge-sold">
                                    Såld
                                </div>
                            )}
                        </div>
                    </div>
                </a>

                {/* Content Section */}
                <div className="card-content">
                    <div className="card-header-row">
                        <div className="address-with-icon" style={{ display: 'flex', alignItems: 'baseline', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + ', ' + city)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="card-address-link"
                                onClick={(e) => e.stopPropagation()}
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}
                            >
                                <h3 className="card-address" style={{ margin: 0, display: 'inline', alignItems: 'center' }}>
                                    {item.address}
                                    <LaunchRoundedIcon sx={{ fontSize: '0.85rem', ml: '4px', opacity: 0.4, verticalAlign: 'middle' }} />
                                </h3>
                            </a>
                            <span className="card-area-inline" style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 400, whiteSpace: 'nowrap' }}>
                                {item.area}
                            </span>
                        </div>
                        {item.brfName && (
                            <div className="brf-badge" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '-2px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>
                                {item.brfName}
                            </div>
                        )}

                        {/* Favorite Button */}
                        <button
                            className={`card-favorite-btn ${isFavorite ? 'active' : ''} ${(isFavorite || alwaysShowFavorite) ? 'always-visible' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(item.url);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                        >
                            {isFavorite ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
                        </button>
                    </div>

                    {variant === 'map' && (
                        <div className="card-specs-row map-specs" style={{ marginTop: '2px', marginBottom: '2px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {item.rooms && <span>{item.rooms} rum</span>}
                            {item.livingArea && (
                                <span>
                                    {Math.round(item.livingArea)}
                                    {item.secondaryArea ? `+${Math.round(item.secondaryArea)}` : ''} m²
                                </span>
                            )}
                            {isHouse && item.plotArea > 0 && <span>{item.plotArea.toLocaleString('sv-SE')} m²</span>}
                            {item.floor !== undefined && item.floor !== null && !isHouse && (
                                <span>vån {item.floor}</span>
                            )}
                            {monthlyCost && <span className="map-monthly-cost" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatPrice(monthlyCost)}/mån</span>}
                        </div>
                    )}


                    {variant !== 'map' && (
                        <>
                            <div className="card-price-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.listPrice ? formatPrice(item.listPrice) : 'Pris saknas'}</span>
                                {item.priceDiff !== undefined && item.priceDiff !== null && (
                                    <span className={`price-diff-tag ${item.priceDiff > 0 ? 'positive' : item.priceDiff < 0 ? 'negative' : 'neutral'}`}>
                                        {item.priceDiff > 0 ? '+' : ''}{formatPrice(item.priceDiff)}
                                    </span>
                                )}
                                <span className="card-valuation-row" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    {item.estimatedValue ? formatPrice(item.estimatedValue) : '-'}
                                </span>
                            </div>

                            <div className="card-specs-row">
                                {item.rooms && <span>{item.rooms} rum</span>}
                                {item.livingArea && (
                                    <span>
                                        {Math.round(item.livingArea)}
                                        {item.secondaryArea ? `+${Math.round(item.secondaryArea)}` : ''} m²
                                    </span>
                                )}
                                {isHouse && item.plotArea > 0 && <span>{item.plotArea.toLocaleString('sv-SE')} m²</span>}
                                {item.floor !== undefined && item.floor !== null && !isHouse && (
                                    <span>
                                        vån {item.floor}
                                        {item.totalFloors ? ` av ${item.totalFloors}` : ''}
                                    </span>
                                )}
                                {item.constructionYear && <span>Byggår {item.constructionYear}</span>}
                                {monthlyCost && (
                                    <MonthlyCostTooltip
                                        item={item}
                                        monthlyCost={monthlyCost}
                                    />
                                )}
                            </div>

                            <div className="card-footer-row" style={{ display: 'flex', gap: '6px' }}>
                                <span>{daysActive === 0 ? 'Ny' : `${daysActive} ${daysActive === 1 ? 'dag' : 'dagar'}`}</span>
                                {item.pageViews > 0 && (
                                    <span style={{ color: 'var(--text-tertiary)' }}>
                                        • {item.pageViews.toLocaleString('sv-SE')} visningar
                                    </span>
                                )}
                                {item.tags && item.tags.map((tag, idx) => (
                                    <span key={idx} style={{ color: (tag === 'Gavelläge' || tag === 'Eldstad' || tag === 'Nyproduktion') ? 'var(--nav-item-active)' : 'var(--text-secondary)', fontWeight: (tag === 'Gavelläge' || tag === 'Eldstad') ? 600 : 400 }}>
                                        • {tag}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </article>
        </motion.div >
    );
});

export default ListingCard;
