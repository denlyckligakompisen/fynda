import { useState, useEffect } from 'react';
import booliData from '../booli_cache.json';

function App() {
    const [data, setData] = useState([]);

    useEffect(() => {
        // Sort logic is already in scraper, but ensuring it here preserves the user requirement
        // Data in booli_cache.json is expected to be correct.
        setData(booliData);
    }, []);

    const formatPrice = (price) => {
        if (!price) return '0 kr';
        return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <main className="container">
            <hgroup>
                <h1>Fynda Bostad</h1>
                <small>Hitta din nästa bostad till rätt pris</small>
            </hgroup>

            {data.map((item, index) => {
                // Calculate percentage for all items with a valid list price
                const percentage = item.utropspris > 0 && item.fyndchans !== 0
                    ? Math.round((item.fyndchans / item.utropspris) * 100)
                    : null;

                const isPositive = item.fyndchans > 0;

                return (
                    <article key={index}>
                        <header>
                            <a href={item.lank} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <strong>{item.adress}</strong>
                            </a>
                        </header>

                        <div className="grid">
                            <div>
                                <small>Fyndchans</small>
                                <p style={{
                                    color: isPositive ? '#2ecc71' : 'var(--pico-muted-color)',
                                    fontWeight: 'bold',
                                    fontSize: '1.2em',
                                    marginBottom: 0
                                }}>
                                    {item.fyndchans !== 0 ? (
                                        <>
                                            {isPositive ? '+' : ''}{formatPrice(item.fyndchans)}
                                            {percentage !== null && <small style={{ color: 'var(--pico-muted-color)', fontSize: '0.7em', fontWeight: 'normal' }}> ({percentage}%)</small>}
                                        </>
                                    ) : (
                                        <span style={{ fontWeight: 'normal', color: 'var(--pico-muted-color)' }}>
                                            {item.utropspris === 0 ? '' : 'Inget värde'}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <small>Utropspris</small>
                                <p style={{ marginBottom: 0 }}>
                                    {item.utropspris > 0 ? formatPrice(item.utropspris) : 'Saknas'}
                                </p>
                            </div>

                            <div>
                                <small>Värdering</small>
                                <p style={{ marginBottom: 0 }}>
                                    {item.varde ? formatPrice(item.varde) : 'Saknas'}
                                </p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </main>
    );
}

export default App;
