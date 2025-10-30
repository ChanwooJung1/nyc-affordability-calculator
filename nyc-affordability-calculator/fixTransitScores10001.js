/**
 * Fix Transit Scores for ZIP 10001
 *
 * Problem: All transit scores for ZIP 10001 are 0
 * Solution: Re-run transit score calculation using Google Distance Matrix API
 */

const fs = require('fs');
const Papa = require('papaparse');
const { getTransitScoreForLocation } = require('./transitAPI');

/**
 * Read rentals from specific ZIP code CSV
 */
async function readRentalsForZip(zipCode) {
  const filePath = `./${zipCode} Rental Listings.csv`;

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(fileContent, {
    header: true,
    dynamicTyping: false, // Keep as strings to preserve formatting
    skipEmptyLines: true
  });

  console.log(`✓ Loaded ${result.data.length} rentals from ${zipCode} Rental Listings.csv`);
  return result.data;
}

/**
 * Write rentals back to ZIP code CSV
 */
async function writeRentalsForZip(zipCode, rentals) {
  const filePath = `./${zipCode} Rental Listings.csv`;

  const csvContent = Papa.unparse(rentals, {
    header: true
  });

  fs.writeFileSync(filePath, csvContent, 'utf-8');
  console.log(`✓ Updated ${rentals.length} rentals in ${zipCode} Rental Listings.csv`);
}

/**
 * Main function to fix transit scores for ZIP 10001
 */
async function fixTransitScores10001() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         Fixing Transit Scores for ZIP 10001                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Read ZIP 10001 rentals
    const rentals = await readRentalsForZip('10001');
    console.log(`\n📍 Processing ${rentals.length} rentals in Manhattan (ZIP 10001)\n`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    // Process each rental
    for (let i = 0; i < rentals.length; i++) {
      const rental = rentals[i];

      console.log(`\n[${i + 1}/${rentals.length}] ${rental.address || rental.Address}`);
      console.log(`  Current Transit Score: ${rental['Transit Score']}`);
      console.log(`  Coordinates: (${rental.lat || rental.Latitude}, ${rental.lng || rental.Longitude})`);

      try {
        // Get latitude and longitude (handle both naming conventions)
        const lat = parseFloat(rental.lat || rental.Latitude);
        const lng = parseFloat(rental.lng || rental.Longitude);

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid coordinates');
        }

        // Calculate transit score
        const result = await getTransitScoreForLocation(lat, lng);

        // Update rental object
        rental['Transit Score'] = result.transitScore;

        results.push({
          address: rental.address || rental.Address,
          oldScore: 0,
          newScore: result.transitScore,
          avgTime: result.avgTransitTime
        });

        successCount++;
        console.log(`  ✓ New Transit Score: ${result.transitScore}/100 (avg ${result.avgTransitTime} min)`);

        // Delay to avoid rate limiting (3 API calls per rental)
        if (i < rentals.length - 1) {
          console.log('  ⏳ Waiting 1.5 seconds to avoid rate limits...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        failCount++;
        // Keep existing score (0) on error
      }
    }

    // Save updated rentals
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    Saving to CSV                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    await writeRentalsForZip('10001', rentals);
    console.log('✓ CSV updated successfully!\n');

    // Summary statistics
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      Update Summary                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Rentals: ${rentals.length}`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failCount}\n`);

    // Show score distribution
    if (results.length > 0) {
      console.log('Transit Score Results:');
      results.sort((a, b) => b.newScore - a.newScore);

      results.forEach((r, i) => {
        const emoji = r.newScore >= 75 ? '🔥' : r.newScore >= 50 ? '✅' : '⚠️';
        console.log(`  ${emoji} ${r.address.substring(0, 40).padEnd(40)} | ${r.oldScore} → ${r.newScore} (${r.avgTime} min avg)`);
      });

      // Calculate statistics
      const scores = results.map(r => r.newScore);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      console.log('\n📊 Statistics:');
      console.log(`   Average Transit Score: ${avgScore}/100`);
      console.log(`   Range: ${minScore} - ${maxScore}`);
      console.log(`   Success Rate: ${Math.round((successCount / rentals.length) * 100)}%\n`);
    }

    console.log('✨ Transit scores for ZIP 10001 fixed successfully!');
    console.log('🎯 Manhattan rentals now have accurate transit accessibility data\n');

  } catch (error) {
    console.error('\n❌ Error fixing transit scores:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the fix
fixTransitScores10001();
