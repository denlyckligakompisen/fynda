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

// Helper to resolve Apollo refs
function resolveRef(item, apolloState) {
  if (item && item.__ref && apolloState) {
    return apolloState[item.__ref];
  }
  return item;
}

// Helper to recursively find listings array in an object
function findListingsRecursive(obj, apolloState, depth = 0) {
  if (depth > 5 || !obj || typeof obj !== 'object') return null;

  // Resolve ref first
  obj = resolveRef(obj, apolloState);

  // Check if this object IS the listings array
  if (Array.isArray(obj)) {
    // Simple heuristic: check if items look like listings (have __ref starting with Listing found via heuristic or just assume array in result context IS listings)
    // But some arrays might be other things.
    // Listings usually have 'listPrice' or 'streetAddress' or are refs to 'Listing:...'
    if (obj.length > 0) {
      const sample = resolveRef(obj[0], apolloState);
      if (sample && (sample.__typename === 'Listing' || sample.streetAddress || sample.listPrice)) {
        return obj;
      }
    }
    return null; // Array but not listings?
  }

  // Check properties
  if (obj.listings) {
    const result = findListingsRecursive(obj.listings, apolloState, depth + 1);
    if (result) return result;
  }
  if (obj.result) {
    const result = findListingsRecursive(obj.result, apolloState, depth + 1);
    if (result) return result;
  }
  // Also check 'results' just in case
  if (obj.results) {
    const result = findListingsRecursive(obj.results, apolloState, depth + 1);
    if (result) return result;
  }

  return null;
}

async function scrape() {
  if (isCacheValid()) {
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
    const apolloState = nextData.props.pageProps.__APOLLO_STATE__;

    let listingRefs = [];

    if (apolloState && apolloState.ROOT_QUERY) {
      // Sort keys to find 'searchForSale' and prioritize it
      const keys = Object.keys(apolloState.ROOT_QUERY).filter(k => k.startsWith('searchForSale'));

      for (const key of keys) {
        const rootVal = resolveRef(apolloState.ROOT_QUERY[key], apolloState);
        const found = findListingsRecursive(rootVal, apolloState);
        if (found) {
          listingRefs = found;
          break;
        }
      }
    }

    if (listingRefs.length === 0) {
      console.error('Error: Could not find listings in Apollo State (ROOT_QUERY)');
      process.exit(1);
    }

    // Limit to first 20 items
    const topListings = listingRefs.slice(0, 20);

    const processed = topListings.map(item => {
      const listingData = resolveRef(item, apolloState);
      if (!listingData) return null;

      const address = listingData.streetAddress;

      let listPrice = 0;
      if (listingData.listPrice && typeof listingData.listPrice === 'object') {
        listPrice = listingData.listPrice.raw;
      } else if (typeof listingData.listPrice === 'number') {
        listPrice = listingData.listPrice;
      }

      let valuation = 0;
      if (listingData.estimate && typeof listingData.estimate === 'object') {
        if (listingData.estimate.price && typeof listingData.estimate.price === 'object') {
          valuation = listingData.estimate.price.raw;
        }
      }

      const url = listingData.url ? `https://www.booli.se${listingData.url}` : '';

      const priceNum = Number(listPrice);
      const valuationNum = Number(valuation);

      let fyndchans = 0;
      let vardeVal = 0;

      if (!isNaN(priceNum) && priceNum > 0 && !isNaN(valuationNum) && valuationNum > 0) {
        vardeVal = valuationNum;
        fyndchans = valuationNum - priceNum;
      } else {
        if (valuationNum > 0) vardeVal = valuationNum;
        fyndchans = 0;
      }

      return {
        adress: address,
        utropspris: priceNum,
        varde: vardeVal > 0 ? vardeVal : null,
        fyndchans: fyndchans,
        lank: url
      };
    }).filter(item => item !== null);

    processed.sort((a, b) => b.fyndchans - a.fyndchans);

    await fs.writeJson(CACHE_FILE, processed, { spaces: 2 });
    console.log(JSON.stringify(processed, null, 2));

  } catch (error) {
    console.error('Error fetching data:', error.message);
    process.exit(1);
  }
}

scrape();
