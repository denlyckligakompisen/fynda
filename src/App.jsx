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
            <div className="space-y-0">
                {data.map((item, index) => {
                    // Calculate percentage for all items with a valid list price
                    const percentage = item.utropspris > 0 && item.fyndchans !== 0
                        ? Math.round((item.fyndchans / item.utropspris) * 100)
                        : null;

                    return (
                        <div key={index} className="border-b border-gray-800 py-6 last:border-b-0">
                            <div className="flex items-baseline gap-4">
                                <a href={item.lank} target="_blank" rel="noopener noreferrer" className="text-white font-bold text-lg hover:text-gray-300 transition-colors no-underline truncate min-w-0">
                                    {item.adress}
                                </a>
                                <div className="whitespace-nowrap flex-shrink-0 ml-0">
                                    {item.fyndchans !== 0 ? (
                                        <span className={`font-bold text-lg ${item.fyndchans > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                            {item.fyndchans > 0 ? '+' : ''}{formatPrice(item.fyndchans)} ({percentage}%)
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 font-medium">
                                            {item.fyndchans === 0 && item.utropspris === 0 ? '' : `${formatPrice(item.fyndchans)}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
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
