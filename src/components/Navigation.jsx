import { motion } from 'framer-motion';
import HouseIcon from '@mui/icons-material/House';
import ApartmentIcon from '@mui/icons-material/Apartment';

const Navigation = ({
    cityFilter,
    handleCityClick,
    cities = [],
    propertyTypeFilter,
    propertyTypes = [],
    handlePropertyTypeClick
}) => {
    return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
            {/* City Selection */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {cities.map(city => (
                    <button
                        key={city}
                        className={`city-filter-btn ${cityFilter === city ? 'active' : ''}`}
                        onClick={() => handleCityClick(city)}
                    >
                        {city}
                    </button>
                ))}
            </div>

            {/* Property Type Selection (Dynamic Icons) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {propertyTypes.map(type => (
                    <button
                        key={type}
                        className={`property-type-toggle icon-only ${propertyTypeFilter === type ? 'active' : ''}`}
                        onClick={() => handlePropertyTypeClick(type)}
                        title={type === 'Lägenhet' ? 'Lägenheter' : 'Hus & Radhus'}
                    >
                        {type === 'Lägenhet' ? <ApartmentIcon /> : <HouseIcon />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Navigation;
