import { useState, useRef } from 'react';
import { formatPrice, formatShowingDate, calculateMonthlyCost } from '../utils/formatters';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import HeartBrokenRoundedIcon from '@mui/icons-material/HeartBrokenRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';



/**
 * Individual listing card component
 */
const ListingCard = ({ item, isFavorite, toggleFavorite, alwaysShowFavorite }) => {
    const [translateX, setTranslateX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMapHovered, setIsMapHovered] = useState(false);
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

    const handleAddressClick = (e) => {
        e.stopPropagation();
        // Construct Google Maps URL (search query)
        const encodedAddress = encodeURIComponent(item.address + (item.area ? `, ${item.area}` : ''));
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    };

    return (
        <div
            className="listing-card-wrapper"
            onClick={handleClick}
            style={{ position: 'relative', overflow: 'hidden', display: 'block', borderRadius: '12px', marginBottom: '24px', cursor: 'pointer' }}
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
                <div
                    className="card-image-wrapper"
                    style={{ position: 'relative', overflow: 'hidden' }}
                >

                    <img
                        src={item.imageUrl?.replace('1170x0', '350x0') || '/placeholder.png'}
                        alt={item.address}
                        className="card-image"
                        style={{
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
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
                    <div className="card-header" style={{ alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <h3 className="card-address">
                                    {item.address || 'Adress saknas'}
                                </h3>
                                <div
                                    onClick={handleAddressClick}
                                    onMouseEnter={() => setIsMapHovered(true)}
                                    onMouseLeave={() => setIsMapHovered(false)}
                                    style={{
                                        marginLeft: '8px',
                                        background: isMapHovered ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)', // Lighter background default
                                        opacity: isHovered ? 1 : 0, // Show only on card hover
                                        transform: isMapHovered ? 'scale(1.1)' : 'scale(1)',
                                        borderRadius: '50%',
                                        width: '32px', // Larger
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        pointerEvents: isHovered ? 'auto' : 'none',
                                        flexShrink: 0
                                    }}
                                >
                                    <MapRoundedIcon sx={{
                                        color: isMapHovered ? 'white' : '#666',
                                        fontSize: '24px'
                                    }} />
                                </div>
                            </div>
                            {item.area && (
                                <span className="card-area" style={{ marginTop: '4px', display: 'block' }}>
                                    {item.area}
                                </span>
                            )}
                        </div>
                        <button
                            className={`favorite-btn-overlay ${isFavorite ? 'active' : ''} ${alwaysShowFavorite ? 'always-visible' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(item.url);
                            }}
                        >
                            {isFavorite ? (
                                <FavoriteRoundedIcon className="favorite-icon" sx={{ fontSize: '24px' }} />
                            ) : (
                                <FavoriteBorderRoundedIcon className="favorite-icon" sx={{ fontSize: '24px' }} />
                            )}
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
                            const isEstimatedBasis = !item.listPrice && !!item.estimatedValue;
                            const price = item.listPrice || item.estimatedValue || 0;
                            const interest = Math.round(((((price * 0.85) * 0.01) / 12) * 0.7));
                            const amortization = Math.round((price * 0.85 * 0.02) / 12);
                            const fee = item.rent || 0;
                            const operating = item.livingArea ? Math.round((50 * item.livingArea) / 12) : 0;
                            const totalWithoutAmortization = interest + fee + operating;
                            const hasMissingData = price === 0 || fee === 0 || operating === 0;

                            return (
                                <div className="monthly-cost-row">
                                    <span className="monthly-cost-label">Månadskostnad:</span>
                                    <span className="monthly-cost-value">
                                        {hasMissingData && <WarningRoundedIcon sx={{ fontSize: '18px', opacity: 0.7, verticalAlign: 'middle' }} titleAccess="Data saknas" />}
                                        {isEstimatedBasis && <InsertChartOutlinedRoundedIcon sx={{ fontSize: '18px', opacity: 0.8, verticalAlign: 'middle' }} titleAccess="Baserat på värdering" />}
                                        {formatPrice(totalWithoutAmortization)}
                                    </span>
                                    <div className="monthly-cost-tooltip">
                                        <div className={`tooltip-row ${price === 0 ? 'tooltip-warning' : ''}`}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                Ränta (1%, 85% lån, efter avdrag)
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {isEstimatedBasis && <InsertChartOutlinedRoundedIcon sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }} titleAccess="Baserat på värdering" />}
                                                {price === 0 && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }} titleAccess="Prisuppgift saknas" />}
                                                {formatPrice(interest)}
                                            </span>
                                        </div>
                                        <div className={`tooltip-row tooltip-amortization ${amortization > 0 ? 'is-positive' : ''} ${price === 0 ? 'tooltip-warning' : ''}`}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                Amortering (2%)
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {isEstimatedBasis && <InsertChartOutlinedRoundedIcon sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }} titleAccess="Baserat på värdering" />}
                                                {price === 0 && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }} titleAccess="Prisuppgift saknas" />}
                                                <span style={{ opacity: amortization === 0 ? 0.5 : 1 }}>
                                                    {amortization === 0 ? '- kr' : `-${formatPrice(amortization)}`}
                                                </span>
                                            </span>
                                        </div>
                                        <div className={`tooltip-row ${fee === 0 ? 'tooltip-warning' : ''}`}>
                                            <span>Avgift</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {fee === 0 && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }} titleAccess="Avgift saknas" />}
                                                <span style={{ opacity: fee === 0 ? 0.5 : 1 }}>
                                                    {formatPrice(fee)}
                                                </span>
                                            </span>
                                        </div>
                                        <div className={`tooltip-row ${operating === 0 ? 'tooltip-warning' : ''}`}>
                                            <span>Drift</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {operating === 0 && <WarningRoundedIcon sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }} titleAccess="Drift saknas" />}
                                                <span style={{ opacity: operating === 0 ? 0.5 : 1 }}>
                                                    {formatPrice(operating)}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="tooltip-row tooltip-total">
                                            <span>Totalt (inkl. amortering)</span>
                                            <span>{formatPrice(totalWithoutAmortization + amortization)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="card-footer">
                        <button className="share-btn">
                            <IosShareRoundedIcon sx={{ fontSize: '24px' }} />
                        </button>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default ListingCard;
