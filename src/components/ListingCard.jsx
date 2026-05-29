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
    LaunchRounded as LaunchRoundedIcon,
    VisibilityRounded as VisibilityRoundedIcon,
    ChevronLeftRounded as ChevronLeftRoundedIcon,
    ChevronRightRounded as ChevronRightRoundedIcon
} from '@mui/icons-material';
import SmartImage from './SmartImage';

import CardContextMenu from './CardContextMenu';

const MonthlyCostTooltip = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculation logic moved from inline
    const price = item.listPrice || item.estimatedValue || 0;
    const isEstimated = !item.listPrice && !!item.estimatedValue;

    const interest = Math.round((((price * 0.9) * 0.02) / 12) * 0.7);
    const grossInterest = Math.round((((price * 0.9) * 0.02) / 12));
    const amortization = Math.round((price * 0.9 * 0.02) / 12);
    const isHouse = item.objectType && !item.objectType.toLowerCase().includes('lägenhet');

    const fee = item.rent || 0;

    const hasMissingData = !interest || !amortization || !fee;

    // Matches formatter.js logic
    const totalRecurringCosts = fee;

    const displayCost = interest + totalRecurringCosts;
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
                    <span>Ränta (2%, 90% lån, efter avdrag):</span>
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
                    <span>Avgift:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!fee && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', opacity: 0.5 }} />}
                        {formatPrice(fee)}/mån
                    </span>
                </div>
                <div className="tooltip-divider"></div>
                <div className="tooltip-row total">
                    <span style={{ fontWeight: 'normal' }}>Totalt (före avdrag):</span>
                    <span>{formatPrice(totalCost)}/mån</span>
                </div>
                <div className="tooltip-row total" style={{ marginTop: '4px' }}>
                    <span style={{ fontWeight: 'normal' }}>Totalt (efter avdrag):</span>
                    <span>{formatPrice(totalCostNet)}/mån</span>
                </div>
                {isHouse && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="tooltip-row" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                            <span>Lagfart (1,5%):</span>
                            <span>{formatPrice(Math.round(price * 0.015))}</span>
                        </div>
                        <div className="tooltip-row" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                            <span>Pantbrev (2% av nytt lån):</span>
                            <span>0-{formatPrice(Math.round(price * 0.9 * 0.02))}</span>
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
    const [imageIndex, setImageIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    let pressTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;
    
    const images = item.images && item.images.length > 0 ? item.images : [item.imageUrl];

    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (imageIndex < images.length - 1) {
            setImageIndex(imageIndex + 1);
        }
    };

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (imageIndex > 0) {
            setImageIndex(imageIndex - 1);
        }
    };
    
    const [isHovered, setIsHovered] = useState(false);

    const booliUrl = item.booliId ? `https://www.booli.se/annons/${item.booliId}` : item.url;

    const handleClick = (e) => {
        // Prevent click from bubbling to map (which would close the popup)
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        if (!isMenuOpen) {
            window.open(booliUrl, '_blank');
        }
    };
    
    const startPress = (e) => {
        if (e.type === 'touchstart') {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
        pressTimer = setTimeout(() => {
            // Long press triggered
            if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
            setIsMenuOpen(true);
        }, 500); // 500ms for long press
    };

    const cancelPress = (e) => {
        if (e && e.type === 'touchmove') {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            // Only cancel if they moved a significant amount (scrolling)
            if (Math.abs(currentX - touchStartX) > 10 || Math.abs(currentY - touchStartY) > 10) {
                clearTimeout(pressTimer);
            }
        } else {
            clearTimeout(pressTimer);
        }
    };

    // Calculate derived values
    const daysActive = useMemo(() => {
        if (!item.published) return 0;
        return Math.floor((new Date() - new Date(item.published.replace(' ', 'T'))) / (1000 * 60 * 60 * 24));
    }, [item.published]);

    const monthlyCost = useMemo(() =>
        calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent),
        [item.listPrice, item.estimatedValue, item.rent]);

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
    
    const pricePerSqm = useMemo(() => {
        if (item.pricePerSqm && item.pricePerSqm > 0) return item.pricePerSqm;
        // Fallback calculation if missing in JSON
        if (item.listPrice && item.livingArea) return item.listPrice / item.livingArea;
        return null;
    }, [item.pricePerSqm, item.listPrice, item.livingArea]);
    


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
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onTouchCancel={cancelPress}
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={(e) => {
                    setIsHovered(false);
                    cancelPress(e);
                }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    WebkitTouchCallout: 'none', // Prevent default iOS text selection/magnifier
                }}
            >
                {/* Image Section */}
                <a
                    href={booliUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-image-link"
                    onClick={(e) => {
                        // Prevent click from bubbling to map
                        e.stopPropagation();
                    }}
                >
                    <div className="card-image-container">
                        {(() => {
                            const currentUrl = images[imageIndex] || item.imageUrl;
                            const baseUrl = currentUrl?.split('_')[0]; // Get everything before the size suffix
                            
                            let imgComponent = (
                                <SmartImage
                                    src={currentUrl || '/placeholder.png'}
                                    alt={item.address}
                                    className="card-image-main"
                                />
                            );
                            
                            return (
                                <>
                                    {imgComponent}
                                    {images.length > 1 && (
                                        <>
                                            {imageIndex > 0 && (
                                                <div className="carousel-btn prev" onClick={prevImage}>
                                                    <ChevronLeftRoundedIcon />
                                                </div>
                                            )}
                                            {imageIndex < images.length - 1 && (
                                                <div className="carousel-btn next" onClick={nextImage}>
                                                    <ChevronRightRoundedIcon />
                                                </div>
                                            )}
                                            <div className="carousel-dots">
                                                {images.map((_, idx) => (
                                                    <span key={idx} className={`carousel-dot ${idx === imageIndex ? 'active' : ''}`} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
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
                            {!!item.upcomingSale && (
                                <div className="image-badge-upcoming">
                                    Kommande
                                </div>
                            )}
                            {(item.tags && item.tags.includes('Nyproduktion')) && (
                                <div className="image-badge-newbuild">
                                    Nyproduktion
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
                                </h3>
                            </a>
                            <span className="card-area-inline" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400, whiteSpace: 'nowrap' }}>
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
                                <span>
                                    vån {item.floor}
                                    {item.totalFloors ? ` av ${item.totalFloors}` : ''}
                                </span>
                            )}
                             {pricePerSqm > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    {(Math.round(pricePerSqm / 1000) * 1000).toLocaleString('sv-SE')} kr/m²
                                </span>
                             )}
                            {monthlyCost && <span className="map-monthly-cost" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatPrice(monthlyCost)}/mån</span>}
                        </div>
                    )}

                    {variant !== 'map' && (
                        <>
                            <div className="card-price-row">
                                <span className="card-price-main">{item.listPrice ? formatPrice(item.listPrice) : 'Pris saknas'}</span>
                                {item.estimatedValue && item.listPrice && (
                                    <span className={`price-diff-tag ${item.estimatedValue > item.listPrice ? 'positive' : item.estimatedValue < item.listPrice ? 'negative' : 'neutral'}`}>
                                        {item.listPrice > item.estimatedValue ? '+' : ''}
                                        {Math.round(((item.listPrice - item.estimatedValue) / item.estimatedValue) * 100)}%
                                    </span>
                                )}
                                <span className="card-valuation-row">
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

                                {monthlyCost && (
                                    <MonthlyCostTooltip
                                        item={item}
                                        monthlyCost={monthlyCost}
                                    />
                                )}
                            </div>

                            <div className="card-footer-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span>{daysActive === 0 ? 'Idag' : `${daysActive} ${daysActive === 1 ? 'dag' : 'dagar'}`}</span>
                                
                                 {pricePerSqm > 0 && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        • {(Math.round(pricePerSqm / 1000) * 1000).toLocaleString('sv-SE')} kr/m²
                                    </span>
                                 )}

                                {item.tenure && (
                                    <span>• {item.tenure}</span>
                                )}

                                {item.pageViews > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }} title={`${item.pageViews} visningar totalt`}>
                                        <VisibilityRoundedIcon sx={{ fontSize: '13px', opacity: 0.7 }} />
                                        {item.pageViews.toLocaleString('sv-SE')} 
                                        {item.pageViewsPerDay > 0 && <span style={{ opacity: 0.8 }}>(+{item.pageViewsPerDay}/dag)</span>}
                                    </span>
                                )}

                                {item.tags && item.tags.map((tag, idx) => (
                                    <span key={idx} style={{ color: (tag === 'Gavelläge' || tag === 'Eldstad' || tag === 'Nyproduktion') ? 'var(--nav-item-active)' : 'var(--text-secondary)', fontWeight: (tag === 'Gavelläge' || tag === 'Eldstad') ? 600 : 400 }}>
                                        • {tag}
                                    </span>
                                ))}
                                {item.constructionYear && (
                                    <span style={{ color: 'var(--text-tertiary)' }}>• {item.constructionYear}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </article>
            
            <CardContextMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                item={item} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
            />
        </motion.div >
    );
});

export default ListingCard;
