/**
 * Zillow Listing Data Extractor
 * Extracts rental data from individual Zillow listing URLs
 *
 * Usage:
 * 1. Create a file called "urls.txt" with one Zillow URL per line
 * 2. Run: node extractFromUrls.js [zipCode]
 * 3. Data will be saved to [zipCode] Rental Listings.csv
 *
 * Example urls.txt:
 * https://www.zillow.com/apartments/new-york-ny/the-capitol/CkLq8m/
 * https://www.zillow.com/apartments/new-york-ny/mabel/CmVvTr/
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const Papa = require('papaparse');

puppeteer.use(StealthPlugin());

const DELAY_MS = 2000; // 2 seconds between requests

/**
 * Extract data from a single Zillow listing URL
 */
async function extractListingData(page, url, zipCode) {
  try {
    console.log(`  📍 Visiting: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract data from the page
    const listing = await page.evaluate((zip) => {
      try {
        // Try to get data from JSON-LD structured data
        const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
        let jsonData = null;

        for (const script of scriptTags) {
          try {
            const data = JSON.parse(script.textContent);
            if (data['@type'] === 'Apartment' || data['@type'] === 'House') {
              jsonData = data;
              break;
            }
          } catch (e) {}
        }

        // Extract from page elements
        const address = document.querySelector('h1')?.textContent?.trim() || '';

        // Price - try multiple selectors
        let price = document.querySelector('[data-testid="price"]')?.textContent ||
                   document.querySelector('.summary-price')?.textContent ||
                   '';
        price = price.replace(/[$,\/mo]/g, '').trim();

        // Beds/Baths/Sqft
        const facts = document.querySelectorAll('[data-testid="bed-bath-item"]');
        let beds = '', baths = '', sqft = '';

        facts.forEach(fact => {
          const text = fact.textContent;
          if (text.includes('bd')) beds = text.replace(/[^0-9]/g, '');
          if (text.includes('ba')) baths = text.replace(/[^0-9.]/g, '');
          if (text.includes('sqft')) sqft = text.replace(/[^0-9]/g, '');
        });

        // Try alternative selectors
        if (!beds) {
          const bedsEl = document.querySelector('[data-testid="bed-bath-beyond"]');
          if (bedsEl) {
            const match = bedsEl.textContent.match(/(\d+)\s*bd/);
            if (match) beds = match[1];
          }
        }

        // Get coordinates from map or JSON
        let lat = '', lng = '';

        // Try to find in script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent;
          const latMatch = text.match(/"latitude":([-0-9.]+)/);
          const lngMatch = text.match(/"longitude":([-0-9.]+)/);
          if (latMatch && lngMatch) {
            lat = latMatch[1];
            lng = lngMatch[1];
            break;
          }
        }

        return {
          address,
          zip,
          price: parseInt(price) || 0,
          bedrooms: beds,
          bathrooms: baths,
          sqft: sqft,
          url: window.location.href,
          lat,
          lng,
          'Transit Score': 0,
          'Social Score': 0,
          'Grocery Score': 0
        };

      } catch (err) {
        console.error('Error extracting data:', err.message);
        return null;
      }
    }, zipCode);

    if (listing && listing.address) {
      console.log(`    ✓ ${listing.address} - $${listing.price}/mo - ${listing.bedrooms}bd/${listing.bathrooms}ba`);
      if (listing.lat && listing.lng) {
        console.log(`    📍 Coordinates: (${listing.lat}, ${listing.lng})`);
      }
      return listing;
    } else {
      console.log(`    ⚠ Could not extract data from this URL`);
      return null;
    }

  } catch (err) {
    console.error(`    ❌ Error: ${err.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n=== Zillow URL Data Extractor ===\n');

  // Get zip code from command line
  const zipCode = process.argv[2] || '10001';
  console.log(`Extracting data for ZIP code: ${zipCode}`);

  // Read URLs from file
  const urlsFile = 'urls.txt';
  if (!fs.existsSync(urlsFile)) {
    console.error(`\n❌ Error: ${urlsFile} not found`);
    console.log('\nCreate a file called "urls.txt" with one Zillow URL per line:');
    console.log('Example:');
    console.log('https://www.zillow.com/apartments/new-york-ny/the-capitol/CkLq8m/');
    console.log('https://www.zillow.com/apartments/new-york-ny/mabel/CmVvTr/\n');
    return;
  }

  const urlsContent = fs.readFileSync(urlsFile, 'utf8');
  const urls = urlsContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && line.startsWith('http'));

  if (urls.length === 0) {
    console.error('❌ No valid URLs found in urls.txt');
    return;
  }

  console.log(`Found ${urls.length} URLs to process\n`);

  // Launch browser
  console.log('🚀 Launching browser...\n');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  const listings = [];

  // Process each URL
  for (let i = 0; i < urls.length; i++) {
    console.log(`[${i + 1}/${urls.length}] Processing...`);
    const listing = await extractListingData(page, urls[i], zipCode);

    if (listing) {
      listings.push(listing);
    }

    // Delay between requests
    if (i < urls.length - 1) {
      console.log(`  ⏳ Waiting ${DELAY_MS/1000}s...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  await browser.close();

  // Save to CSV
  if (listings.length > 0) {
    const fileName = `./${zipCode} Rental Listings.csv`;
    const csv = Papa.unparse(listings, { header: true });
    fs.writeFileSync(fileName, csv, 'utf8');

    console.log('\n=== Summary ===');
    console.log(`✓ Successfully extracted ${listings.length}/${urls.length} listings`);
    console.log(`💾 Saved to: ${fileName}`);

    const withCoords = listings.filter(l => l.lat && l.lng).length;
    console.log(`📍 ${withCoords}/${listings.length} listings have coordinates`);

    console.log('\n✓ Next steps:');
    console.log('1. Run: node updateTransitScores.js');
    console.log('2. Run: node updateDailyLivingScores.js');
    console.log('3. Run: node updateGroceryScores.js');
  } else {
    console.log('\n❌ No listings extracted. Check if URLs are valid Zillow listing pages.');
  }

  console.log();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
