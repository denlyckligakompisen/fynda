import React from 'react';
import { motion } from 'framer-motion';
import { formatShowingDate, parseShowingDate } from '../utils/formatters';

const TodayShowings = ({ data }) => {
    const now = new Date();

    // Filter out showings that have already started and sort them chronologically
    const todaysShowings = data.filter(item => {
        if (!item.hasViewing || !item.nextShowing) return false;

        // Check if the showing has already started or is invalid
        const startDate = parseShowingDate(item.nextShowing);
        if (startDate < now || startDate.getFullYear() === 2099) return false;

        return true;
    }).sort((a, b) => {
        const dateA = parseShowingDate(a.nextShowing);
        const dateB = parseShowingDate(b.nextShowing);
        return dateA.getTime() - dateB.getTime();
    });

    if (todaysShowings.length === 0) {
        return null;
    }

    return (
        <div className="today-showings" style={{ marginBottom: '24px', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 16px 20px', color: 'var(--text-primary)' }}>Visningar</h2>
            <div 
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

                {todaysShowings.map((item) => {
                    // Re-format to ensure we show the time if available
                    // The raw booli date might contain "12:30-13:00", so we can prefer showing the original time part if possible
                    // However, fullDateAndTime looks like "Sön 10 maj kl 14:30" or "Sön 10 maj 14:30-15:00"
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
                            style={{
                                display: 'flex',
                                flex: '0 0 auto',
                                background: 'transparent',
                                width: '300px',
                                gap: '12px'
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
