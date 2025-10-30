/**
 * Normalize ALL Scores to 0-100 Scale (No Decimals)
 *
 * This script normalizes:
 * 1. Transit Score - Already 0-100, just remove decimals
 * 2. Social Score - Currently 16-108, normalize to 0-100
 * 3. Grocery Score - Currently 5-115, normalize to 0-100
 *
 * Formula: normalized = Math.round((value / maxValue) * 100)
 */

const { readRentalsFromCSV, writeRentalsToCSV } = require('./dataHandler');

/**
 * Main function to normalize all scores
 */
async function normalizeAllScores() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Normalizing All Scores to 0-100 Scale               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Read all rentals
    const rentals = await readRentalsFromCSV();
    console.log(`📁 Loaded ${rentals.length} rentals from CSV\n`);

    // Step 1: Find max values for each score type
    console.log('📊 Step 1: Analyzing current score ranges...\n');

    const transitScores = rentals.map(r => parseFloat(r['Transit Score']) || 0);
    const socialScores = rentals.map(r => parseFloat(r['Social Score']) || 0);
    const groceryScores = rentals.map(r => parseFloat(r['Grocery Score']) || 0);

    const maxTransit = Math.max(...transitScores);
    const minTransit = Math.min(...transitScores);
    const maxSocial = Math.max(...socialScores);
    const minSocial = Math.min(...socialScores);
    const maxGrocery = Math.max(...groceryScores);
    const minGrocery = Math.min(...groceryScores);

    console.log('Current Score Ranges:');
    console.log(`  Transit Score:  ${minTransit} - ${maxTransit}`);
    console.log(`  Social Score:   ${minSocial} - ${maxSocial}`);
    console.log(`  Grocery Score:  ${minGrocery} - ${maxGrocery}\n`);

    // Step 2: Normalize each rental's scores
    console.log('🔧 Step 2: Normalizing scores to 0-100...\n');

    const normalizedRentals = rentals.map((rental, index) => {
      const transit = parseFloat(rental['Transit Score']) || 0;
      const social = parseFloat(rental['Social Score']) || 0;
      const grocery = parseFloat(rental['Grocery Score']) || 0;

      // Normalize to 0-100 (no decimals)
      // Transit is already 0-100, just round it
      const normalizedTransit = Math.round(transit);

      // Social: normalize based on max value
      const normalizedSocial = maxSocial > 0
        ? Math.round((social / maxSocial) * 100)
        : 0;

      // Grocery: normalize based on max value
      const normalizedGrocery = maxGrocery > 0
        ? Math.round((grocery / maxGrocery) * 100)
        : 0;

      // Update rental object
      rental['Transit Score'] = normalizedTransit;
      rental['Social Score'] = normalizedSocial;
      rental['Grocery Score'] = normalizedGrocery;

      // Show sample (first 5 rentals)
      if (index < 5) {
        console.log(`[${index + 1}] ${rental.Address.substring(0, 40)}`);
        console.log(`    Transit:  ${transit} → ${normalizedTransit}`);
        console.log(`    Social:   ${social} → ${normalizedSocial}`);
        console.log(`    Grocery:  ${grocery} → ${normalizedGrocery}\n`);
      }

      return rental;
    });

    // Step 3: Verify new ranges
    console.log('📊 Step 3: Verifying normalized ranges...\n');

    const newTransitScores = normalizedRentals.map(r => r['Transit Score']);
    const newSocialScores = normalizedRentals.map(r => r['Social Score']);
    const newGroceryScores = normalizedRentals.map(r => r['Grocery Score']);

    const newMaxTransit = Math.max(...newTransitScores);
    const newMinTransit = Math.min(...newTransitScores);
    const newMaxSocial = Math.max(...newSocialScores);
    const newMinSocial = Math.min(...newSocialScores);
    const newMaxGrocery = Math.max(...newGroceryScores);
    const newMinGrocery = Math.min(...newGroceryScores);

    console.log('New Score Ranges (all 0-100):');
    console.log(`  Transit Score:  ${newMinTransit} - ${newMaxTransit} ✓`);
    console.log(`  Social Score:   ${newMinSocial} - ${newMaxSocial} ✓`);
    console.log(`  Grocery Score:  ${newMinGrocery} - ${newMaxGrocery} ✓\n`);

    // Step 4: Save to CSV
    console.log('💾 Step 4: Saving normalized scores to CSV...\n');
    await writeRentalsToCSV(normalizedRentals);
    console.log('✓ CSV updated successfully!\n');

    // Step 5: Summary statistics
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      Summary Statistics                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Rentals Processed: ${normalizedRentals.length}`);
    console.log(`All scores normalized to 0-100 scale (no decimals)\n`);

    // Show distribution by ZIP code
    const zipStats = {};
    normalizedRentals.forEach(r => {
      const zip = r['Zip Code'];
      if (!zipStats[zip]) {
        zipStats[zip] = { count: 0, avgTransit: 0, avgSocial: 0, avgGrocery: 0 };
      }
      zipStats[zip].count++;
      zipStats[zip].avgTransit += r['Transit Score'];
      zipStats[zip].avgSocial += r['Social Score'];
      zipStats[zip].avgGrocery += r['Grocery Score'];
    });

    console.log('Average Scores by ZIP Code:');
    console.log('┌─────────┬────────┬─────────┬─────────┬─────────┐');
    console.log('│ ZIP     │ Count  │ Transit │ Social  │ Grocery │');
    console.log('├─────────┼────────┼─────────┼─────────┼─────────┤');

    Object.keys(zipStats).sort().forEach(zip => {
      const stats = zipStats[zip];
      const avgT = Math.round(stats.avgTransit / stats.count);
      const avgS = Math.round(stats.avgSocial / stats.count);
      const avgG = Math.round(stats.avgGrocery / stats.count);
      console.log(`│ ${zip.padEnd(7)} │ ${String(stats.count).padEnd(6)} │ ${String(avgT).padEnd(7)} │ ${String(avgS).padEnd(7)} │ ${String(avgG).padEnd(7)} │`);
    });
    console.log('└─────────┴────────┴─────────┴─────────┴─────────┘\n');

    console.log('✨ All scores normalized successfully!');
    console.log('🎯 Ready for ZIP-level aggregate calculation\n');

  } catch (error) {
    console.error('\n❌ Error normalizing scores:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the normalization
normalizeAllScores();
