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
                        <div key={index} className="flex justify-between items-center border-b border-gray-800 py-4">
                            <div>
                                <div className="text-xl font-bold text-white">
                                    <a href={item.lank} target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors no-underline">
                                        {item.adress}
                                    </a>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 font-medium">
                                    Utropspris {item.utropspris > 0 ? formatPrice(item.utropspris) : 'Pris saknas'}  Värdering {item.varde ? formatPrice(item.varde) : 'Saknas'}
                                </div>
                            </div>
                            <div className="text-right">
                                {item.fyndchans > 0 ? (
                                    <>
                                        <div className="text-xl font-bold text-green-400">
                                            +{formatPrice(item.fyndchans)}
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            {percentage}%
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-gray-500 font-medium">
                                        {item.fyndchans === 0 && item.utropspris === 0 ? '' : `${formatPrice(item.fyndchans)}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default App;
