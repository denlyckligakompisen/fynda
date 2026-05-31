import { useState, useMemo, memo, useEffect, useRef } from 'react';
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
    ChevronRightRounded as ChevronRightRoundedIcon,
    ApartmentRounded as ApartmentRoundedIcon
} from '@mui/icons-material';
import SmartImage from './SmartImage';
import CardContextMenu from './CardContextMenu';
import styles from './ListingCard.module.css';

const MonthlyCostTooltip = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculation logic moved from inline
    const price = item.listPrice || item.estimatedValue || 0;
    const isEstimated = !item.listPrice && !!item.estimatedValue;

    const interest = Math.round((((price * 0.9) * 0.03) / 12) * 0.7);
    const grossInterest = Math.round((((price * 0.9) * 0.03) / 12));
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
            className={`${styles.cardMonthlyCostRow} ${isOpen ? styles.tooltipOpen : ''}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            aria-label="Visa detaljerad månadskostnad"
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
                    <span>Ränta (3%, 90% lån, efter avdrag):</span>
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

const ListingCard = memo(({ item, index = 0, isFavorite, toggleFavorite, alwaysShowFavorite, variant = 'list', setHoveredListingUrl, disableViewportTracking = false }) => {
    const cardRef = useRef(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    let pressTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;
    
    const images = item.images && item.images.length > 0 ? [item.images[0]] : [item.imageUrl];

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

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (disableViewportTracking || variant === 'map') return;
        
        const node = cardRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    setIsVisible(entry.isIntersecting);
                });
            },
            { threshold: 0.1 } // 10% visible
        );

        observer.observe(node);
        return () => observer.unobserve(node);
    }, [item.url, disableViewportTracking, variant]);

    const booliUrl = item.booliId ? `https://www.booli.se/annons/${item.booliId}` : item.url;

    const handleClick = (e) => {
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
            if (navigator.vibrate) navigator.vibrate(50);
            setIsMenuOpen(true);
        }, 500);
    };

    const cancelPress = (e) => {
        if (e && e.type === 'touchmove') {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            if (Math.abs(currentX - touchStartX) > 10 || Math.abs(currentY - touchStartY) > 10) {
                clearTimeout(pressTimer);
            }
        } else {
            clearTimeout(pressTimer);
        }
    };

    const publishedText = useMemo(() => {
        if (!item.published) return 'Idag';
        const pub = new Date(item.published.replace(' ', 'T'));
        const now = new Date();
        const pubDate = new Date(pub.getFullYear(), pub.getMonth(), pub.getDate());
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.round((nowDate - pubDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Idag';
        if (diffDays === 1) return 'Igår';
        return `${diffDays} dagar`;
    }, [item.published]);

    const monthlyCost = useMemo(() =>
        calculateMonthlyCost(item.listPrice || item.estimatedValue, item.rent),
        [item.listPrice, item.estimatedValue, item.rent]);

    const isTopFloor = useMemo(() => {
        const source = item.searchSource || '';
        return source.toLowerCase().includes('top floor') || (item.floor && item.totalFloors && item.floor === item.totalFloors);
    }, [item.searchSource, item.floor, item.totalFloors]);

    const isHouse = useMemo(() =>
        item.objectType && !item.objectType.toLowerCase().includes('lägenhet'),
        [item.objectType]);

    const type = item.objectType || "Lägenhet";
    
    const pricePerSqm = useMemo(() => {
        let val = null;
        if (item.pricePerSqm && item.pricePerSqm > 0) val = item.pricePerSqm;
        else if (item.listPrice && item.livingArea) val = item.listPrice / item.livingArea;
        return val ? Math.round(val / 1000) * 1000 : null;
    }, [item.pricePerSqm, item.listPrice, item.livingArea]);

    const displayBrfName = useMemo(() => {
        let name = item.brfName || item.brfName_hitta;
        if (!name) return null;
        return name
            .replace(/Bostadsrättsföreningen\s+/ig, 'Brf ')
            .replace(/Bostadsrättsförening\s+/ig, 'Brf ')
            .replace(/^brf\s+/i, 'Brf ');
    }, [item.brfName, item.brfName_hitta]);

    const wrapperStyle = variant === 'map' ? {
        display: 'block',
        borderRadius: '16px',
        overflow: 'hidden',
        width: '100%',
        margin: '0',
        boxShadow: 'none'
    } : {
        position: 'relative',
        display: 'block',
        marginBottom: '24px'
    };

    const areaOrCity = item.city || item.area || (item.searchSource ? item.searchSource.split(' (')[0] : '');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + (areaOrCity ? ', ' + areaOrCity : ''))}`;

    const handleAddressClick = (e) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
    };

    return (
        <motion.div
            ref={cardRef}
            id={`listing-${item.url.replace(/[^a-zA-Z0-9]/g, '-')}`}
            layout={variant === 'list'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: variant === 'list' ? index * 0.05 : 0, type: 'spring', bounce: 0.2 }}
            className={`listing-card-wrapper ${variant}`}
            style={wrapperStyle}
        >
            <motion.article
                className={`${styles.cardWrapper} ${isFavorite ? styles.favorite : ''}`}
                onMouseEnter={() => {
                    setIsHovered(true);
                    if (setHoveredListingUrl) setHoveredListingUrl(item.url);
                }}
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onTouchCancel={cancelPress}
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={(e) => {
                    setIsHovered(false);
                    if (setHoveredListingUrl) setHoveredListingUrl(null);
                    cancelPress(e);
                }}
                whileHover={variant !== 'map' ? { y: -4 } : {}}
                whileTap={variant !== 'map' ? { scale: 0.98 } : {}}
            >
                <a
                    href={booliUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardImageLink}
                    onClick={handleClick}
                >
                    <div className={styles.cardImageContainer}>
                        <SmartImage 
                            src={images[imageIndex] || '/placeholder.png'} 
                            alt={item.address} 
                            className={`${styles.cardImageMain} ${isVisible ? styles.infiniteZoom : ''}`} 
                        />
                        {images.length > 1 && (
                            <>
                                {imageIndex > 0 && (
                                    <button className="carousel-btn prev" onClick={prevImage}><ChevronLeftRoundedIcon /></button>
                                )}
                                {imageIndex < images.length - 1 && (
                                    <button className="carousel-btn next" onClick={nextImage}><ChevronRightRoundedIcon /></button>
                                )}
                            </>
                        )}
                        {formatShowingDate(item.nextShowing) && (
                            <div className="showing-badge">
                                <CalendarMonthRoundedIcon style={{ fontSize: '14px' }} />
                                <span>{formatShowingDate(item.nextShowing)}</span>
                            </div>
                        )}
                    </div>
                </a>

                <div className={styles.cardContent}>
                    <div className={styles.cardHeaderRow}>
                        <div className={styles.addressWithIcon}>
                            <LocationOnRoundedIcon sx={{ fontSize: 16, color: 'var(--text-tertiary)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 className={styles.cardAddress}>
                                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.cardAddressLink} style={{ display: 'inline' }} onClick={handleAddressClick} title="Visa på karta">
                                        {item.address}
                                    </a>
                                    {item.area && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '6px' }}>{item.area}</span>}
                                </h3>
                                {displayBrfName && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                        <ApartmentRoundedIcon sx={{ fontSize: 12 }} /> 
                                        {displayBrfName}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            className={`${styles.cardFavoriteBtn} ${isFavorite ? styles.active : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.url); }}
                            aria-label={isFavorite ? "Ta bort från favoriter" : "Spara som favorit"}
                        >
                            {isFavorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
                        </button>
                    </div>

                    <div className={styles.cardPriceRow}>
                        <span className={styles.cardPriceMain}>
                            {item.listPrice ? formatPrice(item.listPrice) : 'Pris saknas'}
                        </span>
                        {variant !== 'map' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                                {item.estimatedValue && item.listPrice ? (() => {
                                    const diffPercent = Math.round(((item.listPrice - item.estimatedValue) / item.estimatedValue) * 100);
                                    let bColor = 'var(--text-secondary)';
                                    let bBg = 'var(--segmented-bg)';
                                    if (diffPercent > 0) {
                                        bColor = '#b91c1c';
                                        bBg = '#fee2e2';
                                    } else if (diffPercent < 0) {
                                        bColor = '#047857';
                                        bBg = '#d1fae5';
                                    }
                                    return (
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            color: bColor,
                                            backgroundColor: bBg,
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '6px'
                                        }}>
                                            {diffPercent > 0 ? '+' : ''}{diffPercent}%
                                        </span>
                                    );
                                })() : (
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        color: 'var(--text-secondary)',
                                        backgroundColor: 'var(--segmented-bg)',
                                        fontWeight: 600,
                                        padding: '2px 6px',
                                        borderRadius: '6px'
                                    }}>
                                        -
                                    </span>
                                )}
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {item.estimatedValue ? formatPrice(item.estimatedValue) : 'Värdering saknas'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className={styles.cardSpecsRow}>
                        {item.rooms && <span>{item.rooms} rum</span>}
                        {item.livingArea && <span>{Math.round(item.livingArea)} m²</span>}
                        {(item.floor != null || item.totalFloors != null) && <span>Vån {item.floor != null ? item.floor : '?'}{item.totalFloors ? `/${item.totalFloors}` : ''}</span>}
                        {monthlyCost && variant !== 'map' && <MonthlyCostTooltip item={item} />}
                    </div>

                    {variant !== 'map' && (
                        <div className={styles.cardFooterRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span>{publishedText}</span>
                                {pricePerSqm && <span><span style={{ opacity: 0.3 }}>•</span> <span style={{ color: 'var(--text-secondary)' }}>{formatPrice(pricePerSqm)}/m²</span></span>}
                            </div>
                        </div>
                    )}
                </div>
            </motion.article>

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
