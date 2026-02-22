/**
 * Format price in Swedish SEK format
 * @param {number|null|undefined} price 
 * @returns {string}
 */
export const formatPrice = (price) => {
    if (price === null || price === undefined) return '-';
    if (price === 0) return '0 kr';
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
            return `Idag ${timeStr}`;
        } else if (targetDate.getTime() === yesterday.getTime()) {
            return `Igår ${timeStr}`;
        } else {
            const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
            const dayMonth = `${date.getDate()} ${months[date.getMonth()]}`;
            return `${dayMonth} ${timeStr}`;
        }
    } catch (e) {
        return '';
    }
};
/**
 * Parse Swedish showing date string to Date object
 * Supports formats:
 *   - "Idag kl 14:00" / "Idag"
 *   - "Imorgon kl 14:00" / "Imorgon"
 *   - "Tis 10 feb kl 17:45" / "Sön 15 feb"
 *   - "Sön 1 mar"
 * @param {Object} nextShowing 
 * @returns {Date}
 */
export const parseShowingDate = (nextShowing) => {
    if (!nextShowing || !nextShowing.fullDateAndTime) return new Date('2099-12-31');

    const raw = nextShowing.fullDateAndTime.trim();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'maj': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
    };

    try {
        // Extract time if present (e.g., "kl 14:00" or trailing "14:00")
        let hours = 0, mins = 0;
        const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            mins = parseInt(timeMatch[2], 10);
        }

        // Relative dates
        if (raw.toLowerCase().startsWith('idag')) {
            return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, mins);
        }
        if (raw.toLowerCase().startsWith('imorgon')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), hours, mins);
        }

        // Absolute dates: "Tis 10 feb kl 17:45" or "Sön 1 mar"
        // Extract day and month
        const dateMatch = raw.match(/(\d{1,2})\s+(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/i);
        if (dateMatch) {
            const day = parseInt(dateMatch[1], 10);
            const month = monthMap[dateMatch[2].toLowerCase()];
            let year = now.getFullYear();

            // If date is far in the past (>30 days), assume next year (e.g. "5 jan" in December)
            // But keep recent past dates in the current year so the 30-min hiding logic works
            const candidate = new Date(year, month, day, hours, mins);
            const daysDiff = (now - candidate) / (1000 * 60 * 60 * 24);
            if (daysDiff > 30) {
                year++;
            }

            return new Date(year, month, day, hours, mins);
        }

        // New: Handle ISO-like dates (YYYY-MM-DD HH:mm)
        const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10), hours, mins);
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
/**
 * Calculate monthly cost for a listing
 * Formula: ränta + amortering + avgift + drift
 * - Ränta: ((((listPrice * 0.85) * 0.02) / 12) * 0.7)  [85% loan, 2% interest, 70% after tax deduction]
 * - Amortering: ((listPrice * 0.02) / 12)               [2% per year]
 * - Avgift: rent                                         [monthly fee]
 * - Drift: (50 * livingArea) / 12                        [50 kr/sqm/year]
 * @param {number} listPrice - Asking price
 * @param {number} rent - Monthly fee (avgift)
 * @param {number} livingArea - Living area in sqm
 * @returns {number|null}
 */
export const calculateMonthlyCost = (listPrice, rent, operatingCost) => {
    if (!listPrice || listPrice <= 0) return null;

    const interest = ((((listPrice * 0.85) * 0.02) / 12) * 0.7);
    const amortization = ((listPrice * 0.85 * 0.02) / 12);
    const fee = rent || 0;

    return Math.round(interest + amortization + fee);
};

export const formatShowingDate = (nextShowing) => {
    if (!nextShowing || !nextShowing.fullDateAndTime) return null;

    const date = parseShowingDate(nextShowing);
    if (date.getFullYear() === 2099) return null;

    const now = new Date();

    // Hide showing if it started more than 30 minutes ago
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    if (date < thirtyMinAgo) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const isToday = target.getFullYear() === today.getFullYear() &&
        target.getMonth() === today.getMonth() &&
        target.getDate() === today.getDate();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = target.getFullYear() === tomorrow.getFullYear() &&
        target.getMonth() === tomorrow.getMonth() &&
        target.getDate() === tomorrow.getDate();

    // Check if time is present
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    const timeStr = hasTime ? date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '';

    let dateStr = '';
    if (isToday) dateStr = 'Idag';
    else if (isTomorrow) dateStr = 'Imorgon';
    else {
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 8 && diffDays > 0) {
            const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
            dateStr = dayNames[date.getDay()];
        } else {
            const day = date.getDate();
            const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
            dateStr = `${day} ${months[date.getMonth()]}`;
        }
    }

    return timeStr ? `${dateStr} ${timeStr}` : dateStr;
};
