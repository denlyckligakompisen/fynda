import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, formatShowingDate } from '../utils/formatters';
import ListingCard from './ListingCard';

const { BaseLayer } = LayersControl;

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
    const [mapType, setMapType] = useState('karta'); // 'karta' or 'satellit'

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

    const mapTypes = [
        { id: 'karta', label: 'KARTA' },
        { id: 'satellit', label: 'SATELLIT' }
    ];

    return (
        <div className="map-wrapper" style={{ position: 'relative' }}>
            {/* Custom Map Type Switch - Matches City Switch Styling */}
            <div style={{ 
                position: 'absolute', 
                top: '24px', 
                right: '24px', 
                zIndex: 1000,
                pointerEvents: 'auto'
            }}>
                <div className="segmented-control" style={{ 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    padding: '4px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    {mapTypes.map((type) => (
                        <button
                            key={type.id}
                            className={`segmented-item ${mapType === type.id ? 'active' : ''}`}
                            onClick={() => setMapType(type.id)}
                            style={{ 
                                position: 'relative', 
                                background: 'transparent', 
                                zIndex: 1,
                                padding: '6px 16px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px'
                            }}
                        >
                            {type.label}
                            {mapType === type.id && (
                                <motion.div
                                    layoutId="active-map-bg"
                                    className="segmented-active-bg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: '#ffffff',
                                        borderRadius: '10px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                                        zIndex: -1
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="listing-map" attributionControl={false} zoomControl={false}>
                <MapController center={position} bounds={bounds} />
                
                <AnimatePresence mode="wait">
                    {mapType === 'karta' ? (
                        <TileLayer
                            key="karta"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    ) : (
                        <TileLayer
                            key="satellit"
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    )}
                </AnimatePresence>

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
