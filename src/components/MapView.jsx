import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState, useCallback } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, formatShowingDate } from '../utils/formatters';
import ListingCard from './ListingCard';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';

const { BaseLayer } = LayersControl;

const CITY_COORDS = {
    'Stockholm': [59.3293, 18.0686],
    'Uppsala': [59.8586, 17.6389]
};

/**
 * Controller to handle map view updates
 */
const MapController = ({ center, bounds, userLocation, shouldCenterUser }) => {
    const map = useMap();

    useEffect(() => {
        if (shouldCenterUser && userLocation) {
            map.setView(userLocation, 16, { animate: true });
        } else if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (center) {
            map.setView(center, 12);
        }
    }, [center, bounds, map, userLocation, shouldCenterUser]);
    return null;
};

/**
 * Interactive map view for listings
 */
const MapView = ({ data, city, favorites, toggleFavorite, iconFilters, viewingDateFilter }) => {
    const position = CITY_COORDS[city] || CITY_COORDS['Stockholm'];
    const [visibleCount, setVisibleCount] = useState(50);
    const [mapType, setMapType] = useState('karta'); // 'karta' or 'satellit'
    const [userLocation, setUserLocation] = useState(null);
    const [shouldCenterUser, setShouldCenterUser] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

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

    const handleLocateUser = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation stöds inte av din webbläsare");
            return;
        }

        setIsLocating(true);
        setShouldCenterUser(true);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(newPos);
                setIsLocating(false);
                // Reset centering flag after a short delay so manual moves work
                setTimeout(() => setShouldCenterUser(false), 2000);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setIsLocating(false);
                setShouldCenterUser(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Fetch position automatically on mount
    useEffect(() => {
        const cleanup = handleLocateUser();
        return () => {
            if (cleanup) cleanup();
        };
    }, [handleLocateUser]);

    // Custom user location icon
    const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `
            <div class="user-location-wrapper">
                <div class="user-location-pulse"></div>
                <div class="user-location-dot"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    // Helper to get marker icon
    const getMarkerIcon = (item) => {
        const isUndervalued = (item.priceDiff || 0) > 0;
        const isViewingFilterActive = iconFilters?.viewing || viewingDateFilter;
        
        let labelHtml = '';
        if (isViewingFilterActive && item.nextShowing) {
            let showTime = formatShowingDate(item.nextShowing);
            if (showTime) {
                if (!viewingDateFilter) {
                    showTime = showTime.replace(/\s+\d{2}:\d{2}$/, '');
                } else {
                    const parts = showTime.split(' ');
                    if (parts.length > 1) {
                        showTime = parts[parts.length - 1];
                    }
                }
                labelHtml = `<div class="marker-date-label">${showTime}</div>`;
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
            {/* Custom Map Type Switch */}
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

            {/* GPS Button */}
            <button 
                className={`gps-button ${userLocation ? 'active' : ''}`} 
                onClick={handleLocateUser}
                title="Visa min position"
            >
                <MyLocationRoundedIcon style={{ fontSize: '20px' }} />
                {isLocating && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(0, 122, 255, 0.3)', borderTopColor: 'transparent' }}
                    />
                )}
            </button>

            <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="listing-map" attributionControl={false} zoomControl={false}>
                <MapController center={position} bounds={bounds} userLocation={userLocation} shouldCenterUser={shouldCenterUser} />
                
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

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={userIcon} zIndexOffset={1000}>
                        <Popup>
                            <div style={{ textAlign: 'center', fontWeight: 600 }}>Du är här</div>
                        </Popup>
                    </Marker>
                )}

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
