import { useState, useRef, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { formatPrice, formatShowingDate, calculateMonthlyCost } from '../utils/formatters';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import HeartBrokenRoundedIcon from '@mui/icons-material/HeartBrokenRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';

/**
 * Individual listing card component
 */
const ListingCard = memo(({ item, isFavorite, toggleFavorite, alwaysShowFavorite }) => {
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
    const daysActive = useMemo(() => {
        if (item.daysActive !== undefined) return item.daysActive;
        if (!item.published) return 0;
        return Math.floor((new Date() - new Date(item.published.replace(' ', 'T'))) / (1000 * 60 * 60 * 24));
    }, [item.daysActive, item.published]);

    const monthlyCost = useMemo(() =>
        calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent, item.livingArea),
        [item.listPrice, item.estimatedValue, item.rent, item.livingArea]);

    const city = useMemo(() =>
        item.city || (item.searchSource && item.searchSource.includes('Uppsala') ? 'Uppsala' : 'Stockholm'),
        [item.city, item.searchSource]);

    const type = "Lägenhet";

    // Features
    const hasLift = false;
    const hasBalcony = false;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
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
                className={`listing-card ${isFavorite ? 'favorite' : ''}`}
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
                            <img
                                src={srcDefault}
                                srcSet={`${src400} 400w, ${src800} 800w`}
                                sizes="(max-width: 600px) 400px, 800px"
                                alt={item.address}
                                className="card-image-main"
                                loading="lazy"
                                decoding="async"
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
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + ', ' + city)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-icon-btn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <LocationOnRoundedIcon fontSize="small" />
                            </a>
                        </div>

                        {/* Favorite Button (Moved here) */}
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
                        {item.rooms && <span>{item.rooms} rum</span>}
                        {item.livingArea && <span>{Math.round(item.livingArea)} m²</span>}
                        {item.floor !== undefined && item.floor !== null && <span>vån {item.floor}</span>}
                        {item.rent !== undefined && item.rent !== null && <span>{formatPrice(item.rent)}/mån</span>}
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
                                        <span>Ränta (1%, 85% lån, efter avdrag):</span>
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
                                    <div className="tooltip-row">
                                        <span>Drift (schablon):</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {!operating && <WarningRoundedIcon sx={{ fontSize: '14px', color: '#fff', opacity: 0.5 }} />}
                                            {formatPrice(operating)}/mån
                                        </span>
                                    </div>
                                    <div className="tooltip-divider"></div>
                                    <div className="tooltip-row total">
                                        <span>Totalt (inkl. amortering):</span>
                                        <span>{formatPrice(totalCost)}/mån</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}



                    <div className="card-footer-row">
                        {daysActive} {daysActive === 1 ? 'dag' : 'dagar'} på Booli
                    </div>
                </div>
            </article>
        </motion.div>
    );
});

export default ListingCard;
