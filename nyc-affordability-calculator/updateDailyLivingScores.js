/**
 * Script to Update Daily Living Scores using Google Places API
 * Run this script to fetch daily living affordability scores for all rentals and update the CSV
 *
 * DAILY LIVING AFFORDABILITY:
 * - Counts coffee shops and restaurants within 0.5 miles
 * - Walkable venues eliminate car-dependent errands, reducing transportation costs
 * - Dense neighborhoods save $100-200/month in delivery fees and eliminate need for car ownership
 */

const { calculateSocialScore } = require('./placesAPI');
const { readRentalsFromCSV, writeRentalsToCSV, displayRentals } = require('./dataHandler');

/**
 * Main function to update all daily living scores
 */
async function updateAllDailyLivingScores() {
  console.log('=== Updating Daily Living Affordability Scores for All Rentals ===\n');
  console.log('This measures walkable restaurants and cafes within 0.5 miles');
  console.log('Walkable neighborhoods eliminate car ownership and delivery fees\n');

  try {
    // Read rentals from CSV
    const rentals = await readRentalsFromCSV();
    console.log(`Loaded ${rentals.length} rentals\n`);

    // Update social score for each rental
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rentals.length; i++) {
      const rental = rentals[i];
      console.log(`[${i + 1}/${rentals.length}] Processing: ${rental.Address}`);
      console.log(`  Coordinates: (${rental.Latitude}, ${rental.Longitude})`);
      console.log(`  Current Social Score: ${rental['Social Score']}`);

      try {
        // Calculate social score using lat/lng
        const socialScore = await calculateSocialScore(rental.Latitude, rental.Longitude);
        console.log(`  API returned: ${socialScore} venues`);

        rental['Social Score'] = socialScore;
        console.log(`  Updated Social Score to: ${rental['Social Score']}`);

        successCount++;
        console.log(`  ✓ Success`);

        // Add small delay to avoid rate limiting (optional, adjust as needed)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        console.error(`  Full error:`, error);
        rental['Social Score'] = 0; // Set to 0 on failure
        failCount++;
      }
    }

    // Write updated data back to CSV
    console.log('\n=== Writing to CSV ===');
    await writeRentalsToCSV(rentals);
    console.log('CSV write completed');

    console.log('\n=== Update Complete ===');
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log('\nUpdated rentals saved to CSV');

    // Display sample results
    console.log('\nSample results (top 5):');
    displayRentals(rentals.slice(0, 5));

    // Verify by re-reading CSV
    console.log('\n=== Verifying CSV Update ===');
    const verifyRentals = await readRentalsFromCSV();
    console.log('Social Scores in CSV:');
    verifyRentals.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.Address}: ${r['Social Score']}`);
    });

  } catch (error) {
    console.error('Error updating social scores:', error.message);
    process.exit(1);
  }
}

// Run the update
updateAllDailyLivingScores();
