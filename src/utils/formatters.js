/**
 * Format price in Swedish SEK format
 * @param {number|null|undefined} price 
 * @returns {string}
 */
export const formatPrice = (price) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        maximumFractionDigits: 0
    }).format(price);
};

/**
 * Format ISO date string to human-readable Swedish format
 * @param {string} isoString 
 * @returns {string}
 */
export const formatLastUpdated = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

        if (isToday) {
            return `Uppdaterad idag ${timeStr}`;
        } else {
            return `Uppdaterad ${date.toLocaleDateString('sv-SE')} ${timeStr}`;
        }
    } catch (e) {
        return '';
    }
};
