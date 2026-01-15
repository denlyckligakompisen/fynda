const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'booli_cache.json');
const TARGET_URL = 'https://www.booli.se/sok/till-salu?areaIds=115355,35,883816,3377,2983,115351,874646,874654&floor=topFloor&maxListPrice=4000000&minLivingArea=45&upcomingSale=';

function isCacheValid() {
  if (!fs.existsSync(CACHE_FILE)) return false;
  const stats = fs.statSync(CACHE_FILE);
  const now = new Date();
  const fileTime = new Date(stats.mtime);
  return now.getFullYear() === fileTime.getFullYear() &&
         now.getMonth() === fileTime.getMonth() &&
         now.getDate() === fileTime.getDate();
}

async function scrape() {
  if (isCacheValid()) {
    // console.log('Returning cached data...'); // Commented out to keep output clean JSON
    const data = await fs.readJson(CACHE_FILE);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  try {
    const { data: html } = await axios.get(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(html);
    const nextDataScript = $('#__NEXT_DATA__').html();
    
    if (!nextDataScript) {
      console.error('Error: Could not find __NEXT_DATA__ script');
      process.exit(1);
    }

    const nextData = JSON.parse(nextDataScript);
    
    // Attempt to locate listings in the Next.js state structure
    // Path structure varies but typically: props.pageProps.search.result.listings
    // Or props.pageProps.dehydratedState.queries...
    // Let's inspect the likely path from typical Next.js props
    
    let listings = [];
    
    // Helper to deeply find key
    // This is safer than hardcoding deeply nested paths that might change slightly
    // but strict requirements asked for specific list.
    // Based on inspection, we look for 'listings' in pageProps
    
    if (nextData?.props?.pageProps?.search?.result?.listings) {
        listings = nextData.props.pageProps.search.result.listings;
    } else {
        // Fallback or deep search if structure is different
        // For now, fail if basic structure isn't there, or try to log keys for debug
        // console.error(JSON.stringify(nextData.props.pageProps, null, 2));
    }
    
    // We can also try to find the query state if it is dehydrated
    if (listings.length === 0 && nextData?.props?.pageProps?.dehydratedState?.queries) {
       const query = nextData.props.pageProps.dehydratedState.queries.find(q => q?.state?.data?.search?.result?.listings);
       if (query) {
           listings = query.state.data.search.result.listings;
       }
    }

    const processed = listings.slice(0, 20).map(item => {
      const address = item.location.address.streetAddress;
      const listPrice = item.listPrice;
      const valuation = item.valuation?.estimate?.price; // Optional chaining in case valuation is missing
      const url = `https://www.booli.se${item.url}`;
      
      let fyndchans = 0;
      let vardeVal = 0;

      if (typeof valuation === 'number') {
        vardeVal = valuation;
        fyndchans = valuation - listPrice;
      }

      return {
        adress: address,
        utropspris: listPrice,
        varde: vardeVal || null, // Explicit null if no valuation
        fyndchans: fyndchans,
        lank: url
      };
    });

    // Sort by fyndchans, highest appearing first
    processed.sort((a, b) => b.fyndchans - a.fyndchans);

    await fs.writeJson(CACHE_FILE, processed, { spaces: 2 });
    console.log(JSON.stringify(processed, null, 2));

  } catch (error) {
    console.error('Error fetching data:', error.message);
    process.exit(1);
  }
}

scrape();
