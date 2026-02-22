
const monthMap = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'maj': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
};

const parseShowingDate = (nextShowing, now) => {
    if (!nextShowing || !nextShowing.fullDateAndTime) return new Date('2099-12-31');
    const raw = nextShowing.fullDateAndTime.trim();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let hours = 0, mins = 0;
    const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        mins = parseInt(timeMatch[2], 10);
    }

    if (raw.toLowerCase().startsWith('idag')) {
        return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, mins);
    }
    if (raw.toLowerCase().startsWith('imorgon')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), hours, mins);
    }

    const dateMatch = raw.match(/(\d{1,2})\s+(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/i);
    if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = monthMap[dateMatch[2].toLowerCase()];
        let year = now.getFullYear();
        const candidate = new Date(year, month, day, hours, mins);
        const daysDiff = (now - candidate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 30) year++;
        return new Date(year, month, day, hours, mins);
    }
    return new Date('2099-12-31');
};

const formatShowingDate = (nextShowing, now) => {
    if (!nextShowing || !nextShowing.fullDateAndTime) return null;
    const date = parseShowingDate(nextShowing, now);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    if (date < thirtyMinAgo) return "ALREADY_FINISHED";

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    let dateStr = '';
    if (diffDays === 0) dateStr = 'Idag';
    else if (diffDays === 1) dateStr = 'Imorgon';
    else dateStr = 'Other: ' + diffDays;

    return dateStr;
};


const testCases = [
    { now: [2026, 1, 22, 11, 14], input: "Sön 22 feb kl 13:30", expected: "Idag" },
    { now: [2026, 1, 22, 11, 14], input: "Mån 23 feb kl 12:00", expected: "Imorgon" },
    { now: [2026, 1, 22, 23, 30], input: "Sön 22 feb kl 23:45", expected: "Idag" },
    { now: [2026, 1, 21, 23, 30], input: "Sön 22 feb kl 10:00", expected: "Imorgon" }, // Correct, if now is Sat 23:30, Sun 10:00 is tomorrow
    { now: [2026, 1, 22, 0, 15], input: "Sön 22 feb kl 13:30", expected: "Idag" },
];

testCases.forEach(({ now: n, input, expected }) => {
    const nowObj = new Date(n[0], n[1], n[2], n[3], n[4]);
    const result = formatShowingDate({ fullDateAndTime: input }, nowObj);
    console.log(`Now: ${nowObj.toISOString().slice(0, 16)} | Input: ${input} | Result: ${result} | Expected: ${expected}`);
});

