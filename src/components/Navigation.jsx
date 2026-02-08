import { useState, useRef, useEffect } from 'react';
import { Switch, styled } from '@mui/material';

// Styled Switch for custom appearance (Teal accent)
const TealSwitch = styled(Switch)(({ theme }) => ({
    padding: 8,
    '& .MuiSwitch-track': {
        borderRadius: 22 / 2,
        '&:before, &:after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: 'none',
        width: 16,
        height: 16,
        margin: 2,
        backgroundColor: '#fff', // White thumb
    },
    '& .MuiSwitch-switchBase': {
        '&.Mui-checked': {
            color: '#3b8d99', // Teal when checked
            transform: 'translateX(20px)', // Adjust translation
            '& + .MuiSwitch-track': {
                backgroundColor: '#3b8d99', // Teal track when checked
                opacity: 0.5,
            },
        },
        '& + .MuiSwitch-track': {
            backgroundColor: '#666', // Grey track when unchecked
            opacity: 0.5,
        }
    },
}));

/**
 * Navigation component with city selector using MUI Switch
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
                userSelect: 'none'
            }}
        >
            {name}
        </div>
    );
};

const Navigation = ({
    cityFilter,
    handleCityClick
}) => {
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const stockholmRef = useRef(null);
    const uppsalaRef = useRef(null);

    useEffect(() => {
        const activeRef = cityFilter === 'Stockholm' ? stockholmRef : uppsalaRef;
        if (activeRef.current) {
            const { offsetLeft, clientWidth } = activeRef.current;
            setIndicatorStyle({ left: offsetLeft, width: clientWidth });
        }
    }, [cityFilter]);

    return (
        <nav className="mobile-nav">
            <div className="nav-row-scope">
                <div className="city-switch-container" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>

                    {/* Animated Indicator */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            height: '2px',
                            backgroundColor: 'white',
                            borderRadius: '1px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            ...indicatorStyle
                        }}
                    />

                    <div ref={stockholmRef}>
                        <CityLink
                            name="Stockholm"
                            active={cityFilter === 'Stockholm'}
                            onClick={() => handleCityClick('Stockholm')}
                        />
                    </div>
                    <div ref={uppsalaRef}>
                        <CityLink
                            name="Uppsala"
                            active={cityFilter === 'Uppsala'}
                            onClick={() => handleCityClick('Uppsala')}
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
