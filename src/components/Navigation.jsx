import { motion } from 'framer-motion';

/**
 * Navigation component with city toggle buttons and sliding animation
 */
const Navigation = ({
    cityFilter,
    handleCityClick
}) => {
    const cities = ['Stockholm', 'Uppsala'];

    return (
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
    );
};

export default Navigation;
