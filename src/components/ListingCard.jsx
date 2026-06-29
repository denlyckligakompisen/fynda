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
    HouseRounded as HouseRoundedIcon,
    UnfoldMoreRounded as UnfoldMoreRoundedIcon,
    ExpandLessRounded as ExpandLessRoundedIcon,
    ExpandMoreRounded as ExpandMoreRoundedIcon,
    FullscreenRounded as FullscreenRoundedIcon,
    CloseRounded as CloseRoundedIcon
} from '@mui/icons-material';
import SmartImage from './SmartImage';
import PdfScanner from './PdfScanner';
import styles from './ListingCard.module.css';

const MonthlyCostTooltip = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [interestRate, setInterestRate] = useState(() => {
        const val = localStorage.getItem('customInterestRate');
        if (val === '') return '';
        return val !== null ? Number(val) : '';
    });
    const [loanPercentage, setLoanPercentage] = useState(() => {
        const val = localStorage.getItem('userLoanPercentage');
        if (val === '') return '';
        return val !== null ? Number(val) : 90;
    });

    useEffect(() => {
        if (interestRate !== '') {
            localStorage.setItem('customInterestRate', interestRate);
        } else {
            localStorage.removeItem('customInterestRate');
        }
    }, [interestRate]);

    useEffect(() => {
        localStorage.setItem('userLoanPercentage', loanPercentage);
    }, [loanPercentage]);

    // Calculation logic moved from inline
    const price = item.listPrice || item.estimatedValue || 0;
    const isEstimated = !item.listPrice && !!item.estimatedValue;

    const loanFraction = loanPercentage / 100;
    const loanAmount = price * loanFraction;
    
    const yearlyInterestNetTier1 = Math.min(loanAmount, 2000000) * 0.0135;
    const yearlyInterestNetTier2 = Math.max(0, loanAmount - 2000000) * 0.0166;
    const yearlyInterestNet = yearlyInterestNetTier1 + yearlyInterestNetTier2;

    const defaultEffectiveRate = loanAmount > 0 ? (yearlyInterestNet / loanAmount) * 100 : 0;
    const defaultPreDeductionRate = Number((defaultEffectiveRate / 0.7).toFixed(2));

    const activeInterestRate = interestRate !== '' ? interestRate : defaultPreDeductionRate;
    const interestFraction = activeInterestRate / 100;

    const interest = Math.round((((price * loanFraction) * interestFraction) / 12) * 0.7);
    const grossInterest = Math.round((((price * loanFraction) * interestFraction) / 12));
    const amortization = Math.round((loanAmount * 0.02) / 12);
    const isHouse = item.objectType && !item.objectType.toLowerCase().includes('lägenhet');

    const fee = isHouse ? 0 : (item.rent || 0);

    const hasMissingData = !interest || !amortization || (!isHouse && !fee);

    // Matches formatter.js logic
    const totalRecurringCosts = fee;

    const displayCost = interest + totalRecurringCosts;
    const totalCost = grossInterest + amortization + fee;
    const totalCostNet = interest + amortization + fee;

    return (
        <div
            className={`${styles.cardMonthlyCostRow} ${isOpen ? styles.tooltipOpen : ''}`}
            onMouseLeave={() => setIsOpen(false)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsOpen(false);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    setIsOpen(false);
                }
            }}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                aria-expanded={isOpen}
                aria-controls={`cost-tooltip-${item.booliId}`}
                aria-label="Visa detaljerad månadskostnad"
                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', outlineOffset: '4px' }}
            >
                {hasMissingData && (
                    <WarningRoundedIcon titleAccess="Varning: Viss data för beräkning saknas" sx={{ fontSize: '16px', color: 'var(--text-tertiary)' }} />
                )}
                {isEstimated && (
                    <BarChartRoundedIcon titleAccess="Beräkningen baseras på ett uppskattat värde" sx={{ fontSize: '16px', color: 'var(--text-tertiary)' }} />
                )}
                {formatPrice(displayCost)}/mån
            </button>
            <div id={`cost-tooltip-${item.booliId}`} className="cost-tooltip">
                <div className="tooltip-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        Ränta (
                        <span style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 4px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#007aff'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '0'; }}>
                            <input 
                                type="number" 
                                className="no-spinners"
                                aria-label="Ränta i procent"
                                value={activeInterestRate} 
                                onChange={(e) => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '36px', background: 'transparent', border: 'none', color: 'inherit', padding: '0', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <div className="tooltip-icons" style={{ display: 'flex', flexDirection: 'column', opacity: 0, transition: 'opacity 0.2s' }}>
                                <button type="button" aria-label="Öka ränta" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setInterestRate(+(activeInterestRate + 0.01).toFixed(2)); }} style={{background:'none',border:'none',padding:0,cursor:'pointer',lineHeight:0}}><ExpandLessRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '-6px', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} /></button>
                                <button type="button" aria-label="Minska ränta" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setInterestRate(Math.max(0, +(activeInterestRate - 0.01).toFixed(2))); }} style={{background:'none',border:'none',padding:0,cursor:'pointer',lineHeight:0}}><ExpandMoreRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} /></button>
                            </div>
                        </span>%, 
                        <span style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 4px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#007aff'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; const iconContainer = e.currentTarget.querySelector('.tooltip-icons'); if(iconContainer) iconContainer.style.opacity = '0'; }}>
                            <input 
                                type="number" 
                                className="no-spinners"
                                aria-label="Låneandel i procent"
                                value={loanPercentage} 
                                onChange={(e) => setLoanPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '22px', background: 'transparent', border: 'none', color: 'inherit', padding: '0', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <div className="tooltip-icons" style={{ display: 'flex', flexDirection: 'column', opacity: 0, transition: 'opacity 0.2s' }}>
                                <button type="button" aria-label="Öka låneandel" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setLoanPercentage(loanPercentage + 1); }} style={{background:'none',border:'none',padding:0,cursor:'pointer',lineHeight:0}}><ExpandLessRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '-6px', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} /></button>
                                <button type="button" aria-label="Minska låneandel" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setLoanPercentage(Math.max(0, loanPercentage - 1)); }} style={{background:'none',border:'none',padding:0,cursor:'pointer',lineHeight:0}}><ExpandMoreRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} /></button>
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
                {!isHouse && (
                    <div className="tooltip-row">
                        <span>Avgift:</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!fee && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', opacity: 0.5 }} />}
                            {formatPrice(fee)}/mån
                        </span>
                    </div>
                )}
                <div className="tooltip-divider"></div>
                <div className="tooltip-row total">
                    <span style={{ fontWeight: 'normal' }}>Totalt (efter avdrag):</span>
                    <span>{formatPrice(totalCostNet)}/mån</span>
                </div>
                <div className="tooltip-row total" style={{ marginTop: '4px' }}>
                    <span style={{ fontWeight: 'normal' }}>Totalt (före avdrag):</span>
                    <span>{formatPrice(totalCost)}/mån</span>
                </div>
                {isHouse && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="tooltip-row" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                            <span>Lagfart (1,5% + 825 kr):</span>
                            <span>{formatPrice(Math.round(price * 0.015) + 825)}</span>
                        </div>
                        <div className="tooltip-row" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                            <span>Pantbrev (2% + 375 kr):</span>
                            <span>375 - {formatPrice(Math.round(price * 0.90 * 0.02) + 375)}</span>
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
    const effectivePrice = editedPrice !== null ? editedPrice : (item.listPrice || 0);
    
    const images = item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []);

    const isIsolated = window.location.pathname === `/${item.booliId}`;

    const handleIsolateListing = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isIsolated) {
            window.location.href = '/';
        } else {
            window.location.href = `/${item.booliId}`;
        }
    };

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

    const booliUrl = (item.sourcePage && item.sourcePage.includes('booli.se/bostad')) 
        ? item.sourcePage 
        : (item.booliId ? `https://www.booli.se/annons/${item.booliId}` : item.url);

    const handleClick = (e) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (isIsolated) {
            window.open(booliUrl, '_blank');
        } else {
            window.location.href = `/${item.booliId}`;
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
        calculateMonthlyCost(effectivePrice || item.estimatedValue, item.rent),
        [effectivePrice, item.estimatedValue, item.rent]);

    const isTopFloor = useMemo(() => {
        const source = item.searchSource || '';
        return source.toLowerCase().includes('top floor');
    }, [item.searchSource]);

    const isHouse = useMemo(() =>
        item.objectType && !item.objectType.toLowerCase().includes('lägenhet'),
        [item.objectType]);

    const type = item.objectType || "Lägenhet";
    
    const { pricePerSqm, isSqmEstimated } = useMemo(() => {
        let val = null;
        let isEst = false;
        if (item.pricePerSqm && item.pricePerSqm > 0 && editedPrice === null) {
            val = item.pricePerSqm;
        } else if (effectivePrice && item.livingArea) {
            val = effectivePrice / item.livingArea;
        } else if (item.estimatedValue && item.livingArea) {
            val = item.estimatedValue / item.livingArea;
            isEst = true;
        }
        return {
            pricePerSqm: val ? Math.round(val / 1000) * 1000 : null,
            isSqmEstimated: isEst
        };
    }, [item.pricePerSqm, effectivePrice, item.estimatedValue, item.livingArea, editedPrice]);



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
    const mapsLocation = item.municipality || areaOrCity;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + (mapsLocation ? ', ' + mapsLocation : ''))}`;

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
            transition={{ duration: 0.5, delay: (index % 10) * 0.05, type: 'spring', bounce: 0.2 }}
            className={`listing-card-wrapper ${variant}`}
            style={wrapperStyle}
        >
            <motion.article
                className={`${styles.cardWrapper} ${isFavorite ? styles.favorite : ''}`}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
            >
                <a
                    href={isIsolated ? booliUrl : `/${item.booliId}`}
                    target={isIsolated ? "_blank" : undefined}
                    rel={isIsolated ? "noopener noreferrer" : undefined}
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
                                    alt={images.length > 1 ? `Bild ${imageIndex + 1} för ${item.address}` : item.address} 
                                    className={styles.cardImageMain} 
                                />
                            </motion.div>
                        </AnimatePresence>
                        {item.biddingOpen === 1 && (
                            <div className="image-badge-status">
                                Budgivning
                            </div>
                        )}

                        {formatShowingDate(item.nextShowing) && (
                            <div className="showing-badge">
                                <CalendarMonthRoundedIcon style={{ fontSize: '14px' }} />
                                <span>{formatShowingDate(item.nextShowing)}</span>
                            </div>
                        )}
                        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className={styles.cardFavoriteBtn}
                                style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', backdropFilter: 'blur(4px)' }}
                                onClick={handleIsolateListing}
                                aria-label={isIsolated ? "Gå tillbaka till startsidan" : "Visa enbart detta objekt"}
                                title={isIsolated ? "Stäng fokuserat läge" : "Fokusera på detta objekt"}
                            >
                                {isIsolated ? <CloseRoundedIcon sx={{ fontSize: '22px' }} /> : <FullscreenRoundedIcon sx={{ fontSize: '22px' }} />}
                            </button>
                        </div>
                    </div>
                </a>

                <div className={styles.cardContent}>
                    <div className={styles.cardHeaderRow}>
                        <div className={styles.addressWithIcon}>
                            {item.objectType && !item.objectType.toLowerCase().includes('lägenhet') ? (
                                <HouseRoundedIcon sx={{ fontSize: 16, color: 'var(--text-tertiary)' }} titleAccess={item.objectType} />
                            ) : (
                                <ApartmentRoundedIcon sx={{ fontSize: 16, color: 'var(--text-tertiary)' }} titleAccess={item.objectType || 'Lägenhet'} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <h3 className={styles.cardAddress}>
                                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.cardAddressLink} onClick={handleAddressClick} title="Visa på karta">
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.address}</span>
                                        <LaunchRoundedIcon sx={{ fontSize: '14px', color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                        <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>(öppnas i ny flik)</span>
                                    </a>
                                    {item.area && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal', flexShrink: 0 }}>{item.area}</span>}
                                </h3>

                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className={`${styles.cardFavoriteBtn} ${isFavorite ? styles.active : ''}`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.url); }}
                                aria-label={isFavorite ? "Ta bort från favoriter" : "Spara som favorit"}
                            >
                                {isFavorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.cardPriceRow}>
                        <span className={styles.cardPriceMain} style={{ display: 'flex', alignItems: 'center' }}>
                            {isEditingPrice ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', border: '1px solid #007aff', borderRadius: '6px', padding: '2px 8px', marginLeft: '-8px' }} onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="number"
                                        step="5000"
                                        className="no-spinners"
                                        aria-label="Justera pris"
                                        value={effectivePrice}
                                        onChange={(e) => setEditedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        onBlur={() => setIsEditingPrice(false)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingPrice(false); }}
                                        autoFocus
                                        style={{ width: '130px', fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit', color: 'inherit', background: 'transparent', border: 'none', padding: '0', outline: 'none' }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '-4px' }}>
                                        <button type="button" aria-label="Öka pris" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditedPrice(effectivePrice + 10000); }} style={{background:'none',border:'none',padding:0,cursor:'pointer',lineHeight:0}}><ExpandLessRoundedIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', marginBottom: '-6px', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} /></button>
                                        <button type="button" aria-label="Minska pris" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditedPrice(Math.max(0, effectivePrice - 10000)); }} style={{background:'none',border:'none',padding:0,cursor:'pointer',lineHeight:0}}><ExpandMoreRoundedIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} /></button>
                                    </div>
                                </span>
                            ) : (
                                <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsEditingPrice(true); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 8px', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', marginLeft: '-8px', transformOrigin: 'left center', font: 'inherit', color: 'inherit' }} aria-label="Ändra pris" title="Klicka för att ändra pris" onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#007aff'; e.currentTarget.style.transform = 'scale(1.02)'; const iconContainer = e.currentTarget.querySelector('.price-edit-icons'); if(iconContainer) iconContainer.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'scale(1)'; const iconContainer = e.currentTarget.querySelector('.price-edit-icons'); if(iconContainer) iconContainer.style.opacity = '0'; }}>
                                    {effectivePrice ? formatPrice(effectivePrice) : 'Pris ej angivet'}
                                    <div className="price-edit-icons" style={{ display: 'flex', flexDirection: 'column', opacity: 0, transition: 'opacity 0.2s', marginLeft: '-4px' }}>
                                        <ExpandLessRoundedIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', marginBottom: '-6px', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} />
                                        <ExpandMoreRoundedIcon sx={{ fontSize: '16px', color: 'var(--text-tertiary)', transition: 'color 0.2s', '&:hover': { color: '#007aff' } }} />
                                    </div>
                                </button>
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
                    {item.tags && item.tags.filter(t => t.toLowerCase() !== 'snart till salu').length > 0 && variant !== 'map' && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {item.tags.filter(t => t.toLowerCase() !== 'snart till salu').map(tag => (
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
                        {item.plotArea > 0 && <span>+ {Math.round(item.plotArea)} m² tomt</span>}
                        {item.floor > 0 && <span>Vån {item.floor}{item.totalFloors ? ` av ${item.totalFloors}` : ''}</span>}
                        {monthlyCost && variant !== 'map' && <MonthlyCostTooltip item={{...item, listPrice: effectivePrice}} />}
                    </div>

                    {variant !== 'map' && (
                        <div className={styles.cardFooterRow} style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span>{publishedText}</span>
                                {pricePerSqm && <span style={{ display: 'flex', alignItems: 'center' }}><span aria-hidden="true" style={{ opacity: 0.3, margin: '0 8px 0 0' }}>•</span> <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>{isSqmEstimated && <BarChartRoundedIcon sx={{ fontSize: '13px', opacity: 0.6 }} titleAccess="Baserat på värdering" />}{formatPrice(pricePerSqm)}/m²</span></span>}
                                {item.brokerAgency && (
                                    <span>
                                        <span aria-hidden="true" style={{ opacity: 0.3 }}>•</span>{' '}
                                        <span style={{ fontWeight: 500, opacity: 0.8 }}>{item.brokerAgency}</span>
                                    </span>
                                )}
                                {item.secondaryArea > 0 && <span title="Biarea"><span aria-hidden="true" style={{ opacity: 0.3 }}>•</span> <span style={{ color: 'var(--text-secondary)' }}>+ {Math.round(item.secondaryArea)} m² biarea</span></span>}
                            </div>
                            <ChevronRightRoundedIcon sx={{ color: 'var(--text-tertiary)', fontSize: '20px' }} />
                        </div>
                    )}
                    {isIsolated && !isHouse && (
                        <PdfScanner item={item} onFileSelected={(file) => console.log('File selected:', file)} />
                    )}
                </div>
            </motion.article>
        </motion.div >
    );
});

export default ListingCard;
