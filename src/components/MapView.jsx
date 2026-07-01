import { MapContainer, TileLayer, Marker, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, formatShowingDate } from '../utils/formatters';
import { useFilterContext } from '../context/FilterContext';
import MarkerClusterGroup from 'react-leaflet-cluster';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import LocationSearchingRoundedIcon from '@mui/icons-material/LocationSearchingRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';

const { BaseLayer } = LayersControl;

const CITY_COORDS = {
    'Stockholm': [59.3293, 18.0686],
    'Uppsala': [59.8586, 17.6389]
};

/**
 * Controller to handle map view updates and tracking
 */
const MapController = ({ center, bounds, userLocation, isFollowingUser, setIsFollowingUser, resetTrigger, onBoundsChange }) => {
    const map = useMap();
    
    // Listen for manual moves and bounds changes
    useMapEvents({
        dragstart: () => setIsFollowingUser(false),
        zoomstart: () => setIsFollowingUser(false),
        touchstart: () => setIsFollowingUser(false),
        mousedown: () => setIsFollowingUser(false),
        moveend: () => {
            if (onBoundsChange) {
                onBoundsChange(map.getBounds());
            }
        }
    });

    useEffect(() => {
        // Robust resize observer to prevent gray empty spaces in Leaflet
        const container = map.getContainer();
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
            if (!userLocation && bounds && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
            }
        });
        
        resizeObserver.observe(container);

        if (isFollowingUser && userLocation) {
            map.setView(userLocation, map.getZoom(), { animate: true });
        } else if (!userLocation && bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
        } else if (!userLocation && center) {
            map.setView(center, 14);
        }
        
        const timeout1 = setTimeout(() => map.invalidateSize(), 100);
        const timeout2 = setTimeout(() => map.invalidateSize(), 500);
        
        return () => {
            resizeObserver.disconnect();
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, [center, bounds, map, userLocation, isFollowingUser]);

    useEffect(() => {
        if (resetTrigger > 0) {
            setIsFollowingUser(false);
            if (bounds && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
            } else if (center) {
                map.setView(center, 14);
            }
        }
    }, [resetTrigger, bounds, center, map, setIsFollowingUser]);

    return null;
};

/**
 * Interactive map view for listings
 */
