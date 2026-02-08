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
const Navigation = ({
    cityFilter,
    handleCityClick
}) => {

    const handleSwitchChange = (event) => {
        const newCity = event.target.checked ? 'Uppsala' : 'Stockholm';
        handleCityClick(newCity);
    };

    return (
        <nav className="mobile-nav">
            <div className="nav-row-scope">
                <div className="city-switch-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                        className={`city-label ${cityFilter === 'Stockholm' ? 'active' : ''}`}
                        onClick={() => handleCityClick('Stockholm')}
                        style={{ cursor: 'pointer', opacity: cityFilter === 'Stockholm' ? 1 : 0.5, fontWeight: cityFilter === 'Stockholm' ? 600 : 400 }}
                    >
                        Stockholm
                    </span>

                    <TealSwitch
                        checked={cityFilter === 'Uppsala'}
                        onChange={handleSwitchChange}
                        inputProps={{ 'aria-label': 'City switch' }}
                    />

                    <span
                        className={`city-label ${cityFilter === 'Uppsala' ? 'active' : ''}`}
                        onClick={() => handleCityClick('Uppsala')}
                        style={{ cursor: 'pointer', opacity: cityFilter === 'Uppsala' ? 1 : 0.5, fontWeight: cityFilter === 'Uppsala' ? 600 : 400 }}
                    >
                        Uppsala
                    </span>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
