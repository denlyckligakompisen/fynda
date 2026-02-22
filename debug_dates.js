
function test() {
    // Current time: 2026-02-22T11:30:18+01:00
    // JavaScript Date in local time matches system time if env is correct
    // Let's simulate 'now' as Feb 22, 2026 11:30
    const now = new Date(2026, 1, 22, 11, 30);
    console.log("Current time (simulated):", now.toString());
    console.log("Current date parts:", now.getFullYear(), now.getMonth(), now.getDate());

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Today computed:", today.toString());
    console.log("Tomorrow computed:", tomorrow.toString());

    // Input string from Booli
    const input = "Sön 22 feb kl 13:30";
    console.log("Input string:", input);

    // Month map
    const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'maj': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
    };

    // Parse logic
    const dateMatch = input.match(/(\d{1,2})\s+(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/i);
    const day = parseInt(dateMatch[1], 10);
    const month = monthMap[dateMatch[2].toLowerCase()];
    const hours = 13, mins = 30; // simplicity

    // This is how it's done in parseShowingDate
    const candidate = new Date(now.getFullYear(), month, day, hours, mins);
    console.log("Candidate Date:", candidate.toString());
    console.log("Candidate parts:", candidate.getFullYear(), candidate.getMonth(), candidate.getDate());

    // Comparison in formatShowingDate
    const target = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate());
    console.log("Target Date (normalized):", target.toString());

    const isToday = target.getFullYear() === today.getFullYear() &&
        target.getMonth() === today.getMonth() &&
        target.getDate() === today.getDate();

    const isTomorrow = target.getFullYear() === tomorrow.getFullYear() &&
        target.getMonth() === tomorrow.getMonth() &&
        target.getDate() === tomorrow.getDate();

    console.log("isToday:", isToday);
    console.log("isTomorrow:", isTomorrow);

    if (isToday) console.log("Result: Idag");
    else if (isTomorrow) console.log("Result: Imorgon");
    else console.log("Result: Other");
}

test();
