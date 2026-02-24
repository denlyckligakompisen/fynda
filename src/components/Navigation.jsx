import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

/**
 * Navigation component with city selector icon and dropdown
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
                        backgroundColor: 'var(--text-primary)',
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
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const cities = ['Stockholm', 'Uppsala'];

    return (
        <div className="city-navigation-wrapper" style={{ position: 'relative', zIndex: 1100 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '15px'
                }}
            >
                <LocationCityRoundedIcon sx={{ fontSize: '20px', opacity: 0.8 }} />
                <span>{cityFilter || 'Välj stad'}</span>
                <KeyboardArrowDownRoundedIcon
                    sx={{
                        fontSize: '18px',
                        opacity: 0.5,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            padding: '6px',
                            minWidth: '140px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                            border: '0.5px solid rgba(0,0,0,0.1)',
                            zIndex: 100
                        }}
                    >
                        {cities.map((city) => (
                            <button
                                key={city}
                                onClick={() => {
                                    handleCityClick(city);
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    background: cityFilter === city ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: cityFilter === city ? 600 : 400,
                                    color: cityFilter === city ? 'var(--nav-item-active)' : 'var(--text-primary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {city}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Navigation;
