import { useState, useEffect } from 'react';
import dataFile from './data.json';

function App() {
    const [data, setData] = useState([]);

    const [filter, setFilter] = useState('Stockholm');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Use the 'objects' array from the new data format. 
        // Fallback to empty array if objects is missing.
        const rawObjects = dataFile?.objects || [];

        // Filter: Only positive priceDiff
        // Sort: Most positive priceDiff first
        const processed = rawObjects
            .filter(item => item.priceDiff > 0)
            .sort((a, b) => (b.priceDiff || 0) - (a.priceDiff || 0));

        setData(processed);

        // Simulate a small delay to make skeleton visible (optional, but good for UX feel if instantaneous)
        // Or just let it be natural. Since it's imported JSON, it's near instant.
        // User asked for skeleton loading, so likely wants to see it.
        setTimeout(() => setIsLoading(false), 800);
    }, []);

    const filteredData = data.filter(item => {
        if (filter === 'all') return true;
        return item.searchSource === filter;
    });

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '-';
        return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(price);
    };

    const SkeletonCard = () => (
        <article style={{ marginBottom: '3rem', borderBottom: '1px solid #333', paddingBottom: '2rem', animation: 'pulse 1.5s infinite' }}>
            {/* Row 1: Address */}
            <div style={{ marginBottom: '1rem', height: '1.5rem', width: '60%', background: '#333', borderRadius: '4px' }}></div>

            {/* Row 2: Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '0.5rem', gap: '1rem' }}>
                <div style={{ height: '0.8rem', width: '40%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '0.8rem', width: '40%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '0.8rem', width: '40%', background: '#333', borderRadius: '4px' }}></div>
            </div>

            {/* Row 3: Values */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ height: '1.2rem', width: '50%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '1.2rem', width: '50%', background: '#333', borderRadius: '4px' }}></div>
                <div style={{ height: '1.2rem', width: '50%', background: '#333', borderRadius: '4px' }}></div>
            </div>
        </article>
    );

    return (
        <main>
            {/* Navigation */}
            <nav style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => setFilter('Stockholm')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: filter === 'Stockholm' ? 'white' : '#888',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: filter === 'Stockholm' ? 'bold' : 'normal',
                        padding: 0
                    }}
                >
                    Stockholm
                </button>
                <button
                    onClick={() => setFilter('Stockholm (top floor)')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: filter === 'Stockholm (top floor)' ? 'white' : '#888',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: filter === 'Stockholm (top floor)' ? 'bold' : 'normal',
                        padding: 0
                    }}
                >
                    Stockholm (top floor)
                </button>
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
                            style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '3rem', borderBottom: '1px solid #333', paddingBottom: '2rem' }}
                        >
                            <article>
                                {/* Row 1: Address (Area) */}
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        {item.address || 'Adress saknas'} <span style={{ fontWeight: 'normal', color: '#888' }}>{areaDisplay}</span>
                                    </span>

                                    {!!item.biddingOpen && (
                                        <img src="/bidding.png" alt="Budgivning pågår" style={{ height: '1.2em' }} />
                                    )}
                                    {!!item.hasViewing && (
                                        <img src="/calendar.png" alt="Visning" style={{ height: '1.2em', filter: 'invert(1)' }} />
                                    )}
                                    {!!item.isNew && (
                                        <img src="/new.png" alt="Nytt" style={{ height: '1.2em', filter: 'invert(1)' }} />
                                    )}

                                    {item.walkingTimeMinutes && (
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa', marginLeft: '10px' }}>
                                            🚶 {item.walkingTimeMinutes} min ({Math.round(item.distanceMeters / 100) / 10} km)
                                        </span>
                                    )}
                                    {item.commuteTimeMinutes && (
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa', marginLeft: '10px' }}>
                                            🚌 {item.commuteTimeMinutes} min
                                        </span>
                                    )}
                                </div>

                                {/* Row 2: Labels */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>
                                    <div></div>
                                    <div>Utropspris</div>
                                    <div>Värdering</div>
                                </div>

                                {/* Row 3: Values */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '1.1rem' }}>
                                    {/* priceDiff */}
                                    <div>
                                        {item.priceDiff !== null ? (
                                            <>
                                                <span style={{ fontWeight: 'bold' }}>{formatPrice(item.priceDiff)}</span>{' '}
                                                {item.priceDiffPercent !== null && item.priceDiffPercent !== undefined && (
                                                    <span style={{ fontSize: '0.9em' }}>{Math.round(item.priceDiffPercent)}%</span>
                                                )}
                                            </>
                                        ) : '-'}
                                    </div>

                                    {/* listPrice */}
                                    <div>
                                        {formatPrice(item.listPrice)}
                                    </div>

                                    {/* estimatedValue */}
                                    <div>
                                        {formatPrice(item.estimatedValue)}
                                    </div>
                                </div>
                            </article>
                        </a>
                    );
                })
            )}
        </main>
    );
}

export default App;
