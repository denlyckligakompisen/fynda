const fs = require('fs');
const cheerio = require('cheerio');

try {
    const html = fs.readFileSync('page.html', 'utf8');
    const $ = cheerio.load(html);
    const scriptContent = $('#__NEXT_DATA__').html();

    if (!scriptContent) {
        console.error("No __NEXT_DATA__ found");
        process.exit(1);
    }

    const data = JSON.parse(scriptContent);
    fs.writeFileSync('structure.json', JSON.stringify(data, null, 2));
    console.log("Structure saved to structure.json");

} catch (e) {
    console.error(e);
}
