import { motion } from 'framer-motion';
import HouseIcon from '@mui/icons-material/House';
import ApartmentIcon from '@mui/icons-material/Apartment';

const Navigation = ({
    cityFilter,
    handleCityClick,
    propertyTypeFilter,
    handlePropertyTypeClick
}) => {
    const cities = ['Uppsala'];
    return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* City Selection */}
        <div style={{ display: 'none' }}>
            {/* City Selection Hidden */}
        </div>
        </div>
    );
};

export default Navigation;
