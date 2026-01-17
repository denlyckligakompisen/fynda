import { useState, useEffect } from 'react';
import dataFile from './data.json';

function App() {
    const [data, setData] = useState([]);

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
    }, []);

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '-';
        return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <main>
            {data.map((item, index) => {
                const areaDisplay = item.area
                    ? `(${item.area}${item.city ? `, ${item.city}` : ''})`
                    : '';

                return (
                    <article key={index} style={{ marginBottom: '3rem', borderBottom: '1px solid #333', paddingBottom: '2rem' }}>
                        {/* Row 1: Address (Area) */}
                        <div style={{ marginBottom: '1rem' }}>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {item.address || 'Adress saknas'} <span style={{ fontWeight: 'normal', color: '#888' }}>{areaDisplay}</span>
                            </a>
                        </div>

                        {/* Row 2: Labels */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem' }}>
                            {/* Empty/Title for Diff could be here if needed, prompt said "<no title> Utropspris Värdering" */}
                            <div></div>
                            <div>Utropspris</div>
                            <div>Värdering</div>
                        </div>

                        {/* Row 3: Values */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '1.1rem' }}>
                            {/* priceDiff */}
                            <div style={{ fontWeight: 'bold' }}>
                                {item.priceDiff !== null ? formatPrice(item.priceDiff) : '-'}
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
                );
            })}
        </main>
    );
}

export default App;
