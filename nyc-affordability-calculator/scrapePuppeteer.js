/**
 * Zillow Rental Scraper with Puppeteer
 * Uses headless Chrome to scrape rental listings
 *
 * WARNING: Web scraping may violate Zillow's Terms of Service
 * Use responsibly and at your own risk
 *
 * Usage: node scrapePuppeteer.js [zipCode1,zipCode2,...]
 * Example: node scrapePuppeteer.js 10001
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const Papa = require('papaparse');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Configuration
const DELAY_MS = 5000; // 5 seconds between requests
const PAGE_LOAD_TIMEOUT = 90000; // 90 seconds (allows time for CAPTCHA solving)

/**
 * Scrape Zillow rentals for a zip code using Puppeteer
 * @param {Object} browser - Puppeteer browser instance
 * @param {string} zipCode - ZIP code to scrape
 * @returns {Promise<Array>} Array of rental listings
 */
async function scrapeZipCode(browser, zipCode) {
  console.log(`\nScraping ${zipCode}...`);

  const page = await browser.newPage();

  try {
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate to Zillow search page
    const url = `https://www.zillow.com/homes/for_rent/${zipCode}_rb/`;
    console.log(`  📍 Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: PAGE_LOAD_TIMEOUT
    });

    // Wait a bit for JavaScript to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for CAPTCHA/bot detection
    const hasCaptcha = await page.evaluate(() => {
      return document.body.textContent.includes('Press & Hold to confirm') ||
             document.body.textContent.includes('confirm you are a human');
    });

    if (hasCaptcha) {
      console.log(`  🤖 CAPTCHA detected!`);
      console.log(`  👆 Please solve the CAPTCHA in the browser window...`);
      console.log(`  ⏳ Waiting 60 seconds for you to solve it...`);

      // Wait 60 seconds for manual CAPTCHA solving
      await new Promise(resolve => setTimeout(resolve, 60000));

      console.log(`  ✓ Continuing after CAPTCHA delay...`);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: `debug_${zipCode}.png` });
    console.log(`  📸 Screenshot saved to debug_${zipCode}.png`);

    // Extract listing data from Zillow's embedded JSON
    const listings = await page.evaluate((zip) => {
      const results = [];

      try {
        // Zillow embeds data in __NEXT_DATA__ script tag
        const scriptTag = document.querySelector('#__NEXT_DATA__');
        if (scriptTag) {
          const jsonData = JSON.parse(scriptTag.textContent);
          const searchResults = jsonData?.props?.pageProps?.searchPageState?.cat1?.searchResults?.listResults || [];

          console.log(`Found ${searchResults.length} listings in JSON data`);

          searchResults.forEach(result => {
            try {
              const hdpData = result.hdpData?.homeInfo;
              const addressInfo = result.addressInfo;

              if (hdpData) {
                results.push({
                  address: hdpData.streetAddress || '',
                  zip: zip,
                  price: hdpData.price || 0,
                  bedrooms: hdpData.bedrooms || '',
                  bathrooms: hdpData.bathrooms || '',
                  sqft: hdpData.livingArea || '',
                  url: `https://www.zillow.com${hdpData.hdpUrl}` || '',
                  lat: hdpData.latitude || '',
                  lng: hdpData.longitude || '',
                  'Transit Score': 0,
                  'Social Score': 0,
                  'Grocery Score': 0
                });
              }
            } catch (err) {
              console.error('Error parsing listing:', err.message);
            }
          });
        } else {
          console.log('No __NEXT_DATA__ found, trying fallback...');

          // Fallback: try to scrape from cards
          const listingCards = document.querySelectorAll('article[data-test="property-card"]');
          console.log(`Found ${listingCards.length} listing cards`);

          listingCards.forEach(card => {
            try {
              const addressEl = card.querySelector('address');
              const address = addressEl ? addressEl.textContent.trim() : '';

              const priceEl = card.querySelector('[data-test="property-card-price"]');
              let price = priceEl ? priceEl.textContent.trim() : '';
              price = price.replace(/[$,\/mo+]/g, '').trim();

              const linkEl = card.querySelector('a[data-test="property-card-link"]');
              const url = linkEl ? linkEl.href : '';

              if (address && price) {
                results.push({
                  address,
                  zip,
                  price: parseInt(price) || 0,
                  bedrooms: '',
                  bathrooms: '',
                  sqft: '',
                  url,
                  lat: '',
                  lng: '',
                  'Transit Score': 0,
                  'Social Score': 0,
                  'Grocery Score': 0
                });
              }
            } catch (err) {
              console.error('Error parsing card:', err.message);
            }
          });
        }
      } catch (err) {
        console.error('Error extracting listings:', err.message);
      }

      return results;
    }, zipCode);

    console.log(`  ✓ Found ${listings.length} listings`);

    // Check how many already have coordinates
    const withCoords = listings.filter(l => l.lat && l.lng).length;
    console.log(`  📍 ${withCoords}/${listings.length} listings have coordinates from Zillow`);

    // Save to CSV if we found listings
    if (listings.length > 0) {
      const fileName = `./${zipCode} Rental Listings.csv`;
      const csv = Papa.unparse(listings, { header: true });
      fs.writeFileSync(fileName, csv, 'utf8');
      console.log(`  💾 Saved ${listings.length} listings to ${fileName}`);
    }

    return listings;

  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n=== Zillow Rental Scraper (Puppeteer) ===');
  console.log('⚠️  WARNING: Web scraping may violate Terms of Service');
  console.log('⚠️  Use responsibly and at your own risk\n');

  // Get zip codes from command line
  const zipCodes = process.argv[2]
    ? process.argv[2].split(',').map(z => z.trim())
    : ['10001'];

  console.log(`Scraping ${zipCodes.length} zip code(s): ${zipCodes.join(', ')}`);

  // Launch browser
  console.log('\n🚀 Launching browser (visible so you can solve CAPTCHAs)...');
  const browser = await puppeteer.launch({
    headless: false, // Keep visible for manual CAPTCHA solving
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized'
    ],
    defaultViewport: null
  });

  let totalListings = 0;

  for (let i = 0; i < zipCodes.length; i++) {
    const listings = await scrapeZipCode(browser, zipCodes[i]);
    totalListings += listings.length;

    // Delay between zip codes
    if (i < zipCodes.length - 1) {
      console.log(`\n⏳ Waiting ${DELAY_MS/1000}s before next zip code...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  await browser.close();

  console.log('\n=== Summary ===');
  console.log(`Total listings scraped: ${totalListings}`);

  if (totalListings > 0) {
    console.log('\n✓ Next steps:');
    console.log('1. Run: node updateTransitScores.js');
    console.log('2. Run: node updateDailyLivingScores.js');
    console.log('3. Run: node updateGroceryScores.js');
  } else {
    console.log('\n⚠️  Check the debug screenshots to see what Zillow is showing');
  }

  console.log();
}

// Run
main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
