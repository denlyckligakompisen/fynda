import { useState, useRef } from 'react';
import { formatPrice, formatShowingDate, calculateMonthlyCost } from '../utils/formatters';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import HeartBrokenRoundedIcon from '@mui/icons-material/HeartBrokenRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';

/**
 * Individual listing card component
 */
const ListingCard = ({ item, isFavorite, toggleFavorite, alwaysShowFavorite }) => {
    const [translateX, setTranslateX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const isHorizontalSwipe = useRef(null);

    const onTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        isHorizontalSwipe.current = null;
        setIsSwiping(false);
    };

    const onTouchMove = (e) => {
        if (touchStartX.current === null) return;

        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        const diffX = currentX - touchStartX.current;
        const diffY = currentY - touchStartY.current;

        // Determine swipe direction if not yet determined
        if (isHorizontalSwipe.current === null) {
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
                isHorizontalSwipe.current = true;
                setIsSwiping(true);
            } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
                isHorizontalSwipe.current = false;
            }
        }

        // Only handle horizontal swipes to the right
        if (isHorizontalSwipe.current) {
            // Only allow swipe right (positive diffX)
            if (diffX > 0) {
                // Add resistance past a certain point
                const resistance = diffX > 100 ? 100 + (diffX - 100) * 0.2 : diffX;
                setTranslateX(resistance);

                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        }
    };

    const onTouchEnd = () => {
        if (translateX > 80) { // Threshold to trigger action
            toggleFavorite(item.url);
        }

        setTranslateX(0);

        // Reset after a short delay to prevent click triggering immediately after swipe
        setTimeout(() => {
            setIsSwiping(false);
            isHorizontalSwipe.current = null;
            touchStartX.current = null;
            touchStartY.current = null;
        }, 100);
    };

    const handleClick = (e) => {
        if (isSwiping || translateX > 0) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        window.open(item.url, '_blank');
    };

    // Calculate derived values
    const daysActive = item.daysActive !== undefined ? item.daysActive :
        (item.published ? Math.floor((new Date() - new Date(item.published.replace(' ', 'T'))) / (1000 * 60 * 60 * 24)) : 0);

    const monthlyCost = calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent, item.livingArea);

    const city = item.city || (item.searchSource && item.searchSource.includes('Uppsala') ? 'Uppsala' : 'Stockholm');
    const type = "Lägenhet"; // Default for now, as data doesn't seem to have objectType explicitly always

    // Features
    const hasLift = false; // Data missing in snippet, placeholder
    const hasBalcony = false; // Data missing in snippet, placeholder

    return (
        <div
            className="listing-card-wrapper"
            onClick={handleClick}
            style={{ position: 'relative', overflow: 'hidden', display: 'block', borderRadius: '16px', marginBottom: '24px', cursor: 'pointer' }}
        >
            {/* Swipe Action Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                background: isFavorite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: '24px',
                zIndex: 0,
                opacity: translateX > 10 ? Math.min(translateX / 80, 1) : 0,
                transition: 'opacity 0.2s'
            }}>
                <div style={{
                    color: isFavorite ? '#ef4444' : '#4ade80',
                    transform: `scale(${Math.min(1 + (translateX - 50) / 100, 1.5)})`,
                    transition: 'transform 0.2s'
                }}>
                    {isFavorite ? <HeartBrokenRoundedIcon sx={{ fontSize: '32px' }} /> : <FavoriteRoundedIcon sx={{ fontSize: '32px' }} />}
                </div>
            </div>

            <article
                className="listing-card"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: (touchStartX.current === null) ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                    position: 'relative',
                    zIndex: 1,
                    background: 'var(--bg-card)'
                }}
            >
                {/* Image Section */}
                <div className="card-image-container">
                    <img
                        src={item.imageUrl?.replace('1170x0', '600x400') || '/placeholder.png'}
                        alt={item.address}
                        className="card-image-main"
                    />

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
                            <div className="image-badge-showing">
                                <span className="icon" style={{ display: 'flex', alignItems: 'center' }}><CalendarMonthRoundedIcon fontSize="small" /></span>
                                {showText}
                            </div>
                        );
                    })()}

                </div>

                {/* Content Section */}
                <div className="card-content">
                    <div className="card-header-row">
                        <div className="address-with-icon">
                            <h3 className="card-address">{item.address}</h3>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + ', ' + city)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-icon-btn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <PlaceOutlinedIcon fontSize="small" />
                            </a>
                        </div>

                        {/* Favorite Button (Moved here) */}
                        <button
                            className={`card-favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(item.url);
                            }}
                        >
                            {isFavorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
                        </button>
                    </div>

                    <div className="card-location-row">
                        {item.area}
                    </div>



                    <div className="card-price-row">
                        <span>{item.listPrice ? formatPrice(item.listPrice) : 'Utropspris saknas'}</span>
                        {item.priceDiff !== undefined && item.priceDiff !== null && (
                            <span className={`price-diff-tag ${item.priceDiff > 0 ? 'positive' : item.priceDiff < 0 ? 'negative' : 'neutral'}`}>
                                {item.priceDiff > 0 ? '+' : ''}{formatPrice(item.priceDiff)}
                            </span>
                        )}
                        {item.estimatedValue && (
                            <span className="card-valuation-row">
                                {formatPrice(item.estimatedValue)}
                            </span>
                        )}
                    </div>





                    <div className="card-specs-row">
                        <span>{item.rooms || '-'} rum</span>
                        <span>{item.livingArea ? Math.round(item.livingArea) : '-'} m²</span>
                        <span>vån {item.floor || '-'}</span>
                        <span>{item.rent !== undefined ? formatPrice(item.rent) : '- kr'} /mån</span>
                    </div>

                    {monthlyCost && (() => {
                        const price = item.listPrice || item.estimatedValue || 0;
                        const isEstimated = !item.listPrice && !!item.estimatedValue;

                        const interest = Math.round((((price * 0.85) * 0.01) / 12) * 0.7);
                        const amortization = Math.round((price * 0.85 * 0.02) / 12);
                        const operating = item.livingArea ? Math.round((50 * item.livingArea) / 12) : 0;
                        const fee = item.rent || 0;

                        const hasMissingData = !interest || !amortization || !operating || !fee;

                        const displayCost = interest + fee + operating; // Total cost w/o amortization ("living cost")
                        const totalCost = displayCost + amortization;   // Total cost w/ amortization (for tooltip)

                        return (
                            <div className="card-monthly-cost-row has-tooltip">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>Månadskostnad:</span> {formatPrice(displayCost)}
                                    {hasMissingData ? (
                                        <WarningRoundedIcon sx={{ fontSize: '16px', color: '#fb923c' }} />
                                    ) : isEstimated ? (
                                        <InsertChartOutlinedRoundedIcon sx={{ fontSize: '16px', color: '#94a3b8' }} />
                                    ) : null}
                                </span>
                                <div className="cost-tooltip">
                                    <div className="tooltip-row">
                                        <span>Ränta (1%, 85% lån, efter avdrag):</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {isEstimated && <InsertChartOutlinedRoundedIcon sx={{ fontSize: '14px', color: '#94a3b8' }} />}
                                            {formatPrice(interest)}
                                        </span>
                                    </div>
                                    <div className="tooltip-row" style={{ marginTop: '4px' }}>
                                        <span>Amortering (2%):</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80' }}>
                                            {isEstimated && <InsertChartOutlinedRoundedIcon sx={{ fontSize: '14px', color: '#4ade80', opacity: 0.7 }} />}
                                            -{formatPrice(amortization)}
                                        </span>
                                    </div>
                                    <div className="tooltip-row">
                                        <span>Avgift:</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {!fee && <WarningRoundedIcon sx={{ fontSize: '14px', color: '#fb923c' }} />}
                                            {formatPrice(fee)}
                                        </span>
                                    </div>
                                    <div className="tooltip-row">
                                        <span>Drift (schablon):</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {!operating && <WarningRoundedIcon sx={{ fontSize: '14px', color: '#fb923c' }} />}
                                            {formatPrice(operating)}
                                        </span>
                                    </div>
                                    <div className="tooltip-divider"></div>
                                    <div className="tooltip-row total">
                                        <span>Totalt (inkl. amortering):</span>
                                        <span>{formatPrice(totalCost)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="card-tags-row">
                        {item.searchSource?.includes('Top Floor') && <span className="feature-tag">Högst upp</span>}
                        {hasLift && <span className="feature-tag">Hiss</span>}
                        {hasBalcony && <span className="feature-tag">Balkong</span>}
                    </div>

                    <div className="card-footer-row">
                        {daysActive} dagar på Booli
                    </div>
                </div>
            </article>
        </div>
    );
};

export default ListingCard;
