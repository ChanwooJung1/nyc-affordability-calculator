/**
 * Score Calculation Functions
 * Calculates affordability, normalizes social scores, and computes Affordability Index
 */

/**
 * Calculate affordability score based on rental price vs. median
 * Lower price = higher score (more affordable)
 * @param {number} rentalPrice - Monthly rental price from manual Zillow collection
 * @param {number} medianPrice - Median price for the area (default: $3000 for Brooklyn)
 * @returns {number} Affordability score (0-100)
 */
function calculateAffordabilityScore(rentalPrice, medianPrice = 3000) {
  // Formula: The further below median, the better the score
  // If price equals median, score = 50
  // If price is 50% of median, score = 100
  // If price is 150% of median, score = 0

  const ratio = rentalPrice / medianPrice;

  let score;
  if (ratio <= 0.5) {
    score = 100; // Very affordable
  } else if (ratio >= 1.5) {
    score = 0; // Very expensive
  } else {
    // Linear scale between 50% and 150% of median
    score = Math.round(100 - ((ratio - 0.5) * 100));
  }

  return Math.max(0, Math.min(100, score)); // Clamp to 0-100
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
 * Add all calculated scores to rental objects
 * @param {Array} rentals - Array of rental objects
 * @param {Object} weights - Weights for Affordability Index calculation (60/20/10/10)
 * @param {number} medianPrice - Median rental price for the area
 * @returns {Array} Rentals with all scores calculated
 */
function addScoresToRentals(rentals, weights = { affordability: 0.6, transit: 0.2, social: 0.1, grocery: 0.1 }, medianPrice = 3000) {
  // First, normalize social and grocery scores to 0-100 scale
  const rawSocialScores = rentals.map(r => r['Social Score'] || 0);
  const maxSocialScore = Math.max(...rawSocialScores, 1);

  const rawGroceryScores = rentals.map(r => r['Grocery Score'] || 0);
  const maxGroceryScore = Math.max(...rawGroceryScores, 1);

  return rentals.map(rental => {
    // Use manually collected rental price
    const rentalPrice = rental['Rental Price'];

    // Calculate housing affordability score (60%)
    const affordabilityScore = calculateAffordabilityScore(rentalPrice, medianPrice);

    // Normalize social score to 0-100 (daily living affordability - 10%)
    const normalizedSocialScore = Math.round((rental['Social Score'] / maxSocialScore) * 100);

    // Normalize grocery score to 0-100 (grocery affordability - 10%)
    const normalizedGroceryScore = Math.round((rental['Grocery Score'] / maxGroceryScore) * 100);

    // Get transit score - already 0-100 (transportation affordability - 20%)
    const transitScore = rental['Transit Score'] || 0;

    // Calculate overall Affordability Index (60/20/10/10)
    const affordabilityIndex = calculateAffordabilityIndex(
      affordabilityScore,
      transitScore,
      normalizedSocialScore,
      normalizedGroceryScore,
      weights
    );

    // Add all scores to rental object
    return {
      ...rental,
      'Affordability Score': affordabilityScore,
      'Social Score (Normalized)': normalizedSocialScore,
      'Grocery Score (Normalized)': normalizedGroceryScore,
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
  calculateAffordabilityScore,
  calculateAffordabilityIndex,
  addScoresToRentals,
  sortRentals
};
