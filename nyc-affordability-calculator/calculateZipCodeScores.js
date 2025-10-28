/**
 * Calculate Aggregate Zip Code Scores for NYC Heatmap
 *
 * This script processes rental listings and calculates aggregate affordability scores
 * for each zip code, which are then used to populate the heatmap visualization.
 *
 * For each zip code, calculates:
 * - Median rent (from manually collected listings)
 * - Average transit score
 * - Average daily living score
 * - Average grocery score
 * - Overall Affordability Index (60/20/10/10 weights)
 *
 * Outputs: zipcode_scores.csv for the heatmap
 */

const fs = require('fs');
const Papa = require('papaparse');
const { readRentalsFromCSV } = require('./dataHandler');
const { addScoresToRentals } = require('./scoreCalculator');

/**
 * Calculate median value from an array of numbers
 */
function calculateMedian(numbers) {
  if (numbers.length === 0) return 0;

  const sorted = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calculate average value from an array of numbers
 */
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
}

/**
 * Group rentals by zip code and calculate aggregate scores
 */
async function calculateZipCodeAggregates() {
  console.log('\n=== Calculating Zip Code Aggregate Scores ===\n');
  console.log('This creates aggregate affordability data for the heatmap visualization\n');

  try {
    // Read and score all rentals
    console.log('Loading rentals from CSV...');
    const rentals = await readRentalsFromCSV();
    console.log(`Loaded ${rentals.length} rentals\n`);

    // Calculate global median rent for scoring
    const allRentPrices = rentals.map(r => r['Rental Price']).filter(p => p > 0);
    const globalMedianRent = calculateMedian(allRentPrices);
    console.log(`Global median rent: $${globalMedianRent}\n`);

    // Add scores to all rentals (using global median for now)
    console.log('Calculating scores for all rentals...');
    const scoredRentals = addScoresToRentals(rentals,
      { affordability: 0.6, transit: 0.2, social: 0.1, grocery: 0.1 },
      globalMedianRent
    );
    console.log('✓ Scores calculated\n');

    // Group by zip code
    console.log('Grouping rentals by zip code...');
    const zipCodeGroups = {};

    scoredRentals.forEach(rental => {
      const zip = rental['Zip Code'].toString();
      if (!zipCodeGroups[zip]) {
        zipCodeGroups[zip] = [];
      }
      zipCodeGroups[zip].push(rental);
    });

    const zipCodes = Object.keys(zipCodeGroups);
    console.log(`Found ${zipCodes.length} unique zip codes\n`);

    // Calculate aggregates for each zip code
    console.log('Calculating aggregate scores per zip code...\n');
    const zipCodeScores = [];

    zipCodes.forEach(zip => {
      const rentalsInZip = zipCodeGroups[zip];

      // Extract all values
      const rentPrices = rentalsInZip.map(r => r['Rental Price']);
      const transitScores = rentalsInZip.map(r => r['Transit Score'] || 0);
      const dailyLivingScores = rentalsInZip.map(r => r['Social Score (Normalized)'] || 0);
      const groceryScores = rentalsInZip.map(r => r['Grocery Score (Normalized)'] || 0);
      const affordabilityIndexes = rentalsInZip.map(r => r['Affordability Index'] || 0);

      // Calculate aggregates
      const medianRent = calculateMedian(rentPrices);
      const avgTransitScore = Math.round(calculateAverage(transitScores));
      const avgDailyLivingScore = Math.round(calculateAverage(dailyLivingScores));
      const avgGroceryScore = Math.round(calculateAverage(groceryScores));
      const overallAffordabilityIndex = Math.round(calculateAverage(affordabilityIndexes));

      // Get coordinates (use first rental in zip as representative)
      const firstRental = rentalsInZip[0];
      const lat = firstRental.Latitude;
      const lng = firstRental.Longitude;

      zipCodeScores.push({
        'Zip Code': zip,
        'Latitude': lat,
        'Longitude': lng,
        'Listing Count': rentalsInZip.length,
        'Median Rent': Math.round(medianRent),
        'Avg Transit Score': avgTransitScore,
        'Avg Daily Living Score': avgDailyLivingScore,
        'Avg Grocery Score': avgGroceryScore,
        'Affordability Index': overallAffordabilityIndex
      });

      console.log(`${zip}:`);
      console.log(`  Listings: ${rentalsInZip.length}`);
      console.log(`  Median Rent: $${Math.round(medianRent)}`);
      console.log(`  Avg Transit: ${avgTransitScore}`);
      console.log(`  Avg Daily Living: ${avgDailyLivingScore}`);
      console.log(`  Avg Grocery: ${avgGroceryScore}`);
      console.log(`  Affordability Index: ${overallAffordabilityIndex}`);
      console.log('');
    });

    // Sort by Affordability Index (descending)
    zipCodeScores.sort((a, b) => b['Affordability Index'] - a['Affordability Index']);

    // Write to CSV
    console.log('\n=== Writing Zip Code Scores to CSV ===');
    const csvData = Papa.unparse(zipCodeScores, { header: true });
    const outputPath = './zipcode_scores.csv';

    fs.writeFileSync(outputPath, csvData, 'utf8');
    console.log(`✓ Successfully wrote ${zipCodeScores.length} zip codes to ${outputPath}`);

    // Display summary statistics
    console.log('\n=== Summary Statistics ===');
    const allAffordabilityIndexes = zipCodeScores.map(z => z['Affordability Index']);
    const avgAffordabilityIndex = calculateAverage(allAffordabilityIndexes);
    const maxAffordabilityIndex = Math.max(...allAffordabilityIndexes);
    const minAffordabilityIndex = Math.min(...allAffordabilityIndexes);

    console.log(`Average Affordability Index: ${Math.round(avgAffordabilityIndex)}`);
    console.log(`Best (Highest): ${maxAffordabilityIndex}`);
    console.log(`Worst (Lowest): ${minAffordabilityIndex}`);

    // Display top 5 most affordable zip codes
    console.log('\n=== Top 5 Most Affordable Zip Codes ===');
    zipCodeScores.slice(0, 5).forEach((zip, index) => {
      console.log(`${index + 1}. Zip ${zip['Zip Code']}: Affordability Index = ${zip['Affordability Index']}`);
      console.log(`   Median Rent: $${zip['Median Rent']}, Transit: ${zip['Avg Transit Score']}, Daily Living: ${zip['Avg Daily Living Score']}, Grocery: ${zip['Avg Grocery Score']}`);
    });

    console.log('\n✓ Zip code aggregate scores ready for heatmap!');
    console.log('Use zipcode_scores.csv to populate the NYC heatmap visualization.\n');

  } catch (error) {
    console.error('Error calculating zip code scores:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the calculation
calculateZipCodeAggregates();
