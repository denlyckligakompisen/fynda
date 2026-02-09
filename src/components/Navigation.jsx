import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Navigation component with city selector
 */
const CityLink = ({ name, active, onClick }) => {
    const [hover, setHover] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                cursor: 'pointer',
                paddingBottom: '6px',
                opacity: active ? 1 : (hover ? 0.8 : 0.6),
                fontWeight: active ? 600 : 400,
                transform: hover ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                position: 'relative'
            }}
        >
            {name}
            {active && (
                <motion.div
                    layoutId="city-underline"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: 'white',
                        borderRadius: '1px'
                    }}
                />
            )}
        </div>
    );
};

const Navigation = ({
    cityFilter,
    handleCityClick
}) => {
    return (
        <nav className="mobile-nav">
            <div className="nav-row-scope">
                <div className="city-switch-container" style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', padding: '10px 0' }}>
                    <CityLink
                        name="Stockholm"
                        active={cityFilter === 'Stockholm'}
                        onClick={() => handleCityClick('Stockholm')}
                    />
                    <CityLink
                        name="Uppsala"
                        active={cityFilter === 'Uppsala'}
                        onClick={() => handleCityClick('Uppsala')}
                    />
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
