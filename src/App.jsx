import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import dataFile from './data.json';

function App() {
    const [data, setData] = useState([]);

    // Two-layer filter state
    const [cityFilter, setCityFilter] = useState('Stockholm');
    const [areaFilter, setAreaFilter] = useState(null); // Specific area within a city

    // UI State for Dropdowns
    const [expandedCity, setExpandedCity] = useState(null); // 'Stockholm' or null

    // Attribute Filters
    const [topFloorFilter, setTopFloorFilter] = useState(false);

    // Multi-select icon filters: { bidding: boolean, viewing: boolean, new: boolean, nearby: boolean }
    const [iconFilters, setIconFilters] = useState({
        bidding: false,
        viewing: false,
        new: false,
        nearby: false
    });

    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(25);
    const [viewState, setViewState] = useState('intro'); // 'intro' | 'app'
    const [isScrolled, setIsScrolled] = useState(false);

    // Sliding Underline Refs & State
    const navRefs = {
        Stockholm: useRef(null),
        Uppsala: useRef(null)
    };
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

    useEffect(() => {
        // Data Loading
        const rawObjects = dataFile?.objects || [];
        const processed = rawObjects
            .filter(item => item.priceDiff > 0)
            .sort((a, b) => (b.priceDiff || 0) - (a.priceDiff || 0));

        setData(processed);

        // Show content
        setTimeout(() => setIsLoading(false), 800);

        // Intro Timer
        const introTimer = setTimeout(() => {
            setViewState('app');
        }, 2000); // 2 seconds total for intro

        // Scroll Listener
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(introTimer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Effect to update underline position when cityFilter or areaFilter changes
    // useLayoutEffect prevents visual jumping by measuring before paint
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

        // Update immediately
        updateUnderline();

        // Update on resize (since flex centering shifts positions)
        window.addEventListener('resize', updateUnderline);

        // Small safety timeout for font loading/transitions
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [expandedCity]);

    // Compute unique areas
    const stockholmAreas = [...new Set(data.filter(item => (item.searchSource || '').includes('Stockholm') && item.area).map(item => item.area))].sort();
    const uppsalaAreas = [...new Set(data.filter(item => (item.searchSource || '').includes('Uppsala') && item.area).map(item => item.area))].sort();

    const filteredData = data.filter(item => {
        const source = item.searchSource || '';

        // 1. Scope (City)
        if (!source.includes(cityFilter)) return false;

        // 2. Area Filter (within City)
        if (areaFilter && item.area !== areaFilter) return false;

        // 3. Attributes (Top Floor)
        if (topFloorFilter) {
            if (!source.toLowerCase().includes('top floor')) return false;
        }

        // 4. Icon Filters (AND logic - item must match ALL active filters)
        if (iconFilters.bidding && !item.biddingOpen) return false;
        if (iconFilters.viewing && !item.hasViewing) return false;
        if (iconFilters.new && !item.isNew) return false;
        if (iconFilters.nearby && cityFilter !== 'Uppsala') {
            // Filter: Any commute option < 15 mins
            const walking = item.walkingTimeMinutes !== null ? item.walkingTimeMinutes : 999;
            const biking = item.bicycleTimeMinutes !== null ? item.bicycleTimeMinutes : 999;
            const transit = item.commuteTimeMinutes !== null ? item.commuteTimeMinutes : 999;

            if (walking >= 15 && biking >= 15 && transit >= 15) return false;
        }

        return true;
    });

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(25);
    }, [cityFilter, areaFilter, topFloorFilter, iconFilters]);

    const isAnyFilterActive = !!areaFilter || topFloorFilter || Object.values(iconFilters).some(v => v);
    const displayData = isAnyFilterActive ? filteredData : filteredData.slice(0, visibleCount);

    const loadMoreRef = useRef(null);
    useEffect(() => {
        if (isAnyFilterActive) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (target.isIntersecting) {
                    setVisibleCount(prev => {
                        // Only increment if we actually have more to show
                        if (prev < filteredData.length) {
                            return prev + 25;
                        }
                        return prev;
                    });
                }
            },
            {
                threshold: 0,
                rootMargin: '400px' // Start loading 400px before reaching the bottom
            }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [isAnyFilterActive, filteredData.length]); // Re-run only if filter state or total data changes

    const toggleIconFilter = (type) => {
        setIconFilters(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const toggleTopFloor = () => setTopFloorFilter(prev => !prev);

    // Dropdown Timer Ref
    const closeTimeoutRef = useRef(null);

    const handleCityClick = (city) => {
        if (cityFilter !== city) {
            // Switching city: Just switch, don't open dropdown
            setCityFilter(city);
            setAreaFilter(null);
            setExpandedCity(null);
        } else {
            // Already active: Toggle dropdown
            setExpandedCity(prev => prev === city ? null : city);
        }
    };

    const handleAreaSelect = (area, city) => {
        setCityFilter(city); // Ensure city is set
        setAreaFilter(area);
        setExpandedCity(null); // Close dropdown
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '-';
        return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(price);
    };

    const CountUp = ({ end, duration = 1500, animate = true }) => {
        const [count, setCount] = useState(animate ? 0 : end);
        const [hasStarted, setHasStarted] = useState(false);
        const elementRef = useRef(null);

        useEffect(() => {
            if (!animate) {
                setCount(end);
                return;
            }

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setHasStarted(true);
                        observer.disconnect();
                    }
                },
                { threshold: 0.1 }
            );

            if (elementRef.current) {
                observer.observe(elementRef.current);
            }

            return () => observer.disconnect();
        }, [animate, end]);

        useEffect(() => {
            if (!animate) {
                setCount(end);
                return;
            }

            if (!hasStarted) return;

            let startTime = null;
            let animationFrameId;

            const animateFn = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);

                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);

                setCount(Math.floor(ease * end));

                if (progress < 1) {
                    animationFrameId = window.requestAnimationFrame(animateFn);
                }
            };

            animationFrameId = window.requestAnimationFrame(animateFn);

            return () => window.cancelAnimationFrame(animationFrameId);
        }, [end, duration, animate, hasStarted]);

        const formatted = formatPrice(count).replace(/\s?kr/g, '').trim();
        return <span ref={elementRef}>{formatted}</span>;
    };

    const SkeletonCard = () => (
        <article style={{ marginBottom: '3rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}>
            {/* Header / Address */}
            <div style={{ marginBottom: '1.25rem', height: '1.5rem', width: '50%', background: '#333', borderRadius: '4px', margin: '0 auto' }}></div>

            {/* Hero Metric */}
            <div style={{ marginBottom: '1.25rem', height: '2.5rem', width: '30%', background: '#333', borderRadius: '4px', margin: '0 auto' }}></div>

            {/* Secondary Metrics (2 cols) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '1.25rem' }}>
                <div style={{ height: '1.2rem', width: '20%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '1.2rem', width: '20%', background: '#333', borderRadius: '4px' }}></div>
            </div>

            {/* Commute (Optional) */}
            <div style={{ height: '1rem', width: '40%', background: '#333', borderRadius: '4px', margin: '0 auto', opacity: 0.5 }}></div>
        </article>
    );

    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (!isLoading && !hasAnimated) {
            // After initial load is done, allow animation to play once, then lock it
            const timer = setTimeout(() => {
                setHasAnimated(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, hasAnimated]);

    const shouldAnimate = !hasAnimated;

    // Header Class Logic
    let headerClass = 'app-header';
    if (viewState === 'intro') {
        headerClass += ' intro';
    } else {
        headerClass += ' app';
        if (isScrolled) {
            headerClass += ' minimized';
        }
    }

    // Date Formatting
    const formatLastUpdated = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const timeStr = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

            if (isToday) {
                return `Senast uppdaterad: Idag ${timeStr}`;
            }
            // Check if yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return `Senast uppdaterad: Igår ${timeStr}`;
            }
            return `Senast uppdaterad: ${date.toLocaleDateString('sv-SE')} ${timeStr}`;
        } catch (e) {
            return '';
        }
    };

    return (
        <>
            {/* Unified Sticky Header */}
            <header className={headerClass}>
                <div
                    className="header-logo"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    style={{ cursor: 'pointer' }}
                >
                    fynda.
                </div>
            </header>

            <main>
                {/* Navigation: Two-Layer Model (Mobile Responsive) */}
                <nav className="nav-container">
                    {/* Row 1: Scope (City) */}
                    <div className="nav-row-scope" style={{ position: 'relative' }}>
                        {/* Stockholm Wrapper */}
                        <div style={{ position: 'relative' }} ref={navRefs.Stockholm}>
                            <button
                                onClick={() => handleCityClick('Stockholm')}
                                className="nav-scope-btn"
                                style={{
                                    color: cityFilter === 'Stockholm' ? 'white' : '#666',
                                    fontWeight: cityFilter === 'Stockholm' ? 'bold' : 'normal',
                                }}
                            >
                                Stockholm {cityFilter === 'Stockholm' ? (areaFilter ? `(${areaFilter}) ▾` : ' ▾') : ''}
                            </button>

                            {/* Dropdown Menu */}
                            {expandedCity === 'Stockholm' && (
                                <div className="dropdown-menu">
                                    <button
                                        className={`dropdown-item ${cityFilter === 'Stockholm' && areaFilter === null ? 'active' : ''}`}
                                        onClick={() => handleAreaSelect(null, 'Stockholm')}
                                    >
                                        Alla områden
                                    </button>
                                    {stockholmAreas.map(area => (
                                        <button
                                            key={area}
                                            className={`dropdown-item ${cityFilter === 'Stockholm' && areaFilter === area ? 'active' : ''}`}
                                            onClick={() => handleAreaSelect(area, 'Stockholm')}
                                        >
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Uppsala Wrapper */}
                        <div style={{ position: 'relative' }} ref={navRefs.Uppsala}>
                            <button
                                onClick={() => handleCityClick('Uppsala')}
                                className="nav-scope-btn"
                                style={{
                                    color: cityFilter === 'Uppsala' ? 'white' : '#666',
                                    fontWeight: cityFilter === 'Uppsala' ? 'bold' : 'normal',
                                }}
                            >
                                Uppsala {cityFilter === 'Uppsala' ? (areaFilter ? `(${areaFilter}) ▾` : ' ▾') : ''}
                            </button>

                            {/* Dropdown Menu */}
                            {expandedCity === 'Uppsala' && (
                                <div className="dropdown-menu">
                                    <button
                                        className={`dropdown-item ${cityFilter === 'Uppsala' && areaFilter === null ? 'active' : ''}`}
                                        onClick={() => handleAreaSelect(null, 'Uppsala')}
                                    >
                                        Alla områden
                                    </button>
                                    {uppsalaAreas.map(area => (
                                        <button
                                            key={area}
                                            className={`dropdown-item ${cityFilter === 'Uppsala' && areaFilter === area ? 'active' : ''}`}
                                            onClick={() => handleAreaSelect(area, 'Uppsala')}
                                        >
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sliding Underline Element */}
                        <div
                            className="nav-underline"
                            style={underlineStyle}
                        />
                    </div>

                    {/* Row 2: Filters (Icons) */}
                    <div className="nav-row-filters">
                        {/* Top Floor (Elevator) */}
                        <button
                            className="filter-icon-btn"
                            onClick={toggleTopFloor}
                            title="Högst upp"
                            style={{
                                opacity: topFloorFilter ? 1 : 0.3,
                                borderBottom: topFloorFilter ? '2px solid #fff' : '2px solid transparent'
                            }}
                        >
                            <img
                                src="/elevator.png"
                                alt="Top floor"
                                style={{ filter: 'invert(1)' }} /* Assuming black icon, invert for white */
                            />
                        </button>

                        {/* Nearby (Walking < 15m) - Different behavior for Uppsala */}
                        <button
                            className="filter-icon-btn"
                            onClick={() => cityFilter !== 'Uppsala' && toggleIconFilter('nearby')}
                            title={cityFilter === 'Uppsala' ? "Nära (Data ej tillgänglig)" : "Nära"}
                            style={{
                                opacity: (cityFilter === 'Uppsala' || iconFilters.nearby) ? 1 : 0.3,
                                borderBottom: iconFilters.nearby ? '2px solid #fff' : '2px solid transparent',
                                cursor: cityFilter === 'Uppsala' ? 'default' : 'pointer'
                            }}
                        >
                            <img
                                src="/stopwatch.png"
                                alt="Nära"
                                style={{ width: '1.5em', height: '1.5em', filter: 'invert(1)' }}
                            />
                        </button>

                        {/* New */}
                        <button
                            className="filter-icon-btn"
                            onClick={() => toggleIconFilter('new')}
                            title="Nytt"
                            style={{
                                opacity: iconFilters.new ? 1 : 0.3,
                                borderBottom: iconFilters.new ? '2px solid #4caf50' : '2px solid transparent'
                            }}
                        >
                            <img src="/new.png" alt="Nytt" style={{ filter: 'invert(1)' }} />
                        </button>

                        {/* Viewing */}
                        <button
                            className="filter-icon-btn"
                            onClick={() => toggleIconFilter('viewing')}
                            title="Planerade visningar"
                            style={{
                                opacity: iconFilters.viewing ? 1 : 0.3,
                                borderBottom: iconFilters.viewing ? '2px solid #4caf50' : '2px solid transparent'
                            }}
                        >
                            <img src="/calendar.png" alt="Visning" style={{ filter: 'invert(1)' }} />
                        </button>

                        {/* Bidding */}
                        <button
                            className="filter-icon-btn"
                            onClick={() => toggleIconFilter('bidding')}
                            title="Budgivning pågår"
                            style={{
                                opacity: iconFilters.bidding ? 1 : 0.3,
                                borderBottom: iconFilters.bidding ? '2px solid #4caf50' : '2px solid transparent'
                            }}
                        >
                            <img src="/bidding.png" alt="Budgivning pågår" />
                        </button>
                    </div>
                </nav>

                {/* Last Updated Label */}
                <div style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '2rem',
                    marginTop: '0',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                }}>
                    {formatLastUpdated(dataFile?.meta?.generatedAt)}
                </div>

                {isLoading ? (
                    // Render skeletons
                    Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    <>
                        {displayData.map((item) => {
                            const areaDisplay = item.area
                                ? `(${item.area}${item.city ? `, ${item.city}` : ''})`
                                : '';

                            return (
                                <a
                                    key={item.url}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '32px' }}
                                >
                                    <article className="listing-card" style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '1.5rem' }}>
                                        {/* Row 1: Header (Address + Icons) */}
                                        <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '1.1em', fontWeight: 300, color: '#e0e0e0' }}>
                                                {item.address || 'Adress saknas'} <span style={{ fontSize: '0.8em', color: '#888' }}>{areaDisplay}</span>
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px', opacity: 0.7 }}>
                                                {!!item.isNew && (
                                                    <img src="/new.png" alt="Nytt" style={{ height: '1.2em', filter: 'invert(1)' }} />
                                                )}
                                                {!!item.hasViewing && (
                                                    <img src="/calendar.png" alt="Visning" style={{ height: '1.2em', filter: 'invert(1)' }} />
                                                )}
                                                {!!item.biddingOpen && (
                                                    <img src="/bidding.png" alt="Budgivning pågår" style={{ height: '1.2em' }} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 1.5: Property Details (Area, Rooms, Fee) */}
                                        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '0.85rem', color: '#888' }}>
                                            {item.rooms && <span>{item.rooms} rum</span>}
                                            {item.livingArea && <span>{item.livingArea} m²</span>}
                                            {item.rent && <span>{formatPrice(item.rent).replace(/\s?kr/g, '')} kr/mån</span>}
                                        </div>

                                        {/* Row 2: HERO Metric (Price Difference) */}
                                        <div style={{ marginBottom: '1.25rem', paddingLeft: '0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#4caf50', letterSpacing: '-1px' }}>
                                                    +<CountUp end={item.priceDiff} animate={shouldAnimate} />
                                                </span>
                                                {item.priceDiffPercent && (
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 500, color: '#66bb6a', background: 'rgba(76, 175, 80, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                        {Math.round(item.priceDiffPercent)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 3: Secondary Metrics (List Price & Valuation) */}
                                        <div className="secondary-metrics-grid">
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '2px' }}>Utropspris</div>
                                                <div style={{ fontSize: '1.1rem', color: '#ccc' }}>{formatPrice(item.listPrice)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '2px' }}>Värdering</div>
                                                <div style={{ fontSize: '1.1rem', color: '#ccc' }}>{formatPrice(item.estimatedValue)}</div>
                                            </div>
                                        </div>

                                        {/* Row 4: Commute Info - Only show if data exists */}
                                        {(item.walkingTimeMinutes !== null || item.commuteTimeMinutes !== null) && (
                                            <div style={{ paddingTop: '1rem', paddingLeft: '0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                                                    {item.walkingTimeMinutes !== null && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '0.85rem' }}>
                                                            <span style={{ fontSize: '1.2em', opacity: 0.7 }}>🚶</span>
                                                            <span>{item.walkingTimeMinutes > 30 ? '30+' : item.walkingTimeMinutes} min</span>
                                                        </div>
                                                    )}
                                                    {item.commuteTimeMinutes !== null && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '0.85rem' }}>
                                                            <span style={{ fontSize: '1.2em', opacity: 0.7 }}>🚌</span>
                                                            <span>{item.commuteTimeMinutes} min</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                </a>
                            );
                        })}

                        {/* Sentinel for infinite scroll */}
                        {!isAnyFilterActive && visibleCount < filteredData.length && (
                            <div ref={loadMoreRef} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="loading-spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#4caf50', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    );
}

export default App;
