/**
 * Google Places API (New) Integration for Social Score Calculation
 * This module fetches coffee shops and restaurants within 0.5 miles (800m) of a location
 */

const fetch = require('node-fetch');
require('dotenv').config();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const RADIUS_METERS = 800; // 0.5 miles = approximately 800 meters

/**
 * Fetch nearby coffee shops and restaurants using Google Places API (New)
 * This version makes MULTIPLE requests at different radii to get better differentiation
 * @param {number} lat - Latitude of the location
 * @param {number} lng - Longitude of the location
 * @param {number} radius - Search radius in meters (default 800m = 0.5 miles)
 * @returns {Promise<Array>} Array of unique places with name, address, types, and place_id
 */
async function getNearbyPlaces(lat, lng, radius = RADIUS_METERS) {
  // Validate API key
  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_api_key_here') {
    throw new Error('Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY in .env file');
  }

  // Google Places API New endpoint
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  // Request body for Nearby Search (New)
  const requestBody = {
    includedTypes: ['restaurant', 'cafe'], // Search for restaurants and cafes
    maxResultCount: 20, // Maximum results per request (API hard limit is 20)
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: radius
      }
    }
  };

  try {
    console.log(`Searching for places near (${lat}, ${lng}) within ${RADIUS_METERS}m...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.id'
      },
      body: JSON.stringify(requestBody)
    });

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();

      // Specific error handling
      if (response.status === 403) {
        throw new Error('API key is invalid or Places API is not enabled. Check your Google Cloud Console.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      } else {
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();

    // Check if any places were found
    if (!data.places || data.places.length === 0) {
      console.warn(`No places found near (${lat}, ${lng})`);
      return [];
    }

    // Extract and format place data
    const places = data.places.map(place => ({
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || 'No address',
      types: place.types || [],
      place_id: place.id
    }));

    console.log(`Found ${places.length} places`);
    return places;

  } catch (error) {
    console.error('Error fetching places:', error.message);
    throw error;
  }
}

/**
 * Calculate social score using multi-tier search strategy
 * This searches at 3 different radii and creates a weighted score to differentiate dense areas
 * Formula: (within_200m × 3) + (within_400m × 2) + (within_800m × 1)
 *
 * @param {number} lat - Latitude of the location
 * @param {number} lng - Longitude of the location
 * @returns {Promise<number>} Weighted social score
 */
async function calculateSocialScore(lat, lng) {
  try {
    console.log(`\n=== Calculating Social Score for (${lat}, ${lng}) ===`);

    // Search at 3 different radii to create differentiation
    const radii = [
      { distance: 200, weight: 3, label: 'immediate walkability' },  // ~2 blocks
      { distance: 400, weight: 2, label: '5-min walk' },            // ~5 blocks
      { distance: 800, weight: 1, label: '10-min walk' }            // ~10 blocks
    ];

    const allPlaces = new Map(); // Use Map to deduplicate by place_id
    let weightedScore = 0;

    for (const tier of radii) {
      const places = await getNearbyPlaces(lat, lng, tier.distance);

      // Count only NEW places not found in smaller radii
      let newPlacesCount = 0;
      places.forEach(place => {
        if (!allPlaces.has(place.place_id)) {
          allPlaces.set(place.place_id, place);
          newPlacesCount++;
        }
      });

      const tierScore = newPlacesCount * tier.weight;
      weightedScore += tierScore;

      console.log(`  ${tier.label} (${tier.distance}m): ${newPlacesCount} new venues × ${tier.weight} = ${tierScore} points`);

      // Small delay between API calls to avoid rate limiting
      if (tier !== radii[radii.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`  Total unique venues: ${allPlaces.size}`);
    console.log(`  Weighted social score: ${weightedScore}`);

    return weightedScore;

  } catch (error) {
    console.error(`Failed to calculate social score for (${lat}, ${lng}):`, error.message);
    // Return 0 if API fails, allowing app to continue
    return 0;
  }
}

/**
 * Normalize social scores to 0-100 scale
 * @param {Array<number>} scores - Array of raw social scores
 * @returns {Array<number>} Normalized scores (0-100)
 */
function normalizeSocialScores(scores) {
  const maxScore = Math.max(...scores, 1); // Avoid division by zero

  return scores.map(score => {
    const normalized = Math.round((score / maxScore) * 100);
    return normalized;
  });
}

/**
 * Test function to verify API connection
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function testAPI(lat = 40.6960, lng = -73.9917) {
  console.log('\n=== Testing Google Places API ===');
  console.log(`Location: (${lat}, ${lng}) - Brooklyn Heights (11201)`);

  try {
    const places = await getNearbyPlaces(lat, lng);
    console.log('\nSample results (first 5):');
    places.slice(0, 5).forEach((place, i) => {
      console.log(`${i + 1}. ${place.name}`);
      console.log(`   Address: ${place.address}`);
      console.log(`   Types: ${place.types.join(', ')}`);
    });

    const score = await calculateSocialScore(lat, lng);
    console.log(`\nTotal unique venues: ${score}`);
    console.log('✓ API test successful!\n');

    return true;
  } catch (error) {
    console.error('✗ API test failed:', error.message);
    return false;
  }
}

/**
 * Grocery store categorization by affordability
 */
const GROCERY_STORES = {
  budget: {
    weight: 10,
    stores: ['trader joe', 'aldi', 'costco', 'target', 'stop & shop', 'stop and shop', 'key food', 'c-town', 'ctown']
  },
  regular: {
    weight: 5,
    stores: ['food bazaar', 'associated', 'met fresh', 'shoprite', 'shop rite']
  },
  premium: {
    weight: -3,
    stores: ['whole foods', 'dean & deluca', 'dean and deluca', 'gourmet garage', 'fairway market', 'fairway']
  }
};

/**
 * Fetch nearby grocery stores using Google Places API
 * @param {number} lat - Latitude of the location
 * @param {number} lng - Longitude of the location
 * @returns {Promise<Array>} Array of grocery stores
 */
async function getNearbyGroceryStores(lat, lng) {
  // Validate API key
  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_api_key_here') {
    throw new Error('Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY in .env file');
  }

  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  const requestBody = {
    includedTypes: ['grocery_store', 'supermarket'], // Search for grocery stores
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: RADIUS_METERS
      }
    }
  };

  try {
    console.log(`Searching for grocery stores near (${lat}, ${lng}) within ${RADIUS_METERS}m...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.id'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 403) {
        throw new Error('API key is invalid or Places API is not enabled. Check your Google Cloud Console.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      } else {
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      console.warn(`No grocery stores found near (${lat}, ${lng})`);
      return [];
    }

    const stores = data.places.map(place => ({
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || 'No address',
      types: place.types || [],
      place_id: place.id
    }));

    console.log(`Found ${stores.length} grocery stores`);
    return stores;

  } catch (error) {
    console.error('Error fetching grocery stores:', error.message);
    throw error;
  }
}

