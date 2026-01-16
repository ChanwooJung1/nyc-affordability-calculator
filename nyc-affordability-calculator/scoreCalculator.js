/**
 * Score Calculation Functions
 * Uses percentile-capped min-max normalization to handle outliers
 */

/**
 * Calculate percentile value from sorted array
 * @param {Array<number>} sortedArray - Sorted array of numbers
 * @param {number} percentile - Percentile (0-1)
 * @returns {number} Value at percentile
 */
function getPercentile(sortedArray, percentile) {
  const index = Math.floor(sortedArray.length * percentile);
  return sortedArray[index];
}

/**
 * Min-max normalize with percentile capping to handle outliers
 * @param {number} value - The value to normalize
 * @param {number} min - Minimum value (usually 5th percentile)
 * @param {number} max - Maximum value (usually 95th percentile)
 * @param {boolean} invert - If true, lower values get higher scores (for rent)
 * @returns {number} Normalized score (0-100)
 */
function minMaxNormalize(value, min, max, invert = false) {
  if (max === min) return 50; // If all values are the same, return middle score

  // Cap the value to [min, max] range to handle outliers
  const cappedValue = Math.max(min, Math.min(max, value));

  let normalized = ((cappedValue - min) / (max - min)) * 100;

  // Invert for metrics where lower is better (like rent)
  if (invert) {
    normalized = 100 - normalized;
  }

  return Math.round(Math.max(0, Math.min(100, normalized)));
}

/**
 * Calculate Affordability Index (weighted average of FOUR factors)
 * 60% Housing + 20% Transportation + 10% Daily Living + 10% Grocery
 * @param {number} affordabilityScore - Housing affordability score (0-100)
 * @param {number} transitScore - Transportation affordability score (0-100)
 * @param {number} socialScore - Daily living affordability score (0-100, normalized)
 * @param {number} groceryScore - Grocery affordability score (0-100, normalized)
 * @param {Object} weights - Weight for each factor (must sum to 1)
 * @returns {number} Affordability Index (0-100)
 */
function calculateAffordabilityIndex(
  affordabilityScore,
  transitScore,
  socialScore,
  groceryScore,
  weights = { affordability: 0.6, transit: 0.2, social: 0.1, grocery: 0.1 }
) {
  // Validate weights sum to 1 (or close to it)
  const weightSum = weights.affordability + weights.transit + weights.social + weights.grocery;
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.warn('Weights do not sum to 1.0, normalizing...');
    weights.affordability /= weightSum;
    weights.transit /= weightSum;
    weights.social /= weightSum;
    weights.grocery /= weightSum;
  }

  const affordabilityIndex = Math.round(
    affordabilityScore * weights.affordability +
    transitScore * weights.transit +
    socialScore * weights.social +
    groceryScore * weights.grocery
  );

  return affordabilityIndex;
}

/**
 * Add all calculated scores to rental objects using percentile-capped min-max normalization
 * @param {Array} rentals - Array of rental objects
 * @param {Object} weights - Weights for Affordability Index calculation (60/20/10/10)
 * @param {number} medianPrice - DEPRECATED: No longer used (kept for backward compatibility)
 * @returns {Array} Rentals with all normalized scores calculated
 */
function addScoresToRentals(rentals, weights = { affordability: 0.6, transit: 0.2, social: 0.1, grocery: 0.1 }, medianPrice = null) {
  // FIRST PASS: Extract and sort all values for percentile calculation
  const prices = rentals.map(r => r['Rental Price']).filter(p => p > 0).sort((a, b) => a - b);
  const transitScores = rentals.map(r => parseInt(r['Transit Score']) || 0).sort((a, b) => a - b);
  const socialScores = rentals.map(r => parseInt(r['Social Score']) || 0).sort((a, b) => a - b);
  const groceryScores = rentals.map(r => parseInt(r['Grocery Score']) || 0).sort((a, b) => a - b);

  // Use 5th and 95th percentiles as bounds to exclude extreme outliers
  const minPrice = getPercentile(prices, 0.05);
  const maxPrice = getPercentile(prices, 0.95);
  const minTransit = getPercentile(transitScores, 0.05);
  const maxTransit = getPercentile(transitScores, 0.95);
  const minSocial = getPercentile(socialScores, 0.05);
  const maxSocial = getPercentile(socialScores, 0.95);
  const minGrocery = getPercentile(groceryScores, 0.05);
  const maxGrocery = getPercentile(groceryScores, 0.95);

  console.log('Percentile-Capped Normalization Ranges (5th-95th):');
  console.log(`  Rent: $${minPrice} - $${maxPrice} (excludes ${prices.filter(p => p < minPrice || p > maxPrice).length} outliers)`);
  console.log(`  Transit: ${minTransit} - ${maxTransit} (excludes ${transitScores.filter(t => t < minTransit || t > maxTransit).length} outliers)`);
  console.log(`  Social: ${minSocial} - ${maxSocial} (excludes ${socialScores.filter(s => s < minSocial || s > maxSocial).length} outliers)`);
  console.log(`  Grocery: ${minGrocery} - ${maxGrocery} (excludes ${groceryScores.filter(g => g < minGrocery || g > maxGrocery).length} outliers)`);

  // SECOND PASS: Normalize all scores using min-max
  return rentals.map(rental => {
    const rentalPrice = rental['Rental Price'];
    const transitScore = parseInt(rental['Transit Score']) || 0;
    const socialScore = parseInt(rental['Social Score']) || 0;
    const groceryScore = parseInt(rental['Grocery Score']) || 0;

    // Normalize all scores to 0-100 using min-max
    // Housing: lower rent = higher score (invert = true)
    const housingScoreNormalized = minMaxNormalize(rentalPrice, minPrice, maxPrice, true);

    // Transit, Social, Grocery: higher = better (invert = false)
    const transitScoreNormalized = minMaxNormalize(transitScore, minTransit, maxTransit, false);
    const socialScoreNormalized = minMaxNormalize(socialScore, minSocial, maxSocial, false);
    const groceryScoreNormalized = minMaxNormalize(groceryScore, minGrocery, maxGrocery, false);

    // Calculate overall Affordability Index (60/20/10/10)
    const affordabilityIndex = calculateAffordabilityIndex(
      housingScoreNormalized,
      transitScoreNormalized,
      socialScoreNormalized,
      groceryScoreNormalized,
      weights
    );

    // Add all normalized scores to rental object
    return {
      ...rental,
      'Affordability Score': housingScoreNormalized,
      'Transit Score (Normalized)': transitScoreNormalized,
      'Social Score (Normalized)': socialScoreNormalized,
      'Grocery Score (Normalized)': groceryScoreNormalized,
      'Affordability Index': affordabilityIndex
    };
  });
}

/**
 * Sort rentals by a specified score
 * @param {Array} rentals - Array of rental objects
 * @param {string} sortBy - Field to sort by (default: 'Affordability Index')
 * @param {string} order - 'desc' (high to low) or 'asc' (low to high)
 * @returns {Array} Sorted rentals
 */
function sortRentals(rentals, sortBy = 'Affordability Index', order = 'desc') {
  const sorted = [...rentals].sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;

    if (order === 'desc') {
      return bValue - aValue; // High to low
    } else {
      return aValue - bValue; // Low to high
    }
  });

  return sorted;
}

module.exports = {
  getPercentile,
  minMaxNormalize,
  calculateAffordabilityIndex,
  addScoresToRentals,
  sortRentals
};
