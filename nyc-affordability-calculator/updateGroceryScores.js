/**
 * Script to Update Grocery Scores using Google Places API
 * Run this script to fetch grocery affordability scores for all rentals and update the CSV
 *
 * GROCERY AFFORDABILITY SCORING:
 * - Budget stores (Trader Joe's, Aldi, Costco, etc.): +10 per store
 * - Regular stores (Food Bazaar, ShopRite, etc.): +5 per store
 * - Premium stores (Whole Foods, Fairway, etc.): -3 per store
 *
 * This measures access to affordable grocery options, saving $100-200/month vs premium-only areas
 */

const { calculateGroceryScore } = require('./placesAPI');
const { readRentalsFromCSV, writeRentalsToCSV, displayRentals } = require('./dataHandler');

/**
 * Main function to update all grocery scores
 */
async function updateAllGroceryScores() {
  console.log('=== Updating Grocery Affordability Scores for All Rentals ===\n');
  console.log('This measures access to affordable grocery stores within 0.5 miles');
  console.log('Budget stores save $100-200/month vs premium-only neighborhoods\n');

  try {
    // Read rentals from CSV
    const rentals = await readRentalsFromCSV();
    console.log(`Loaded ${rentals.length} rentals\n`);

    // Update grocery score for each rental
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rentals.length; i++) {
      const rental = rentals[i];
      console.log(`[${i + 1}/${rentals.length}] Processing: ${rental.Address}`);
      console.log(`  Coordinates: (${rental.Latitude}, ${rental.Longitude})`);
      console.log(`  Current Grocery Score: ${rental['Grocery Score']}`);

      try {
        // Calculate grocery score using lat/lng
        const result = await calculateGroceryScore(rental.Latitude, rental.Longitude);
        console.log(`  API returned score: ${result.score}`);
        console.log(`    Budget stores: ${result.breakdown.budget}`);
        console.log(`    Regular stores: ${result.breakdown.regular}`);
        console.log(`    Premium stores: ${result.breakdown.premium}`);

        rental['Grocery Score'] = result.score;
        console.log(`  Updated Grocery Score to: ${rental['Grocery Score']}`);

        successCount++;
        console.log(`  ✓ Success`);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        console.error(`  Full error:`, error);
        rental['Grocery Score'] = 0; // Set to 0 on failure
        failCount++;
      }

      console.log(''); // Blank line for readability
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
    rentals.slice(0, 5).forEach((r, i) => {
      console.log(`${i + 1}. ${r.Address}`);
      console.log(`   Grocery Score: ${r['Grocery Score']}`);
    });

    // Verify by re-reading CSV
    console.log('\n=== Verifying CSV Update ===');
    const verifyRentals = await readRentalsFromCSV();
    console.log('Grocery Scores in CSV:');
    verifyRentals.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.Address}: ${r['Grocery Score']}`);
    });

    console.log('\n✓ Grocery scores successfully updated!');
    console.log('You can now run the server to see the updated Affordability Index with grocery scores.');

  } catch (error) {
    console.error('Error updating grocery scores:', error.message);
    process.exit(1);
  }
}

// Run the update
updateAllGroceryScores();
