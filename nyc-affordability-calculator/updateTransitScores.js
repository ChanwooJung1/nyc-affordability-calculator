/**
 * Bulk update transit scores for all rentals in CSV
 * Run this script after adding new rentals or when transit times change
 */

const { readRentalsFromCSV, writeRentalsToCSV } = require('./dataHandler');
const { getTransitScoreForLocation } = require('./transitAPI');

/**
 * Update transit scores for all rentals in the CSV
 */
async function updateAllTransitScores() {
  try {
    console.log('\n=== Starting Transit Score Update ===\n');

    // Read existing rentals
    const rentals = await readRentalsFromCSV();
    console.log(`Found ${rentals.length} rentals to process\n`);

    // Update each rental's transit score
    const updatedRentals = [];

    for (let i = 0; i < rentals.length; i++) {
      const rental = rentals[i];
      console.log(`\n[${i + 1}/${rentals.length}] Processing: ${rental.Address}`);

      try {
        // Get transit score and average time
        const result = await getTransitScoreForLocation(
          parseFloat(rental.Latitude),
          parseFloat(rental.Longitude)
        );

        // Update rental with transit score
        rental['Transit Score'] = result.transitScore;

        console.log(`  ✓ Transit Score: ${result.transitScore}/100 (avg ${result.avgTransitTime} min)`);

        updatedRentals.push(rental);

        // Add delay between API calls to avoid rate limiting
        // Distance Matrix API allows 50 requests/second, but we make 3 calls per rental
        // So we need ~200ms delay per rental minimum
        if (i < rentals.length - 1) {
          console.log('  Waiting to avoid rate limit...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

      } catch (error) {
        console.error(`  ✗ Error: ${error.message}`);
        // Keep existing score on error
        updatedRentals.push(rental);
      }
    }

    // Write updated data back to CSV
    console.log('\n=== Writing Updated Data to CSV ===\n');
    await writeRentalsToCSV(updatedRentals);

    console.log('✓ Transit scores updated successfully!');
    console.log(`Total rentals processed: ${updatedRentals.length}\n`);

  } catch (error) {
    console.error('Failed to update transit scores:', error.message);
    process.exit(1);
  }
}

// Run the update
updateAllTransitScores();
