/**
 * Fix Social Score Script
 *
 * Problem: All rentals have Social Score = 20 because API maxes out at 20 results
 * Solution: Multi-tier weighted scoring that searches at 3 different radii:
 *   - 200m radius (immediate walkability): venues × 3 points
 *   - 400m radius (5-min walk): NEW venues × 2 points
 *   - 800m radius (10-min walk): NEW venues × 1 point
 *
 * This creates differentiation between neighborhoods even when all hit the 20-result cap
 */

const { calculateSocialScore } = require('./placesAPI');
const { readRentalsFromCSV, writeRentalsToCSV } = require('./dataHandler');

/**
 * Recalculate social scores for all rentals using improved multi-tier method
 */
async function fixAllSocialScores() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        Fixing Social Scores with Multi-Tier Strategy          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Read existing rentals
    const rentals = await readRentalsFromCSV();
    console.log(`📁 Loaded ${rentals.length} rentals from CSV\n`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    // Process each rental
    for (let i = 0; i < rentals.length; i++) {
      const rental = rentals[i];

      console.log(`\n[${ i + 1}/${rentals.length}] ${rental.Address}`);
      console.log(`  Current Score: ${rental['Social Score']}`);

      try {
        // Calculate new weighted social score
        const newScore = await calculateSocialScore(
          parseFloat(rental.Latitude),
          parseFloat(rental.Longitude)
        );

        // Update rental object
        rental['Social Score'] = newScore;

        results.push({
          address: rental.Address,
          oldScore: 20,
          newScore: newScore,
          change: newScore - 20
        });

        successCount++;
        console.log(`  ✓ Updated to: ${newScore} (${newScore > 20 ? '+' : ''}${newScore - 20})`);

        // Delay to avoid rate limiting (3 API calls per rental)
        if (i < rentals.length - 1) {
          console.log('  ⏳ Waiting 1 second to avoid rate limits...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        failCount++;
        // Keep existing score on error
      }
    }

    // Write updated data back to CSV
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    Saving to CSV                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    await writeRentalsToCSV(rentals);
    console.log('✓ CSV updated successfully!\n');

    // Summary statistics
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      Update Summary                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Rentals: ${rentals.length}`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failCount}\n`);

    // Show score distribution
    console.log('Score Changes:');
    results.sort((a, b) => b.newScore - a.newScore);

    results.forEach((r, i) => {
      const changeStr = r.change > 0 ? `+${r.change}` : r.change;
      const emoji = r.change > 20 ? '🔥' : r.change > 0 ? '📈' : '📉';
      console.log(`  ${emoji} ${r.address.substring(0, 40).padEnd(40)} | ${r.oldScore} → ${r.newScore} (${changeStr})`);
    });

    console.log('\n✨ Social scores fixed successfully!');
    console.log('🎯 New scores now differentiate between neighborhoods\n');

  } catch (error) {
    console.error('\n❌ Error fixing social scores:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the fix
fixAllSocialScores();
