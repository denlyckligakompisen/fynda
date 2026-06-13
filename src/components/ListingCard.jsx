import { useState, useMemo, memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    ChevronRightRounded as ChevronRightRoundedIcon,
    ApartmentRounded as ApartmentRoundedIcon,
    UnfoldMoreRounded as UnfoldMoreRoundedIcon,
    ExpandLessRounded as ExpandLessRoundedIcon,
    ExpandMoreRounded as ExpandMoreRoundedIcon
} from '@mui/icons-material';
import SmartImage from './SmartImage';
import styles from './ListingCard.module.css';

const MonthlyCostTooltip = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [interestRate, setInterestRate] = useState(() => {
        const val = localStorage.getItem('userInterestRate');
        if (val === '') return '';
        return val !== null ? Number(val) : 1.91;
    });
    const [loanPercentage, setLoanPercentage] = useState(() => {
        const val = localStorage.getItem('userLoanPercentage');
        if (val === '') return '';
        return val !== null ? Number(val) : 90;
    });

    useEffect(() => {
        localStorage.setItem('userInterestRate', interestRate);
    }, [interestRate]);

    useEffect(() => {
        localStorage.setItem('userLoanPercentage', loanPercentage);
    }, [loanPercentage]);

    // Calculation logic moved from inline
    const price = item.listPrice || item.estimatedValue || 0;
    const isEstimated = !item.listPrice && !!item.estimatedValue;

    const loanFraction = loanPercentage / 100;
    const interestFraction = interestRate / 100;

    const interest = Math.round((((price * loanFraction) * interestFraction) / 12) * 0.7);
    const grossInterest = Math.round((((price * loanFraction) * interestFraction) / 12));
    const amortization = Math.round((price * loanFraction * 0.02) / 12);
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        Ränta (
                        <span style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 4px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#007aff'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '0'; }}>
                            <input 
                                type="number" 
                                className="no-spinners"
                                value={interestRate} 
                                onChange={(e) => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '32px', background: 'transparent', border: 'none', color: 'inherit', padding: '0', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <div className="tooltip-icons" style={{ display: 'flex', flexDirection: 'column', opacity: 0, transition: 'opacity 0.2s' }}>
                                <ExpandLessRoundedIcon onClick={(e) => { e.stopPropagation(); e.preventDefault(); setInterestRate(+(interestRate + 0.1).toFixed(2)); }} sx={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '-6px', transition: 'color 0.2s', '&:hover': { color: '#007aff' }, cursor: 'pointer' }} />
                                <ExpandMoreRoundedIcon onClick={(e) => { e.stopPropagation(); e.preventDefault(); setInterestRate(Math.max(0, +(interestRate - 0.1).toFixed(2))); }} sx={{ fontSize: '14px', color: 'var(--text-tertiary)', transition: 'color 0.2s', '&:hover': { color: '#007aff' }, cursor: 'pointer' }} />
                            </div>
                        </span>%, 
                        <span style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 4px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#007aff'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '0'; }}>
                            <input 
                                type="number" 
                                className="no-spinners"
                                value={loanPercentage} 
                                onChange={(e) => setLoanPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '22px', background: 'transparent', border: 'none', color: 'inherit', padding: '0', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <div className="tooltip-icons" style={{ display: 'flex', flexDirection: 'column', opacity: 0, transition: 'opacity 0.2s' }}>
                                <ExpandLessRoundedIcon onClick={(e) => { e.stopPropagation(); e.preventDefault(); setLoanPercentage(loanPercentage + 1); }} sx={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '-6px', transition: 'color 0.2s', '&:hover': { color: '#007aff' }, cursor: 'pointer' }} />
                                <ExpandMoreRoundedIcon onClick={(e) => { e.stopPropagation(); e.preventDefault(); setLoanPercentage(Math.max(0, loanPercentage - 1)); }} sx={{ fontSize: '14px', color: 'var(--text-tertiary)', transition: 'color 0.2s', '&:hover': { color: '#007aff' }, cursor: 'pointer' }} />
                            </div>
                        </span>% lån):
                    </span>
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
                            <span>0-{formatPrice(Math.round(price * loanFraction * 0.02))}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ListingCard = memo(({ item, index = 0, isFavorite, toggleFavorite, alwaysShowFavorite, variant = 'list', setHoveredListingUrl, disableViewportTracking = false, forceHovered = false }) => {
    const cardRef = useRef(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [editedPrice, setEditedPrice] = useState(null);
    const effectivePrice = editedPrice !== null ? editedPrice : (item.listPrice || item.estimatedValue || 0);
    
    const images = item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []);

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
    const effectivelyHovered = isHovered || forceHovered;

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

    useEffect(() => {
        if (!effectivelyHovered || !images || images.length <= 1) return;
        const interval = setInterval(() => {
            setImageIndex(prev => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [effectivelyHovered, images.length]);

    const booliUrl = item.booliId ? `https://www.booli.se/annons/${item.booliId}` : item.url;

    const handleClick = (e) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        window.open(booliUrl, '_blank');
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
        calculateMonthlyCost(effectivePrice, item.rent),
        [effectivePrice, item.rent]);

    const isTopFloor = useMemo(() => {
        const source = item.searchSource || '';
        return source.toLowerCase().includes('top floor');
    }, [item.searchSource]);

    const isHouse = useMemo(() =>
        item.objectType && !item.objectType.toLowerCase().includes('lägenhet'),
        [item.objectType]);

    const type = item.objectType || "Lägenhet";
    
    const pricePerSqm = useMemo(() => {
        let val = null;
        if (item.pricePerSqm && item.pricePerSqm > 0 && editedPrice === null) val = item.pricePerSqm;
        else if (effectivePrice && item.livingArea) val = effectivePrice / item.livingArea;
        return val ? Math.round(val / 1000) * 1000 : null;
    }, [item.pricePerSqm, effectivePrice, item.livingArea, editedPrice]);



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

    const areaOrCity = item.area || (item.searchSource ? item.searchSource.split(' (')[0] : '');
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
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -50px 0px" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
            className={`listing-card-wrapper ${variant}`}
            style={wrapperStyle}
        >
            <motion.article
                className={`${styles.cardWrapper} ${isFavorite ? styles.favorite : ''}`}
                onMouseEnter={() => {
                    setIsHovered(true);
                    if (setHoveredListingUrl) setHoveredListingUrl(item.url);
                }}
                onMouseLeave={(e) => {
                    setIsHovered(false);
                    if (setHoveredListingUrl) setHoveredListingUrl(null);
                }}
                whileHover={variant !== 'map' ? { y: -4 } : {}}
                whileTap={variant !== 'map' ? { scale: 0.98 } : {}}
            >
                <a
                    href={booliUrl}
                    className={styles.cardImageLink}
                    onClick={handleClick}
                >
                    <div className={styles.cardImageContainer}>
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={imageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                style={{ position: 'absolute', width: '100%', height: '100%' }}
                            >
                                <SmartImage 
                                    src={images[imageIndex] || '/placeholder.png'} 
                                    alt={item.address} 
                                    className={`${styles.cardImageMain} ${(effectivelyHovered && images.length > 1) ? (imageIndex % 2 === 0 ? styles.zoomIn : styles.zoomOut) : ''}`} 
                                />
                            </motion.div>
                        </AnimatePresence>
                        {item.biddingOpen === 1 && (
                            <div className="image-badge-status">
                                Budgivning
                            </div>
                        )}
                        {item.upcomingSale === true && item.biddingOpen !== 1 && (
                            <div className="image-badge-status">
                                Kommande
                            </div>
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
                        <span className={styles.cardPriceMain} style={{ display: 'flex', alignItems: 'center' }}>
                            {isEditingPrice ? (
                                <input 
                                    type="number"
                                    step="5000"
                                    value={effectivePrice}
                                    onChange={(e) => setEditedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    onBlur={() => setIsEditingPrice(false)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingPrice(false); }}
                                    autoFocus
                                    style={{ width: '140px', fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit', color: 'inherit', background: 'var(--bg-primary)', border: '1px solid #007aff', borderRadius: '6px', padding: '2px 8px', outline: 'none' }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsEditingPrice(true); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 8px', transition: 'all 0.2s', marginLeft: '-8px' }} title="Klicka för att ändra pris" onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#007aff'; const iconContainer = e.currentTarget.querySelector('.price-edit-icons'); if(iconContainer) iconContainer.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; const iconContainer = e.currentTarget.querySelector('.price-edit-icons'); if(iconContainer) iconContainer.style.opacity = '0'; }}>
                                    {effectivePrice ? formatPrice(effectivePrice) : 'Pris saknas'}
                                    <div className="price-edit-icons" style={{ display: 'flex', flexDirection: 'column', opacity: 0, transition: 'opacity 0.2s', marginLeft: '-4px' }}>
                                        <ExpandLessRoundedIcon 
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditedPrice(effectivePrice + 10000); }} 
                                            sx={{ fontSize: '16px', color: 'var(--text-tertiary)', marginBottom: '-6px', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} 
                                        />
                                        <ExpandMoreRoundedIcon 
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditedPrice(Math.max(0, effectivePrice - 10000)); }} 
                                            sx={{ fontSize: '16px', color: 'var(--text-tertiary)', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} 
                                        />
                                    </div>
                                </span>
                            )}
                        </span>
                        {variant !== 'map' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                                {item.estimatedValue && effectivePrice ? (() => {
                                    const diffPercent = Math.round(((effectivePrice - item.estimatedValue) / item.estimatedValue) * 100);
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
                    {item.tags && item.tags.length > 0 && variant !== 'map' && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {item.tags.map(tag => (
                                <span key={tag} style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: 'var(--segmented-bg)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className={styles.cardSpecsRow}>
                        {item.rooms && <span>{item.rooms} rum</span>}
                        {item.livingArea && <span>{Math.round(item.livingArea)} m²</span>}
                        {item.floor != null && <span>Vån {item.floor}</span>}
                        {monthlyCost && variant !== 'map' && <MonthlyCostTooltip item={{...item, listPrice: effectivePrice}} />}
                    </div>

                    {variant !== 'map' && (
                        <div className={styles.cardFooterRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span>{publishedText}</span>
                                {pricePerSqm && <span><span style={{ opacity: 0.3 }}>•</span> <span style={{ color: 'var(--text-secondary)' }}>{formatPrice(pricePerSqm)}/m²</span></span>}
                            </div>
                            {item.brokerAgency && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'right', opacity: 0.8 }}>
                                    {item.brokerAgency}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </motion.article>
        </motion.div >
    );
});

export default ListingCard;
