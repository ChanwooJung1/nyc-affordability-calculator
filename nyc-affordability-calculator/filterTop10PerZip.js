/**
 * Filter rental listings to keep top 10 per zip code
 * Removes anomalies and keeps best quality listings
 */

const fs = require('fs');
const Papa = require('papaparse');

// Define what constitutes an anomaly
const PRICE_MIN = 500;      // Suspiciously cheap (likely error)
const PRICE_MAX = 20000;    // Extremely expensive (outlier)

/**
 * Check if a rental is an anomaly
 */
function isAnomaly(rental) {
  const price = rental.price || rental['Rental Price'];
  const lat = rental.lat || rental.Latitude;
  const lng = rental.lng || rental.Longitude;

  // Missing critical data
  if (!price || !lat || !lng) {
    return true;
  }

  // Price outliers
  if (price < PRICE_MIN || price > PRICE_MAX) {
    return true;
  }

  return false;
}

/**
 * Score a rental for quality (higher = better)
 */
function scoreRental(rental) {
  let score = 0;

  // Has bedrooms/bathrooms info
  if (rental.bedrooms || rental.Bedrooms) score += 2;
  if (rental.bathrooms || rental.Bathrooms) score += 2;

  // Has square footage
  if (rental.sqft || rental['Square Feet']) score += 1;

  // Price reasonableness (prefer mid-range)
  const price = rental.price || rental['Rental Price'];
  if (price >= 1500 && price <= 5000) score += 3;
  else if (price >= 1000 && price <= 8000) score += 1;

  return score;
}

/**
 * Get top 10 listings from a zip code
 */
function getTop10(zipCode, allRentals) {
  // Filter valid rentals
  const valid = allRentals.filter(r => !isAnomaly(r));

  // Score and sort
  const scored = valid.map(r => ({
    rental: r,
    score: scoreRental(r)
  }));

  scored.sort((a, b) => {
    // First by score
    if (b.score !== a.score) return b.score - a.score;
    // Then by price (prefer variety - alternate high/low)
    return 0;
  });

  // Get diverse price range (not all expensive or all cheap)
  const top10 = [];
  const priceRanges = {
    budget: [],      // < $2000
    midrange: [],    // $2000-4000
    luxury: []       // > $4000
  };

  scored.forEach(({ rental }) => {
    const price = rental.price || rental['Rental Price'];
    if (price < 2000) priceRanges.budget.push(rental);
    else if (price <= 4000) priceRanges.midrange.push(rental);
    else priceRanges.luxury.push(rental);
  });

  // Take 4 budget, 4 midrange, 2 luxury (if available)
  top10.push(...priceRanges.budget.slice(0, 4));
  top10.push(...priceRanges.midrange.slice(0, 4));
  top10.push(...priceRanges.luxury.slice(0, 2));

  // Fill remaining slots if we don't have 10
  if (top10.length < 10) {
    const remaining = scored
      .map(s => s.rental)
      .filter(r => !top10.includes(r))
      .slice(0, 10 - top10.length);
    top10.push(...remaining);
  }

  return top10.slice(0, 10);
}

/**
 * Process all zip code files
 */
async function main() {
  console.log('\n=== Filtering Rentals to Top 10 Per Zip Code ===\n');

  const files = fs.readdirSync('.')
    .filter(f => f.endsWith(' Rental Listings.csv'));

  console.log(`Found ${files.length} zip code files\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let anomaliesRemoved = 0;

  for (const file of files) {
    const zipCode = file.replace(' Rental Listings.csv', '');

    try {
      // Read CSV
      const csvContent = fs.readFileSync(file, 'utf8');
      const parsed = Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      const before = parsed.data.length;
      totalBefore += before;

      // Get top 10
      const top10 = getTop10(zipCode, parsed.data);
      totalAfter += top10.length;
      anomaliesRemoved += (before - top10.length);

      // Write back to CSV
      const csv = Papa.unparse(top10, { header: true });
      fs.writeFileSync(file, csv, 'utf8');

      console.log(`${zipCode}: ${before} → ${top10.length} listings (removed ${before - top10.length})`);

    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total before: ${totalBefore} listings`);
  console.log(`Total after: ${totalAfter} listings`);
  console.log(`Anomalies removed: ${anomaliesRemoved}`);
  console.log(`Reduction: ${((1 - totalAfter/totalBefore) * 100).toFixed(1)}%`);

  console.log('\nEstimated API costs (after filtering):');
  console.log(`  Transit scores: $${(totalAfter * 3 * 0.005).toFixed(2)}`);
  console.log(`  Social scores: $${(totalAfter * 2 * 0.017).toFixed(2)}`);
  console.log(`  Grocery scores: $${(totalAfter * 1 * 0.017).toFixed(2)}`);
  console.log(`  Total: ~$${(totalAfter * 3 * 0.005 + totalAfter * 3 * 0.017).toFixed(2)}`);

  console.log('\nEstimated processing time: ~' + (totalAfter / 1000 * 1.3).toFixed(1) + ' hours\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
