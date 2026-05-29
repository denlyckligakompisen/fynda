import React from 'react';
import { motion } from 'framer-motion';
import { formatShowingDate, parseShowingDate } from '../utils/formatters';
import './TodayShowings.css';

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

    // Get the first available date
    const firstDate = parseShowingDate(upcomingShowings[0].nextShowing);
    const firstDateKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}-${String(firstDate.getDate()).padStart(2, '0')}`;

    // Filter to only show viewings for the first available date
    const showingsToDisplay = upcomingShowings.filter(item => {
        const d = parseShowingDate(item.nextShowing);
        const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dKey === firstDateKey;
    });

    const heading = formatHeadingDate(viewingDateFilter || firstDateKey);

    return (
        <div className="today-showings-container">
            <div className="today-showings-header">
                <h2 className="today-showings-title">
                    {heading}
                </h2>
                <span className="today-showings-count">
                    {showingsToDisplay.length}
                </span>
            </div>
            <div 
                ref={scrollContainerRef}
                className="today-showings-scroll"
                role="region"
                aria-label="Kommande visningar"
            >
                {showingsToDisplay.map((item) => {
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

                    const booliUrl = item.booliId ? `https://www.booli.se/annons/${item.booliId}` : item.url;

                    return (
                        <div
                            key={item.url}
                            className="today-showing-card"
                        >
                            <motion.a 
                                href={booliUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="today-showing-image-link"
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
                                    className="today-showing-image"
                                />
                            </motion.a>
                            <motion.a 
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="today-showing-info-link"
                                whileTap={{ scale: 0.98 }}
                            >
                                <h3 className="today-showing-address">
                                    {item.address}
                                </h3>
                                {areaOrCity && (
                                    <div className="today-showing-area">
                                        {areaOrCity}
                                    </div>
                                )}
                                <div className="today-showing-time">
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
