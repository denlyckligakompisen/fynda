import { useState, useEffect, useRef } from 'react';
import dataFile from './data.json';

function App() {
    const [data, setData] = useState([]);

    // Two-layer filter state
    const [cityFilter, setCityFilter] = useState('Stockholm');

    // Attribute Filters
    const [topFloorFilter, setTopFloorFilter] = useState(false);

    // Multi-select icon filters: { bidding: boolean, viewing: boolean, new: boolean }
    const [iconFilters, setIconFilters] = useState({
        bidding: false,
        viewing: false,
        new: false
    });

    const [isLoading, setIsLoading] = useState(true);

    // UI State
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

    // Effect to update underline position when cityFilter changes
    useEffect(() => {
        const activeRef = navRefs[cityFilter];
        if (activeRef && activeRef.current) {
            setUnderlineStyle({
                left: activeRef.current.offsetLeft,
                width: activeRef.current.offsetWidth,
                opacity: 1
            });
        }
    }, [cityFilter, isLoading]); // Add isLoading to ensure refs are mounted

    const filteredData = data.filter(item => {
        const source = item.searchSource || '';

        // 1. Scope (City)
        if (!source.includes(cityFilter)) return false;

        // 2. Attributes (Top Floor)
        if (topFloorFilter) {
            if (!source.toLowerCase().includes('top floor')) return false;
        }

        // 3. Icon Filters (AND logic - item must match ALL active filters)
        if (iconFilters.bidding && !item.biddingOpen) return false;
        if (iconFilters.viewing && !item.hasViewing) return false;
        if (iconFilters.new && !item.isNew) return false;

        return true;
    });

    const toggleIconFilter = (type) => {
        setIconFilters(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const toggleTopFloor = () => setTopFloorFilter(prev => !prev);

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '-';
        return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(price);
    };

    const SkeletonCard = () => (
        <article style={{ marginBottom: '3rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}>
            <div style={{ marginBottom: '1rem', height: '1.5rem', width: '60%', background: '#333', borderRadius: '4px', margin: '0 auto' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '0.5rem', gap: '1rem' }}>
                <div style={{ height: '0.8rem', width: '40%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '0.8rem', width: '40%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '0.8rem', width: '40%', background: '#333', borderRadius: '4px' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ height: '1.2rem', width: '50%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '1.2rem', width: '50%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '1.2rem', width: '50%', background: '#333', borderRadius: '4px' }}></div>
            </div>
        </article>
    );

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
                        <button
                            ref={navRefs.Stockholm}
                            onClick={() => setCityFilter('Stockholm')}
                            className="nav-scope-btn"
                            style={{
                                color: cityFilter === 'Stockholm' ? 'white' : '#666',
                                fontWeight: cityFilter === 'Stockholm' ? 'bold' : 'normal',
                            }}
                        >
                            Stockholm
                        </button>
                        <button
                            ref={navRefs.Uppsala}
                            onClick={() => setCityFilter('Uppsala')}
                            className="nav-scope-btn"
                            style={{
                                color: cityFilter === 'Uppsala' ? 'white' : '#666',
                                fontWeight: cityFilter === 'Uppsala' ? 'bold' : 'normal',
                            }}
                        >
                            Uppsala
                        </button>
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

                {isLoading ? (
                    // Render skeletons
                    Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    filteredData.map((item, index) => {
                        const areaDisplay = item.area
                            ? `(${item.area}${item.city ? `, ${item.city}` : ''})`
                            : '';

                        return (
                            <a
                                key={index}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '32px' }}
                            >
                                <article className="listing-card" style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '1.5rem' }}>
                                    {/* Row 1: Header (Address + Icons) */}
                                    <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
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

                                    {/* Row 2: HERO Metric (Price Difference) */}
                                    <div style={{ marginBottom: '1.25rem', paddingLeft: '0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#4caf50', letterSpacing: '-1px' }}>
                                                +{formatPrice(item.priceDiff).replace(' kr', '')}
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
                                                        <span style={{ fontSize: '1em', opacity: 0.7 }}>🚶</span>
                                                        <span>{item.walkingTimeMinutes > 30 ? '30+' : item.walkingTimeMinutes} min</span>
                                                    </div>
                                                )}
                                                {item.bicycleTimeMinutes !== null && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '0.85rem' }}>
                                                        <span style={{ fontSize: '1em', opacity: 0.7 }}>🚲</span>
                                                        <span>{item.bicycleTimeMinutes > 30 ? '30+' : item.bicycleTimeMinutes} min</span>
                                                    </div>
                                                )}
                                                {item.commuteTimeMinutes !== null && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '0.85rem' }}>
                                                        <span style={{ fontSize: '1em', opacity: 0.7 }}>🚌</span>
                                                        <span>{item.commuteTimeMinutes} min</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            </a>
                        );
                    })
                )}
            </main>
        </>
    );
}

export default App;
