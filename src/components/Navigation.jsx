import { useRef, useLayoutEffect, useEffect, useState } from 'react';

/**
 * Navigation component with city selector and area dropdowns
 */
const Navigation = ({
    cityFilter,
    handleCityClick
}) => {
    const labelRefs = {
        Stockholm: useRef(null),
        Uppsala: useRef(null)
    };
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

    // Update underline position
    useLayoutEffect(() => {
        const updateUnderline = () => {
            const activeRef = labelRefs[cityFilter];
            if (activeRef && activeRef.current) {
                const rect = activeRef.current.getBoundingClientRect();
                const parent = activeRef.current.closest('.nav-row-scope');
                if (parent) {
                    const parentRect = parent.getBoundingClientRect();
                    setUnderlineStyle({
                        left: rect.left - parentRect.left,
                        width: rect.width,
                        opacity: 1
                    });
                }
            }
        };

        updateUnderline();
        window.addEventListener('resize', updateUnderline);
        const safetyTimer = setTimeout(updateUnderline, 100);

        return () => {
            window.removeEventListener('resize', updateUnderline);
            clearTimeout(safetyTimer);
        };
    }, [cityFilter]);

    const renderCityButton = (city) => (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => handleCityClick(city)}
                className="nav-scope-btn"
                style={{
                    color: cityFilter === city ? 'white' : '#666',
                    fontWeight: cityFilter === city ? 'bold' : 'normal',
                }}
            >
                <span ref={labelRefs[city]}>
                    {city}
                </span>
            </button>
        </div>
    );

    return (
        <nav className="mobile-nav">
            <div className="nav-row-scope">
                {renderCityButton('Stockholm')}
                {renderCityButton('Uppsala')}
                <div className="nav-underline" style={underlineStyle} />
            </div>
        </nav>
    );
};

export default Navigation;
