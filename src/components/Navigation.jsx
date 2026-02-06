import { useRef, useLayoutEffect, useEffect, useState } from 'react';

/**
 * Navigation component with city selector and area dropdowns
 */
const Navigation = ({
    cityFilter,
    areaFilter,
    expandedCity,
    setExpandedCity,
    stockholmAreas,
    uppsalaAreas,
    handleCityClick,
    handleAreaSelect,
    handleSort,
    sortBy,
    sortDirection,
    isLoading
}) => {
    const navRefs = {
        Stockholm: useRef(null),
        Uppsala: useRef(null)
    };
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

    // Update underline position
    useLayoutEffect(() => {
        const updateUnderline = () => {
            const activeRef = navRefs[cityFilter];
            if (activeRef && activeRef.current) {
                setUnderlineStyle({
                    left: activeRef.current.offsetLeft,
                    width: activeRef.current.offsetWidth,
                    opacity: 1
                });
            }
        };

        updateUnderline();
        window.addEventListener('resize', updateUnderline);
        const safetyTimer = setTimeout(updateUnderline, 50);

        return () => {
            window.removeEventListener('resize', updateUnderline);
            clearTimeout(safetyTimer);
        };
    }, [cityFilter, areaFilter, isLoading, expandedCity]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (expandedCity) {
                const activeRef = navRefs[expandedCity];
                if (activeRef.current && !activeRef.current.contains(event.target)) {
                    setExpandedCity(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expandedCity, setExpandedCity]);

    const renderCityButton = (city, areas) => (
        <div style={{ position: 'relative' }} ref={navRefs[city]}>
            <button
                onClick={() => handleCityClick(city, expandedCity, setExpandedCity)}
                className="nav-scope-btn"
                style={{
                    color: cityFilter === city ? 'white' : '#666',
                    fontWeight: cityFilter === city ? 'bold' : 'normal',
                }}
            >
                {city} {cityFilter === city ? (areaFilter ? `(${areaFilter}) ▾` : ' ▾') : ''}
            </button>

            {expandedCity === city && (
                <div className="dropdown-menu">
                    <button
                        className={`dropdown-item ${cityFilter === city && areaFilter === null ? 'active' : ''}`}
                        onClick={() => handleAreaSelect(null, city, setExpandedCity)}
                    >
                        Alla områden
                    </button>
                    {areas.map(area => (
                        <button
                            key={area}
                            className={`dropdown-item ${cityFilter === city && areaFilter === area ? 'active' : ''}`}
                            onClick={() => handleAreaSelect(area, city, setExpandedCity)}
                        >
                            {area}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <nav className="nav-container">
            {/* Row 1: Scope (City) */}
            <div className="nav-row-scope" style={{ position: 'relative' }}>
                {renderCityButton('Stockholm', stockholmAreas)}
                {renderCityButton('Uppsala', uppsalaAreas)}

                <div className="nav-underline" style={underlineStyle} />
            </div>

            {/* Row 1.5: Sorting */}
            <div className="nav-row-sort">
                <button
                    onClick={() => handleSort('dealScore')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: sortBy === 'dealScore' ? '#fff' : '#666',
                        fontSize: '0.85rem',
                        fontWeight: sortBy === 'dealScore' ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span>🔥</span> Fyndchans {sortBy === 'dealScore' && (sortDirection === 'desc' ? '↓' : '↑')}
                </button>
            </div>
        </nav>
    );
};

export default Navigation;
