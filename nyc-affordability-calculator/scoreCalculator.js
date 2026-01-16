/**
 * Score Calculation Functions
 * Uses min-max normalization for all scores to ensure consistent 0-100 scaling
 */

/**
 * Min-max normalize a value to 0-100 scale
 * @param {number} value - The value to normalize
 * @param {number} min - Minimum value in dataset
 * @param {number} max - Maximum value in dataset
 * @param {boolean} invert - If true, lower values get higher scores (for rent)
 * @returns {number} Normalized score (0-100)
 */
function minMaxNormalize(value, min, max, invert = false) {
  if (max === min) return 50; // If all values are the same, return middle score

  let normalized = ((value - min) / (max - min)) * 100;

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
 * Add all calculated scores to rental objects using min-max normalization
 * @param {Array} rentals - Array of rental objects
 * @param {Object} weights - Weights for Affordability Index calculation (60/20/10/10)
 * @param {number} medianPrice - DEPRECATED: No longer used (kept for backward compatibility)
 * @returns {Array} Rentals with all normalized scores calculated
 */
function addScoresToRentals(rentals, weights = { affordability: 0.6, transit: 0.2, social: 0.1, grocery: 0.1 }, medianPrice = null) {
  // FIRST PASS: Find min/max for each metric across all rentals
  const prices = rentals.map(r => r['Rental Price']).filter(p => p > 0);
  const transitScores = rentals.map(r => parseInt(r['Transit Score']) || 0);
  const socialScores = rentals.map(r => parseInt(r['Social Score']) || 0);
  const groceryScores = rentals.map(r => parseInt(r['Grocery Score']) || 0);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minTransit = Math.min(...transitScores);
  const maxTransit = Math.max(...transitScores);
  const minSocial = Math.min(...socialScores);
  const maxSocial = Math.max(...socialScores);
  const minGrocery = Math.min(...groceryScores);
  const maxGrocery = Math.max(...groceryScores);

  console.log('Min-Max Normalization Ranges:');
  console.log(`  Rent: $${minPrice} - $${maxPrice}`);
  console.log(`  Transit: ${minTransit} - ${maxTransit}`);
  console.log(`  Social: ${minSocial} - ${maxSocial}`);
  console.log(`  Grocery: ${minGrocery} - ${maxGrocery}`);

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
  minMaxNormalize,
  calculateAffordabilityIndex,
  addScoresToRentals,
  sortRentals
};
