import React from 'react';
import { motion } from 'framer-motion';
import { formatShowingDate, parseShowingDate } from '../utils/formatters';

/**
 * Upcoming showings overview component.
 * Shows all upcoming showings from the filtered data, respecting active filters.
 * Only rendered when the viewing filter is active.
 */

// Format date to a nice Swedish heading label
const formatHeadingDate = (dateKey) => {
    if (!dateKey) return 'Visningar';

    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const monthNames = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

    if (target.getTime() === today.getTime()) return 'Visningar idag';
    if (target.getTime() === tomorrow.getTime()) return 'Visningar imorgon';

    const dayNames = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 8 && diffDays > 0) {
        return `Visningar på ${dayNames[date.getDay()]}`;
    }

    return `Visningar ${date.getDate()} ${monthNames[date.getMonth()]}`;
};

const TodayShowings = ({ data, viewingDateFilter }) => {
    const scrollContainerRef = React.useRef(null);
    
    React.useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const now = new Date();

    // Filter out showings that have already started and sort them chronologically
    const upcomingShowings = data.filter(item => {
        if (!item.hasViewing && !item.nextShowing) return false;
        if (!item.nextShowing || !item.nextShowing.fullDateAndTime) return false;

        // Check if the showing has already started or is invalid
        const startDate = parseShowingDate(item.nextShowing);
        if (startDate < now || startDate.getFullYear() === 2099) return false;

        return true;
    }).sort((a, b) => {
        const dateA = parseShowingDate(a.nextShowing);
        const dateB = parseShowingDate(b.nextShowing);
        return dateA.getTime() - dateB.getTime();
    });

    if (upcomingShowings.length === 0) {
        return null;
    }

    // Group showings by date for better visual separation
    const groupedShowings = upcomingShowings.reduce((groups, item) => {
        const date = parseShowingDate(item.nextShowing);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(item);
        return groups;
    }, {});

    const heading = formatHeadingDate(viewingDateFilter);

    return (
        <div className="today-showings" style={{ marginBottom: '24px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 16px 20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {heading}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    {upcomingShowings.length} st
                </span>
            </div>
            <div 
                ref={scrollContainerRef}
                className="today-showings-scroll"
                style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    padding: '0 20px 8px 20px',
                    scrollbarWidth: 'none', // Firefox
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <style>{`
                    .today-showings-scroll::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {upcomingShowings.map((item) => {
                    // Re-format to ensure we show the time if available
                    let displayTime = item.nextShowing.fullDateAndTime || "";
                    
                    // Try to extract time range from raw string
                    const timeMatch = displayTime.match(/\d{2}:\d{2}(?:-\d{2}:\d{2})?/);
                    let timeRange = timeMatch ? timeMatch[0] : "";
                    
                    // Get the formatted date (which includes the day like "Idag", "Imorgon", or "Söndag")
                    let fallbackDate = formatShowingDate(item.nextShowing) || "";
                    
                    // Separate the day part from the time part if it exists
                    const parts = fallbackDate.split(' ');
                    let dayStr = fallbackDate;
                    if (parts.length > 1 && parts[parts.length - 1].match(/^\d{2}:\d{2}$/)) {
                        dayStr = parts.slice(0, -1).join(' ');
                    }

                    const finalTimeStr = timeRange && dayStr ? `${dayStr} ${timeRange}` : fallbackDate;

                    const areaOrCity = item.city || item.area || (item.searchSource ? item.searchSource.split(' (')[0] : '');

                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + (areaOrCity ? ', ' + areaOrCity : ''))}`;

                    return (
                        <div
                            key={item.url}
                            className="today-showing-card"
                            style={{
                                display: 'flex',
                                flex: '0 0 auto',
                                width: '320px',
                                gap: '12px',
                                padding: '12px',
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-card)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                boxSizing: 'border-box'
                            }}
                        >
                            <motion.a 
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', display: 'block' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <img 
                                    src={item.imageUrl || '/placeholder.png'} 
                                    alt={item.address} 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        if (!e.target.src.endsWith('/placeholder.png')) {
                                            e.target.src = '/placeholder.png';
                                        }
                                    }}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            </motion.a>
                            <motion.a 
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1, textDecoration: 'none', color: 'inherit' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <h3 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                                    {item.address}
                                </h3>
                                {areaOrCity && (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {areaOrCity}
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-primary)', marginBottom: '2px', fontWeight: 500, fontSize: '0.95rem' }}>
                                    <span>{finalTimeStr}</span>
                                </div>
                            </motion.a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TodayShowings;
