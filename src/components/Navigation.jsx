import { useRef, useLayoutEffect, useEffect, useState } from 'react';

/**
 * Navigation component with city selector and area dropdowns
 */
const Navigation = ({
    cityFilter,
    handleCityClick
}) => {
    const parentRef = useRef(null);
    const labelRefs = {
        Stockholm: useRef(null),
        Uppsala: useRef(null)
    };
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

    const updateUnderline = () => {
        const activeRef = labelRefs[cityFilter];
        if (activeRef && activeRef.current && parentRef.current) {
            const rect = activeRef.current.getBoundingClientRect();
            const parentRect = parentRef.current.getBoundingClientRect();
            setUnderlineStyle({
                left: rect.left - parentRect.left,
                width: rect.width,
                opacity: 1
            });
        }
    };

    // Update on city change
    useLayoutEffect(() => {
        updateUnderline();
    }, [cityFilter]);

    // Robust ResizeObserver for font loads or layout shifts
    useEffect(() => {
        if (!parentRef.current) return;

        const observer = new ResizeObserver(updateUnderline);
        observer.observe(parentRef.current);

        // Also check children for width changes (like if a font loads late)
        Object.values(labelRefs).forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        // Safety interval for the first few seconds
        const interval = setInterval(updateUnderline, 500);
        const timeout = setTimeout(() => clearInterval(interval), 3000);

        window.addEventListener('resize', updateUnderline);

        return () => {
            observer.disconnect();
            clearInterval(interval);
            clearTimeout(timeout);
            window.removeEventListener('resize', updateUnderline);
        };
    }, []);

    const renderCityButton = (city) => (
        <div className="nav-city-wrapper">
            <button
                onClick={() => handleCityClick(city)}
                className={`nav-scope-btn ${cityFilter === city ? 'active' : ''}`}
            >
                <span ref={labelRefs[city]}>
                    {city}
                </span>
            </button>
        </div>
    );

    return (
        <nav className="mobile-nav">
            <div className="nav-row-scope" ref={parentRef}>
                {renderCityButton('Stockholm')}
                {renderCityButton('Uppsala')}
                <div className="nav-underline" style={underlineStyle} />
            </div>
        </nav>
    );
};

export default Navigation;
