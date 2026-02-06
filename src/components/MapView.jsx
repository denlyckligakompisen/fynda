import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { formatPrice } from '../utils/formatters';

// ... (marker logic remains same)

const CITY_COORDS = {
    'Stockholm': [59.3293, 18.0686],
    'Uppsala': [59.8586, 17.6389]
};

/**
 * Controller to handle map view updates
 */
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

    return (
        <div className="map-wrapper">
            <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="listing-map">
                <MapController center={position} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {data.map((item) => {
                    if (!item.latitude || !item.longitude) return null;

                    const isDeal = item.dealScore > 0.4;
                    const customIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div class="marker-pin ${isDeal ? 'deal' : ''}"></div>`,
                        iconSize: [30, 42],
                        iconAnchor: [15, 42]
                    });

                    return (
                        <Marker
                            key={item.url}
                            position={[item.latitude, item.longitude]}
                            icon={customIcon}
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
                                        Visa objekt ↗
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapView;