const MapView = ({ city, hoveredListingUrl, onMarkerClick }) => {
    const { mapData, filteredData: data, favorites, toggleFavorite, iconFilters, viewingDateFilter, setMapBounds } = useFilterContext();
    const position = CITY_COORDS[city] || CITY_COORDS['Stockholm'];
    const [mapType, setMapType] = useState('satellit'); // 'karta' or 'satellit'
    const [userLocation, setUserLocation] = useState(null);
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [resetTrigger, setResetTrigger] = useState(0);
    const watchIdRef = useRef(null);

    // Clear map bounds on unmount so the list isn't filtered when the map is not shown
    useEffect(() => {
        return () => {
            setMapBounds(null);
        };
    }, [setMapBounds]);

    // Calculate bounds to fit all markers
    const bounds = useMemo(() => {
        // If we are in isolated/detail view of a specific listing, zoom to that listing
        const isolatedItem = (mapData || []).find(item => window.location.pathname === `/${item.booliId}`)
            || (data || []).find(item => window.location.pathname === `/${item.booliId}`);

        if (isolatedItem && isolatedItem.latitude && isolatedItem.longitude) {
            try {
                return L.latLngBounds([[isolatedItem.latitude, isolatedItem.longitude]]);
            } catch (e) {
                console.error("Error calculating isolated bounds", e);
            }
        }

        const markersData = mapData && mapData.length > 0 ? mapData : data;
        if (markersData.length === 0) return null;
        try {
            const validPoints = markersData
                .filter(item => item.latitude && item.longitude)
                .map(item => [item.latitude, item.longitude]);

            if (validPoints.length === 0) return null;
            return L.latLngBounds(validPoints);
        } catch (e) {
            console.error("Error calculating bounds", e);
            return null;
        }
    }, [mapData, window.location.pathname]);

    const handleLocateUser = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation stöds inte av din webbläsare");
            return;
        }

        // If we want to toggle ON tracking, or if it's already on, just re-center
        if (!isFollowingUser || !userLocation) {
            setIsFollowingUser(true);
            setIsLocating(true);
        }

        if (watchIdRef.current === null) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const newPos = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(newPos);
                    setIsLocating(false);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setIsLocating(false);
                    setIsFollowingUser(false);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, [isFollowingUser, userLocation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // Try to auto-locate on initial mount ONLY on mobile
    useEffect(() => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            handleLocateUser();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
    const getMarkerIcon = (item, isHovered, isIsolated) => {
        const diffPercent = item.listPrice && item.estimatedValue 
            ? Math.round(((item.listPrice - item.estimatedValue) / item.estimatedValue) * 100)
            : 1;
        let pinClass = '';
        if (diffPercent < 0) pinClass = 'deal';
        else if (diffPercent === 0) pinClass = 'blue-pin';

        const isViewingFilterActive = iconFilters?.viewing || viewingDateFilter;
        const isFavorite = favorites.includes(String(item.booliId)) || favorites.includes(item.url);
        
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

        const heartSvg = isFavorite ? `<svg class="marker-heart" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` : '';

        return L.divIcon({
            className: `custom-div-icon ${isHovered ? 'hovered-marker' : ''} ${isIsolated ? 'isolated-marker' : ''}`,
            html: `
                <div class="marker-pin ${pinClass} ${isFavorite ? 'favorite' : ''} ${isHovered ? 'hovered' : ''} ${isIsolated ? 'isolated-pulse' : ''}">
                    ${heartSvg}
                </div>
                ${labelHtml}
            `,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
    };

    const mapTypes = [
        { id: 'karta', label: 'Karta', icon: <MapRoundedIcon sx={{ fontSize: 20 }} /> },
        { id: 'satellit', label: 'Satellit', icon: <PublicRoundedIcon sx={{ fontSize: 20 }} /> }
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
                    background: 'var(--nav-bg)', 
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    padding: '4px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border-color)'
                }}>
                    {mapTypes.map((type) => (
                        <button
                            key={type.id}
                            className={`segmented-item ${mapType === type.id ? 'active' : ''}`}
                            onClick={() => setMapType(type.id)}
                            aria-label={`Byt till ${type.label.toLowerCase()}`}
                            aria-pressed={mapType === type.id}
                            style={{ 
                                position: 'relative', 
                                background: 'transparent', 
                                zIndex: 1,
                                padding: '6px 10px',
                                minWidth: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: mapType === type.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}
                        >
                            {type.icon}
                            {mapType === type.id && (
                                <motion.div
                                    layoutId="active-map-bg"
                                    className="segmented-active-bg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'var(--segmented-item-bg)',
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

            {/* GPS Button - Mobile Only */}
            {window.innerWidth <= 768 && (
                <button 
                    className={`gps-button ${isFollowingUser ? 'active' : ''}`} 
                    onClick={handleLocateUser}
                    title={isFollowingUser ? "Följer position" : "Visa min position"}
                    aria-label={isFollowingUser ? "Sluta följa min position" : "Visa min position"}
                >
                    {isFollowingUser ? (
                        <MyLocationRoundedIcon style={{ fontSize: '22px' }} />
                    ) : (
                        <LocationSearchingRoundedIcon style={{ fontSize: '22px', color: 'var(--text-tertiary)' }} />
                    )}
                    {isLocating && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(0, 122, 255, 0.3)', borderTopColor: 'transparent' }}
                        />
                    )}
                </button>
            )}

            {/* Reset Map Button - Top Left */}
            <button 
                className="gps-button reset-map-button" 
                onClick={() => setResetTrigger(prev => prev + 1)}
                title="Återställ vy"
                aria-label="Återställ kartvy till startläget"
                style={{
                    position: 'absolute',
                    top: '24px',
                    left: '24px',
                    zIndex: 1000,
                    right: 'auto',
                    bottom: 'auto',
                    width: '36px',
                    height: '36px'
                }}
            >
                <RestartAltRoundedIcon style={{ fontSize: '20px', color: 'var(--text-secondary)' }} />
            </button>

            <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="listing-map" attributionControl={false} zoomControl={false}>
                <MapController 
                    center={position} 
                    bounds={bounds} 
                    userLocation={userLocation} 
                    isFollowingUser={isFollowingUser} 
                    setIsFollowingUser={setIsFollowingUser}
                    resetTrigger={resetTrigger}
                    onBoundsChange={setMapBounds}
                />
                
                <AnimatePresence mode="wait">
                    {mapType === 'karta' ? (
                        <TileLayer
                            key="karta"
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t%3A2%7Cp.v%3Aoff"
                            maxZoom={20}
                        />
                    ) : (
                        <TileLayer
                            key="satellit"
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&apistyle=s.t%3A2%7Cp.v%3Aoff"
                            maxZoom={20}
                        />
                    )}
                </AnimatePresence>

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={userIcon} zIndexOffset={1000} />
                )}

                {/* Markers (unclustered) */}
                {(mapData || data).map((item) => {
                    if (!item.latitude || !item.longitude) return null;

                    const isIsolated = window.location.pathname === `/${item.booliId}`;
                    const isHovered = item.url === hoveredListingUrl;

                    return (
                        <Marker
                            key={item.url}
                            position={[item.latitude, item.longitude]}
                            icon={getMarkerIcon(item, isHovered, isIsolated)}
                            zIndexOffset={isHovered || isIsolated ? 1000 : 0}
                            eventHandlers={{
                                click: () => {
                                    window.location.href = `/${item.booliId}`;
                                }
                            }}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapView;
