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
    InfoOutlined as InfoOutlinedIcon
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
    const fee = item.rent || 0;

    const hasMissingData = !interest || !amortization || !fee;

    const displayCost = interest + fee;
    const totalCost = grossInterest + amortization + fee;
    const totalCostNet = interest + amortization + fee;

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
                <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>Månadskostnad</span> {formatPrice(displayCost)}/mån
                {hasMissingData && (
                    <WarningRoundedIcon sx={{ fontSize: '16px', color: '#fff', opacity: 0.5 }} />
                )}
                {isEstimated && (
                    <BarChartRoundedIcon sx={{ fontSize: '16px', color: '#fff', opacity: 0.5 }} />
                )}
            </span>
            <div className="cost-tooltip">
                <div className="tooltip-row">
                    <span>Ränta (2%, 85% lån, efter avdrag):</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isEstimated && <BarChartRoundedIcon sx={{ fontSize: '14px', color: '#fff', opacity: 0.5 }} />}
                        {formatPrice(interest)}/mån
                    </span>
                </div>
                <div className="tooltip-row" style={{ marginTop: '4px' }}>
                    <span>Amortering (2%):</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80' }}>
                        {isEstimated && <BarChartRoundedIcon sx={{ fontSize: '14px', color: '#fff', opacity: 0.5 }} />}
                        -{formatPrice(amortization)}/mån
                    </span>
                </div>
                <div className="tooltip-row">
                    <span>Avgift:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!fee && <WarningRoundedIcon sx={{ fontSize: '14px', color: '#fff', opacity: 0.5 }} />}
                        {formatPrice(fee)}/mån
                    </span>
                </div>
                <div className="tooltip-divider"></div>
                <div className="tooltip-row total">
                    <span style={{ fontWeight: 'normal' }}>Totalt (före avdrag):</span>
                    <span>{formatPrice(totalCost)}/mån</span>
                </div>
                <div className="tooltip-row total" style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 'normal' }}>Totalt (efter avdrag):</span>
                    <span>{formatPrice(totalCostNet)}/mån</span>
                </div>
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

    const type = "Lägenhet";

    // Features
    const hasLift = false;
    const hasBalcony = false;

    // Map variant styles override
    const wrapperStyle = variant === 'map' ? {
        display: 'block',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        width: '280px', // Fixed width for popup
        margin: '0',    // No margin in popup
        boxShadow: 'none'
    } : {
        position: 'relative',
        overflow: 'hidden',
        display: 'block',
        borderRadius: '16px',
        marginBottom: '24px',
        cursor: 'pointer'
    };

    return (
        <motion.div
            layout={variant === 'list'} // Only animate layout changes in list view
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`listing-card-wrapper ${variant}`}
            onClick={handleClick}
            style={wrapperStyle}
        >
            <article
                className={`listing-card ${isFavorite ? 'favorite' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    background: 'var(--bg-card)'
                }}
            >
                {/* Image Section */}
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

                    {/* Bidding Badge (Top Left) */}
                    {item.biddingOpen && (
                        <div className="image-badge-bidding">
                            <GavelRoundedIcon style={{ fontSize: '14px' }} />
                            <span>Budgivning</span>
                        </div>
                    )}

                    {/* Showing Badge (Bottom Left) -> Top Right in CSS */}
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

                </div>

                {/* Content Section */}
                <div className="card-content">
                    <div className="card-header-row">
                        <div className="address-with-icon">
                            <h3 className="card-address">{item.address}</h3>
                            {variant !== 'map' && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + ', ' + city)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="map-icon-btn"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <LocationOnRoundedIcon fontSize="small" />
                                </a>
                            )}
                        </div>

                        {/* Favorite Button */}
                        <button
                            className={`card-favorite-btn ${isFavorite ? 'active' : ''} ${(isFavorite || alwaysShowFavorite) ? 'always-visible' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(item.url);
                            }}
                        >
                            {isFavorite ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
                        </button>
                    </div>

                    {variant === 'map' && (
                        <div className="card-specs-row map-specs" style={{ marginTop: '4px', marginBottom: '4px', fontSize: '0.85rem' }}>
                            {item.rooms && <span>{item.rooms} rum</span>}
                            {item.livingArea && <span>{Math.round(item.livingArea)} m²</span>}
                            {monthlyCost && <span className="map-monthly-cost">{formatPrice(monthlyCost)}/mån</span>}
                        </div>
                    )}

                    {variant !== 'map' && (
                        <>
                            <div className="card-location-row">
                                {item.area}
                            </div>

                            <div className="card-price-row">
                                <span>{item.listPrice ? formatPrice(item.listPrice) : 'Pris saknas'}</span>
                                {item.priceDiff !== undefined && item.priceDiff !== null && (
                                    <span className={`price-diff-tag ${item.priceDiff > 0 ? 'positive' : item.priceDiff < 0 ? 'negative' : 'neutral'}`}>
                                        {item.priceDiff > 0 ? '+' : ''}{formatPrice(item.priceDiff)}
                                    </span>
                                )}
                                <span className="card-valuation-row">
                                    {item.estimatedValue ? formatPrice(item.estimatedValue) : 'Värdering saknas'}
                                </span>
                            </div>

                            <div className="card-specs-row">
                                {item.rooms && <span>{item.rooms} rum</span>}
                                {item.livingArea && <span>{Math.round(item.livingArea)} m²</span>}
                                <span>
                                    vån {item.floor !== undefined && item.floor !== null ? item.floor : '-'}
                                    {item.totalFloors ? ` av ${item.totalFloors}` : (item.floor !== undefined && item.floor !== null ? '' : ' av -')}
                                </span>
                                {item.listPrice && item.livingArea && (
                                    <span>
                                        {formatPrice(Math.round((item.listPrice / item.livingArea) / 1000) * 1000)} kr/m²
                                    </span>
                                )}
                            </div>

                            {monthlyCost && (
                                <MonthlyCostTooltip
                                    item={item}
                                    monthlyCost={monthlyCost}
                                />
                            )}

                            <div className="card-footer-row">
                                {daysActive} {daysActive === 1 ? 'dag' : 'dagar'} på Booli
                            </div>
                        </>
                    )}
                </div>
            </article>
        </motion.div>
    );
});

export default ListingCard;
