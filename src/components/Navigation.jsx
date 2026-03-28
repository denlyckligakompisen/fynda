import { motion } from 'framer-motion';
import HouseIcon from '@mui/icons-material/House';
import ApartmentIcon from '@mui/icons-material/Apartment';

const Navigation = ({
    cityFilter,
    handleCityClick,
    propertyTypeFilter,
    handlePropertyTypeClick
}) => {
    const cities = ['Stockholm', 'Uppsala'];
    const propertyTypes = [
        { id: 'Lägenhet', icon: <ApartmentIcon sx={{ fontSize: '1.2rem' }} /> },
        { id: 'Hus', icon: <HouseIcon sx={{ fontSize: '1.2rem' }} /> }
    ];

    return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* City Selection */}
            <div className="segmented-control" style={{ position: 'relative' }}>
                {cities.map((city) => (
                    <button
                        key={city}
                        className={`segmented-item ${cityFilter === city ? 'active' : ''}`}
                        onClick={() => handleCityClick(city)}
                        style={{ position: 'relative', background: 'transparent', zIndex: 1 }}
                    >
                        {city.toUpperCase()}
                        {cityFilter === city && (
                            <motion.div
                                layoutId="active-city-bg"
                                className="segmented-active-bg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: '#ffffff',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                    zIndex: -1
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Property Type Selection */}
            <div className="segmented-control" style={{ position: 'relative' }}>
                {propertyTypes.map((type) => (
                    <button
                        key={type.id}
                        className={`segmented-item ${propertyTypeFilter === type.id ? 'active' : ''}`}
                        onClick={() => handlePropertyTypeClick(type.id)}
                        style={{
                            position: 'relative',
                            background: 'transparent',
                            zIndex: 1,
                            minWidth: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 12px'
                        }}
                    >
                        {type.icon}
                        {propertyTypeFilter === type.id && (
                            <motion.div
                                layoutId="active-type-bg"
                                className="segmented-active-bg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: '#ffffff',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                    zIndex: -1
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Navigation;
