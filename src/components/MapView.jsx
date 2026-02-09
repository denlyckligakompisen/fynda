import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { formatPrice } from '../utils/formatters';

const CITY_COORDS = {
    'Stockholm': [59.3293, 18.0686],
    'Uppsala': [59.8586, 17.6389]
};

/**
 * Controller to handle map view updates
 */
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

const MapController = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

/**
 * Interactive map view for listings
 */
const MapView = ({ data, city, isFavorite, toggleFavorite }) => {
    const position = CITY_COORDS[city] || CITY_COORDS['Stockholm'];

    // Memoize icons to avoid recreating on every render
    const markerIcons = useMemo(() => ({
        normal: L.divIcon({
            className: 'custom-div-icon',
            html: '<div class="marker-pin"></div>',
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        }),
        deal: L.divIcon({
            className: 'custom-div-icon',
            html: '<div class="marker-pin deal"></div>',
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        })
    }), []);

    return (
        <div className="map-wrapper">
            <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="listing-map">
                <MapController center={position} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={50}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                    polygonOptions={{
                        fillColor: '#6366f1',
                        color: '#6366f1',
                        weight: 0.5,
                        opacity: 0.1,
                        fillOpacity: 0.05
                    }}
                >
                    {data.map((item) => {
                        if (!item.latitude || !item.longitude) return null;

                        const isUndervalued = (item.priceDiff || 0) > 0;
                        const iconKey = isUndervalued ? 'deal' : 'normal';

                        return (
                            <Marker
                                key={item.url}
                                position={[item.latitude, item.longitude]}
                                icon={markerIcons[iconKey]}
                            >
                                <Popup>
                                    <div className="map-popup-content">
                                        <div className="map-popup-header">
                                            <strong>{item.address}</strong>
                                            <span className="map-popup-area">{item.area}</span>
                                        </div>
                                        <div className="map-popup-price">
                                            <span className={`map-popup-diff ${item.priceDiff < 0 ? 'negative' : 'positive'}`}>
                                                {item.priceDiff > 0 ? '+' : ''}{formatPrice(item.priceDiff)}
                                            </span>
                                        </div>
                                        <div className="map-popup-details">
                                            {item.rooms} rum · {item.livingArea} m²
                                        </div>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="map-popup-link">
                                            Visa objekt <OpenInNewRoundedIcon sx={{ fontSize: '1.2em', verticalAlign: 'middle', ml: 0.5 }} />
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};

export default MapView;
