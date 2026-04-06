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

            {/* Property Type Selection (Icons Only) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                    className={`property-type-toggle icon-only ${propertyTypeFilter === 'Lägenhet' ? 'active' : ''}`}
                    onClick={() => handlePropertyTypeClick('Lägenhet')}
                    title="Lägenheter"
                >
                    <ApartmentIcon />
                </button>
                <button
                    className={`property-type-toggle icon-only ${propertyTypeFilter === 'Hus' ? 'active' : ''}`}
                    onClick={() => handlePropertyTypeClick('Hus')}
                    title="Hus & Radhus"
                >
                    <HouseIcon />
                </button>
            </div>
        </div>
    );
};

export default Navigation;