/**
 * Categorize a grocery store by affordability level
 * @param {string} storeName - Name of the grocery store
 * @returns {string} Category: 'budget', 'regular', or 'premium'
 */
function categorizeGroceryStore(storeName) {
  const nameLower = storeName.toLowerCase();

  // Check budget stores
  if (GROCERY_STORES.budget.stores.some(store => nameLower.includes(store))) {
    return 'budget';
  }

  // Check premium stores
  if (GROCERY_STORES.premium.stores.some(store => nameLower.includes(store))) {
    return 'premium';
  }

  // Check regular stores
  if (GROCERY_STORES.regular.stores.some(store => nameLower.includes(store))) {
    return 'regular';
  }

  // Default to regular if unknown
  return 'regular';
}

/**
 * Calculate grocery affordability score
 * Formula: (budget_count × 10) + (regular_count × 5) - (premium_count × 3)
 * @param {number} lat - Latitude of the location
 * @param {number} lng - Longitude of the location
 * @returns {Promise<Object>} Grocery score and store breakdown
 */
async function calculateGroceryScore(lat, lng) {
  try {
    const stores = await getNearbyGroceryStores(lat, lng);

    const categoryCounts = {
      budget: 0,
      regular: 0,
      premium: 0
    };

    const categorizedStores = stores.map(store => {
      const category = categorizeGroceryStore(store.name);
      categoryCounts[category]++;
      return {
        ...store,
        category
      };
    });

    // Calculate weighted score
    const score =
      (categoryCounts.budget * GROCERY_STORES.budget.weight) +
      (categoryCounts.regular * GROCERY_STORES.regular.weight) +
      (categoryCounts.premium * GROCERY_STORES.premium.weight);

    console.log(`Grocery score breakdown:`);
    console.log(`  Budget stores (${categoryCounts.budget}): +${categoryCounts.budget * GROCERY_STORES.budget.weight}`);
    console.log(`  Regular stores (${categoryCounts.regular}): +${categoryCounts.regular * GROCERY_STORES.regular.weight}`);
    console.log(`  Premium stores (${categoryCounts.premium}): ${categoryCounts.premium * GROCERY_STORES.premium.weight}`);
    console.log(`  Total score: ${score}`);

    return {
      score: Math.max(0, score), // Ensure non-negative
      breakdown: categoryCounts,
      stores: categorizedStores
    };

  } catch (error) {
    console.error(`Failed to calculate grocery score for (${lat}, ${lng}):`, error.message);
    return {
      score: 0,
      breakdown: { budget: 0, regular: 0, premium: 0 },
      stores: []
    };
  }
}

module.exports = {
  getNearbyPlaces,
  calculateSocialScore,
  normalizeSocialScores,
  getNearbyGroceryStores,
  calculateGroceryScore,
  categorizeGroceryStore,
  testAPI
};
