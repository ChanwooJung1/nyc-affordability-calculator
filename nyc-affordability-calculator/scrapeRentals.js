/**
 * Zillow Rental Scraper
 * Scrapes rental listings from Zillow for specified NYC zip codes
 *
 * WARNING: Web scraping may violate Zillow's Terms of Service
 * Use responsibly and at your own risk
 *
 * Usage: node scrapeRentals.js [zipCode1,zipCode2,...]
 * Example: node scrapeRentals.js 10001,10002
 */

const https = require('https');
const fs = require('fs');
const Papa = require('papaparse');

// Configuration
const DELAY_MS = 3000; // 3 seconds between requests (be respectful)
const MAX_RETRIES = 3;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Default NYC zip codes
const DEFAULT_ZIP_CODES = [
  '10001', '10002', '10003', '10005', '10006', '10007',
  '10009', '10010', '10011', '10012', '11201', '11203'
];

/**
 * Fetch Zillow search results page
 * @param {string} zipCode - ZIP code to search
 * @returns {Promise<string>} HTML content
 */
function fetchZillowPage(zipCode, retryCount = 0) {
  return new Promise((resolve, reject) => {
    // Zillow rental search URL format
    const url = `https://www.zillow.com/homes/for_rent/${zipCode}_rb/`;

    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      // Handle gzip encoding
      if (res.headers['content-encoding'] === 'gzip') {
        const zlib = require('zlib');
        const gunzip = zlib.createGunzip();
        res.pipe(gunzip);
        gunzip.on('data', chunk => data += chunk.toString());
        gunzip.on('end', () => resolve({ html: data, statusCode: res.statusCode }));
      } else {
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ html: data, statusCode: res.statusCode }));
      }

    }).on('error', (err) => {
      if (retryCount < MAX_RETRIES) {
        console.log(`  ⚠ Retry ${retryCount + 1}/${MAX_RETRIES} for ${zipCode}...`);
        setTimeout(() => {
          fetchZillowPage(zipCode, retryCount + 1).then(resolve).catch(reject);
        }, DELAY_MS * 2);
      } else {
        reject(new Error(`Request failed after ${MAX_RETRIES} retries: ${err.message}`));
      }
    });
  });
}

/**
 * Parse rental listings from Zillow HTML
 * This is a basic parser - Zillow's HTML structure changes frequently
 * You may need to update selectors
 * @param {string} html - HTML content
 * @param {string} zipCode - ZIP code
 * @returns {Array} Array of rental listings
 */
function parseZillowListings(html, zipCode) {
  const listings = [];

  try {
    // Zillow often embeds data in JSON within script tags
    // Look for the NextJS data structure
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

    if (scriptMatch) {
      const jsonData = JSON.parse(scriptMatch[1]);

      // Navigate the JSON structure (this path may change)
      const searchResults = jsonData?.props?.pageProps?.searchPageState?.cat1?.searchResults?.listResults || [];

      searchResults.forEach(result => {
        if (result.hdpData && result.hdpData.homeInfo) {
          const info = result.hdpData.homeInfo;

          listings.push({
            'address': info.streetAddress || '',
            'zip': zipCode,
            'price': info.price || '',
            'lat': info.latitude || '',
            'lng': info.longitude || '',
            'url': `https://www.zillow.com${info.hdpUrl}` || '',
            'bedrooms': info.bedrooms || '',
            'bathrooms': info.bathrooms || '',
            'sqft': info.livingArea || '',
            'Transit Score': 0,
            'Social Score': 0,
            'Grocery Score': 0
          });
        }
      });
    }

    console.log(`  📊 Parsed ${listings.length} listings from HTML`);

  } catch (err) {
    console.error(`  ❌ Parse error: ${err.message}`);
  }

  return listings;
}

/**
 * Scrape rentals for a single zip code
 * @param {string} zipCode - ZIP code to scrape
 * @returns {Promise<Array>} Array of rental listings
 */
async function scrapeZipCode(zipCode) {
  console.log(`Scraping ${zipCode}...`);

  try {
    const { html, statusCode } = await fetchZillowPage(zipCode);

    if (statusCode !== 200) {
      console.warn(`  ⚠ HTTP ${statusCode} for ${zipCode}`);
      return [];
    }

    const listings = parseZillowListings(html, zipCode);

    if (listings.length > 0) {
      // Save to CSV file
      const fileName = `./${zipCode} Rental Listings.csv`;
      const csv = Papa.unparse(listings, { header: true });
      fs.writeFileSync(fileName, csv, 'utf8');
      console.log(`  ✓ Saved ${listings.length} listings to ${fileName}`);
    } else {
      console.warn(`  ⚠ No listings found for ${zipCode} (Zillow may have changed HTML structure)`);
    }

    return listings;

  } catch (err) {
    console.error(`  ❌ Error scraping ${zipCode}: ${err.message}`);
    return [];
  }
}

/**
 * Main scraping function
 */
async function main() {
  console.log('\n=== Zillow Rental Scraper ===');
  console.log('⚠️  WARNING: Web scraping may violate Terms of Service');
  console.log('⚠️  Use responsibly and at your own risk\n');

  // Get zip codes from command line or use defaults
  const zipCodes = process.argv[2]
    ? process.argv[2].split(',').map(z => z.trim())
    : DEFAULT_ZIP_CODES;

  console.log(`Scraping ${zipCodes.length} zip codes...`);
  console.log(`ZIP codes: ${zipCodes.join(', ')}\n`);

  let totalListings = 0;

  for (let i = 0; i < zipCodes.length; i++) {
    const zipCode = zipCodes[i];

    const listings = await scrapeZipCode(zipCode);
    totalListings += listings.length;

    // Rate limiting delay (except for last request)
    if (i < zipCodes.length - 1) {
      console.log(`  ⏳ Waiting ${DELAY_MS/1000}s before next request...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total listings scraped: ${totalListings}`);

  if (totalListings === 0) {
    console.log('\n⚠️  No listings found. Possible reasons:');
    console.log('1. Zillow changed their HTML structure (most likely)');
    console.log('2. Zillow is blocking automated requests');
    console.log('3. No active rentals in those zip codes');
    console.log('\nYou may need to update the parsing logic in parseZillowListings()');
  } else {
    console.log('\n✓ Next steps:');
    console.log('1. Run: node updateTransitScores.js');
    console.log('2. Run: node updateDailyLivingScores.js');
    console.log('3. Run: node updateGroceryScores.js');
    console.log('4. Start server: npm start');
  }

  console.log();
}

// Run the scraper
main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
