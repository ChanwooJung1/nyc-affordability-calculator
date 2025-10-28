/**
 * Google Distance Matrix API Integration for Transit Score Calculation
 * This module calculates transit time from rental locations to key destinations
 */

const fetch = require('node-fetch');
require('dotenv').config();

const GOOGLE_DISTANCE_MATRIX_API_KEY = process.env.GOOGLE_DISTANCE_MATRIX_API_KEY;

// Key destinations in Brooklyn/Manhattan for young professionals
const KEY_DESTINATIONS = [
  { name: 'Manhattan Financial District', lat: 40.7074, lng: -74.0113 },
  { name: 'Downtown Brooklyn', lat: 40.6925, lng: -73.9874 },
  { name: 'Williamsburg (tech hub)', lat: 40.7081, lng: -73.9571 }
];

/**
 * Get transit time from origin to a destination using Distance Matrix API
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @returns {Promise<Object>} Transit time in minutes and status
 */
async function getTransitTime(originLat, originLng, destLat, destLng) {
  // Validate API key
  if (!GOOGLE_DISTANCE_MATRIX_API_KEY || GOOGLE_DISTANCE_MATRIX_API_KEY === 'your_api_key_here') {
    throw new Error('Google Distance Matrix API key not configured. Please set GOOGLE_DISTANCE_MATRIX_API_KEY in .env file');
  }

  const origins = `${originLat},${originLng}`;
  const destinations = `${destLat},${destLng}`;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=transit&key=${GOOGLE_DISTANCE_MATRIX_API_KEY}`;

  try {
    const response = await fetch(url);

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 403) {
        throw new Error('API key is invalid or Distance Matrix API is not enabled. Check your Google Cloud Console.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      } else {
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    // Extract transit duration
    const element = data.rows[0].elements[0];

    if (element.status !== 'OK') {
      console.warn(`No transit route found: ${element.status}`);
      return { duration: null, status: element.status };
    }

    const durationMinutes = Math.round(element.duration.value / 60); // Convert seconds to minutes
    return { duration: durationMinutes, status: 'OK' };

  } catch (error) {
    console.error('Error fetching transit time:', error.message);
    throw error;
  }
}

/**
 * Calculate average transit time to key destinations
 * @param {number} lat - Latitude of rental location
 * @param {number} lng - Longitude of rental location
 * @returns {Promise<number>} Average transit time in minutes
 */
async function getAverageTransitTime(lat, lng) {
  try {
    console.log(`Calculating transit times from (${lat}, ${lng})...`);

    const transitTimes = [];

    // Get transit time to each destination
    for (const dest of KEY_DESTINATIONS) {
      const result = await getTransitTime(lat, lng, dest.lat, dest.lng);

      if (result.status === 'OK' && result.duration !== null) {
        console.log(`  → ${dest.name}: ${result.duration} min`);
        transitTimes.push(result.duration);
      } else {
        console.warn(`  → ${dest.name}: No route available`);
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Calculate average
    if (transitTimes.length === 0) {
      console.warn('No valid transit routes found');
      return 0;
    }

    const avgTime = Math.round(transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length);
    console.log(`Average transit time: ${avgTime} min`);

    return avgTime;

  } catch (error) {
    console.error(`Failed to calculate transit time for (${lat}, ${lng}):`, error.message);
    return 0;
  }
}

/**
 * Convert average transit time to a 0-100 transit score
 * Lower time = higher score (better transit access)
 * @param {number} avgTimeMinutes - Average transit time in minutes
 * @returns {number} Transit score (0-100)
 */
function calculateTransitScore(avgTimeMinutes) {
  if (avgTimeMinutes === 0) return 0; // No valid routes

  // Score formula:
  // 15 min or less = 100 (excellent)
  // 30 min = 75 (good)
  // 45 min = 50 (moderate)
  // 60 min = 25 (poor)
  // 90+ min = 0 (very poor)

  let score;
  if (avgTimeMinutes <= 15) {
    score = 100;
  } else if (avgTimeMinutes >= 90) {
    score = 0;
  } else {
    // Linear scale from 15 to 90 minutes
    score = Math.round(100 - ((avgTimeMinutes - 15) / 75) * 100);
  }

  return Math.max(0, Math.min(100, score)); // Clamp to 0-100
}

/**
 * Get transit score for a location (combines time calculation and scoring)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Transit score and average time
 */
async function getTransitScoreForLocation(lat, lng) {
  try {
    const avgTime = await getAverageTransitTime(lat, lng);
    const score = calculateTransitScore(avgTime);

    return {
      avgTransitTime: avgTime,
      transitScore: score
    };
  } catch (error) {
    console.error('Error calculating transit score:', error.message);
    return {
      avgTransitTime: 0,
      transitScore: 0
    };
  }
}

/**
 * Test function to verify API connection
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function testAPI(lat = 40.6945, lng = -73.9917) {
  console.log('\n=== Testing Google Distance Matrix API ===');
  console.log(`Location: (${lat}, ${lng}) - Brooklyn Heights (11201)`);

  try {
    const result = await getTransitScoreForLocation(lat, lng);
    console.log(`\nAverage transit time: ${result.avgTransitTime} minutes`);
    console.log(`Transit score: ${result.transitScore}/100`);
    console.log('✓ API test successful!\n');
    return true;
  } catch (error) {
    console.error('✗ API test failed:', error.message);
    return false;
  }
}

module.exports = {
  getTransitTime,
  getAverageTransitTime,
  calculateTransitScore,
  getTransitScoreForLocation,
  testAPI
};
