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

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const timeStr = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

        if (targetDate.getTime() === today.getTime()) {
            return `Senaste uppdateringen är idag ${timeStr}`;
        } else if (targetDate.getTime() === yesterday.getTime()) {
            return `Senaste uppdateringen är igår ${timeStr}`;
        } else {
            const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
            const dayMonth = `${date.getDate()} ${months[date.getMonth()]}`;
            return `Senaste uppdateringen är ${dayMonth} ${timeStr}`;
        }
    } catch (e) {
        return '';
    }
};
/**
 * Parse Swedish showing date string ("Tis 10 feb kl 17:45") to Date object
 * @param {Object} nextShowing 
 * @returns {Date}
 */
export const parseShowingDate = (nextShowing) => {
    if (!nextShowing || !nextShowing.fullDateAndTime) return new Date('2099-12-31');

    const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'maj': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
    };

    try {
        const parts = nextShowing.fullDateAndTime.split(/\s+/);
        // parts format: ["Tis", "10", "feb", "kl", "17:45"]
        const day = parseInt(parts[1]);
        const month = monthMap[parts[2].toLowerCase()];

        if (!isNaN(day) && month !== undefined) {
            const now = new Date();
            let year = now.getFullYear();

            // If it's Jan/Feb and current month is Dec, it's probably next year
            if (month < 2 && now.getMonth() > 10) year++;

            // Try to extract time
            const timePart = parts[4]; // "17:45"
            if (timePart && timePart.includes(':')) {
                const [hrs, mins] = timePart.split(':').map(Number);
                return new Date(year, month, day, hrs, mins);
            }

            return new Date(year, month, day);
        }
    } catch (e) {
        console.error('Error parsing showing date:', e);
    }
    return new Date('2099-12-31');
};

/**
 * Format showing date to a short readable string: "Idag 17:45", "Imorgon 12:00", or "10 feb 17:45"
 * @param {Object} nextShowing 
 * @returns {string|null}
 */
export const formatShowingDate = (nextShowing) => {
    if (!nextShowing || !nextShowing.fullDateAndTime) return null;

    const date = parseShowingDate(nextShowing);
    if (date.getFullYear() === 2099) return null;

    const parts = nextShowing.fullDateAndTime.split(/\s+/);
    const hasTime = parts[4] && parts[4].includes(':');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    const timeStr = hasTime ? date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '';

    let dateStr = '';
    if (diffDays === 0) dateStr = 'Idag';
    else if (diffDays === 1) dateStr = 'Imorgon';
    else {
        const day = date.getDate();
        const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        dateStr = `${day} ${months[date.getMonth()]}`;
    }

    return timeStr ? `${dateStr} ${timeStr}` : dateStr;
};
