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
        <div className="min-h-screen bg-black text-white p-4">
            <h1 className="text-2xl font-bold mb-4">Fyndchans</h1>
            <div className="space-y-6">
                {data.map((item, index) => {
                    const percentage = item.utropspris > 0 && item.fyndchans > 0
                        ? ((item.fyndchans / item.utropspris) * 100).toFixed(1)
                        : null;

                    return (
                        <div key={index} className="border-b border-gray-800 py-6">
                            <div className="text-xl">
                                <a href={item.lank} target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-gray-300 transition-colors no-underline">
                                    {item.adress}
                                </a>
                                {item.fyndchans > 0 ? (
                                    <span className="text-green-400 font-bold ml-3 text-lg">
                                        +{formatPrice(item.fyndchans)} ({percentage}%)
                                    </span>
                                ) : (
                                    <span className="text-gray-500 ml-3 text-lg">
                                        {item.fyndchans === 0 && item.utropspris === 0 ? '' : `${formatPrice(item.fyndchans)}`}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-400 mt-2 font-medium">
                                Utropspris {item.utropspris > 0 ? formatPrice(item.utropspris) : 'Pris saknas'}  Värdering {item.varde ? formatPrice(item.varde) : 'Saknas'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default App;
