import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { formatPrice, formatShowingDate } from '../utils/formatters';
import ListingCard from './ListingCard';

const CITY_COORDS = {
    'Stockholm': [59.3293, 18.0686],
    'Uppsala': [59.8586, 17.6389]
};

/**
 * Controller to handle map view updates
 */
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

const MapController = ({ center, bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (center) {
            map.setView(center, 12);
        }
    }, [center, bounds, map]);
    return null;
};

/**
 * Interactive map view for listings
 */
const MapView = ({ data, city, favorites, toggleFavorite, iconFilters, viewingDateFilter }) => {
    const position = CITY_COORDS[city] || CITY_COORDS['Stockholm'];
    const [visibleCount, setVisibleCount] = useState(50);

    // Reset when data changes (filters applied)
    useEffect(() => {
        setVisibleCount(50);
    }, [data]);

    // Progressive loading to prevent UI freeze
    useEffect(() => {
        if (visibleCount < data.length) {
            const timer = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 50, data.length));
            }, 50); // Update every 50ms
            return () => clearTimeout(timer);
        }
    }, [visibleCount, data.length]);

    const displayData = data.slice(0, visibleCount);

    // Calculate bounds to fit all markers
    const bounds = useMemo(() => {
        if (data.length === 0) return null;
        try {
            const validPoints = data
                .filter(item => item.latitude && item.longitude)
                .map(item => [item.latitude, item.longitude]);

            if (validPoints.length === 0) return null;
            return L.latLngBounds(validPoints);
        } catch (e) {
            console.error("Error calculating bounds", e);
            return null;
        }
    }, [data]);

    // Helper to get marker icon
    const getMarkerIcon = (item) => {
        const isUndervalued = (item.priceDiff || 0) > 0;
        const isViewingFilterActive = iconFilters?.viewing || viewingDateFilter;
        
        let labelHtml = '';
        if (isViewingFilterActive && item.nextShowing) {
            const showTime = formatShowingDate(item.nextShowing);
            if (showTime) {
                // Shorten typical formats (e.g. "12 APRIL 15:30" -> "15:30")
                const timeOnly = showTime.includes(':') ? showTime.split(' ').pop() : showTime;
                labelHtml = `<div class="marker-date-label">${timeOnly}</div>`;
            }
        }

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="marker-pin ${isUndervalued ? 'deal' : ''}"></div>
                ${labelHtml}
            `,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
    };

    return (
        <div className="map-wrapper">
            <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="listing-map">
                <MapController center={position} bounds={bounds} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {displayData.map((item) => {
                    if (!item.latitude || !item.longitude) return null;

                    return (
                        <Marker
                            key={item.url}
                            position={[item.latitude, item.longitude]}
                            icon={getMarkerIcon(item)}
                        >
                            <Popup minWidth={300} maxWidth={300}>
                                <ListingCard
                                    item={item}
                                    variant="map"
                                    isFavorite={favorites.includes(item.url)}
                                    toggleFavorite={toggleFavorite}
                                />
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapView;
