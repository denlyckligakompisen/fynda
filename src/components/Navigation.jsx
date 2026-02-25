import { Stack } from '@mui/material';

/**
 * Navigation component with city toggle buttons
 */
const Navigation = ({
    cityFilter,
    handleCityClick
}) => {
    const cities = ['Stockholm', 'Uppsala'];

    return (
        <div className="segmented-control">
            {cities.map((city) => (
                <button
                    key={city}
                    className={`segmented-item ${cityFilter === city ? 'active' : ''}`}
                    onClick={() => handleCityClick(city)}
                >
                    {city.toUpperCase()}
                </button>
            ))}
        </div>
    );
};

export default Navigation;
