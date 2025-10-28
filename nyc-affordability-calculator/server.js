/**
 * Express Server for NYC Affordability Calculator
 * Serves the web UI and provides API endpoints for rental data
 * Calculates true cost of living with housing, transportation, daily living, and grocery scores
 */

const express = require('express');
const path = require('path');
const { readRentalsFromCSV } = require('./dataHandler');
const { addScoresToRentals, sortRentals } = require('./scoreCalculator');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Route for individual rental details page
app.get('/rental', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rental.html'));
});

// Parse JSON request bodies
app.use(express.json());

/**
 * API endpoint to get all rentals with calculated scores
 * Query parameters:
 * - sortBy: Field to sort by (default: 'Affordability Index')
 * - affordabilityWeight: Weight for housing affordability (0-1) - Default: 60%
 * - transitWeight: Weight for transportation affordability (0-1) - Default: 20%
 * - socialWeight: Weight for daily living affordability (0-1) - Default: 10%
 * - groceryWeight: Weight for grocery affordability (0-1) - Default: 10%
 */
app.get('/api/rentals', async (req, res) => {
  try {
    // Read rentals from CSV
    const rentals = await readRentalsFromCSV();

    // Get weights from query parameters (default: 60/20/10/10 split)
    const weights = {
      affordability: parseFloat(req.query.affordabilityWeight) || 0.6,
      transit: parseFloat(req.query.transitWeight) || 0.2,
      social: parseFloat(req.query.socialWeight) || 0.1,
      grocery: parseFloat(req.query.groceryWeight) || 0.1
    };

    // Calculate all scores
    const rentalsWithScores = addScoresToRentals(rentals, weights);

    // Sort rentals
    const sortBy = req.query.sortBy || 'Affordability Index';
    const sortedRentals = sortRentals(rentalsWithScores, sortBy, 'desc');

    res.json({
      success: true,
      count: sortedRentals.length,
      rentals: sortedRentals,
      weights: weights
    });

  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API endpoint to get rentals by zip code
 */
app.get('/api/rentals/zip/:zipCode', async (req, res) => {
  try {
    const rentals = await readRentalsFromCSV();
    const filtered = rentals.filter(r => r['Zip Code'].toString() === req.params.zipCode);

    const weights = {
      affordability: parseFloat(req.query.affordabilityWeight) || 0.6,
      transit: parseFloat(req.query.transitWeight) || 0.2,
      social: parseFloat(req.query.socialWeight) || 0.1,
      grocery: parseFloat(req.query.groceryWeight) || 0.1
    };

    const rentalsWithScores = addScoresToRentals(filtered, weights);
    const sortedRentals = sortRentals(rentalsWithScores, 'Affordability Index', 'desc');

    res.json({
      success: true,
      zipCode: req.params.zipCode,
      count: sortedRentals.length,
      rentals: sortedRentals
    });

  } catch (error) {
    console.error('Error fetching rentals by zip:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API endpoint to get a single rental by ZIP code and index
 */
app.get('/api/rental', async (req, res) => {
  try {
    const zipCode = req.query.zip;
    const index = parseInt(req.query.index);

    if (!zipCode || isNaN(index)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid zip or index parameter'
      });
    }

    const rentals = await readRentalsFromCSV();
    const filtered = rentals.filter(r => r['Zip Code'].toString() === zipCode);

    if (index < 0 || index >= filtered.length) {
      return res.status(404).json({
        success: false,
        error: 'Rental not found at specified index'
      });
    }

    const weights = {
      affordability: parseFloat(req.query.affordabilityWeight) || 0.6,
      transit: parseFloat(req.query.transitWeight) || 0.2,
      social: parseFloat(req.query.socialWeight) || 0.1,
      grocery: parseFloat(req.query.groceryWeight) || 0.1
    };

    const rentalsWithScores = addScoresToRentals(filtered, weights);
    const rental = rentalsWithScores[index];

    res.json({
      success: true,
      rental: rental,
      weights: weights
    });

  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n=== NYC Affordability Calculator ===`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Calculate true cost of living across NYC neighborhoods`);
  console.log(`Weights: Housing (60%) + Transportation (20%) + Daily Living (10%) + Grocery (10%)\n`);
});
