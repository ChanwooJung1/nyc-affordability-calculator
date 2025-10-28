/**
 * CSV Data Handler for Rental Data
 * Handles reading, updating, and writing rental data with social scores
 */

const fs = require('fs');
const Papa = require('papaparse');

const CSV_FILE_PATH = './rentals.csv';

/**
 * Read rental data from CSV file
 * Loads from all ZIP-specific files and combines them
 * @returns {Promise<Array>} Array of rental objects
 */
function readRentalsFromCSV() {
  return new Promise((resolve, reject) => {
    const zipCodes = ['10001', '11201', '11203'];
    let allRentals = [];

    // Try to load from ZIP-specific files first
    for (const zip of zipCodes) {
      const zipFilePath = `./${zip} Rental Listings.csv`;
      if (fs.existsSync(zipFilePath)) {
        try {
          const csvContent = fs.readFileSync(zipFilePath, 'utf8');
          const result = Papa.parse(csvContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
          });

          // Normalize field names and ensure Zip Code exists
          const normalized = result.data.map(rental => ({
            'Address': rental.address || rental.Address,
            'Zip Code': rental.zip || rental['Zip Code'] || zip,
            'Rental Price': rental.price || rental['Rental Price'],
            'Transit Score': rental['Transit Score'] || 0,
            'Social Score': rental['Social Score'] || 0,
            'Grocery Score': rental['Grocery Score'] || 0,
            'Bedrooms': rental.bedrooms || rental.Bedrooms,
            'Bathrooms': rental.bathrooms || rental.Bathrooms,
            'Square Feet': rental.sqft || rental['Square Feet'],
            'Latitude': rental.lat || rental.Latitude,
            'Longitude': rental.lng || rental.Longitude
          }));

          allRentals = allRentals.concat(normalized);
          console.log(`Loaded ${normalized.length} rentals from ${zipFilePath}`);
        } catch (err) {
          console.warn(`Could not load ${zipFilePath}: ${err.message}`);
        }
      }
    }

    if (allRentals.length === 0) {
      // Fallback to rentals.csv if no ZIP files found
      try {
        const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
        Papa.parse(csvContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log(`Loaded ${results.data.length} rentals from ${CSV_FILE_PATH}`);
            resolve(results.data);
          },
          error: (error) => {
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          }
        });
      } catch (err) {
        reject(new Error(`No rental data found: ${err.message}`));
      }
    } else {
      console.log(`Total rentals loaded: ${allRentals.length}`);
      resolve(allRentals);
    }
  });
}

/**
 * Write rental data back to CSV file
 * Writes to individual ZIP code files
 * @param {Array} rentals - Array of rental objects
 * @returns {Promise<void>}
 */
function writeRentalsToCSV(rentals) {
  return new Promise((resolve, reject) => {
    try {
      // Group rentals by ZIP code
      const rentalsByZip = {};
      rentals.forEach(rental => {
        const zip = rental['Zip Code'];
        if (!rentalsByZip[zip]) {
          rentalsByZip[zip] = [];
        }

        // Convert back to lowercase column names for consistency with original CSV
        rentalsByZip[zip].push({
          'address': rental['Address'] || rental.address,
          'zip': rental['Zip Code'] || rental.zip,
          'price': rental['Rental Price'] || rental.price,
          'lat': rental['Latitude'] || rental.lat,
          'lng': rental['Longitude'] || rental.lng,
          'url': rental.URL || rental.url || '',
          'bedrooms': rental['Bedrooms'] || rental.bedrooms,
          'bathrooms': rental['Bathrooms'] || rental.bathrooms,
          'sqft': rental['Square Feet'] || rental.sqft || '',
          'Transit Score': rental['Transit Score'] || 0,
          'Social Score': rental['Social Score'] || 0,
          'Grocery Score': rental['Grocery Score'] || 0
        });
      });

      // Write each ZIP code to its own file
      let filesWritten = 0;
      const zipCodes = Object.keys(rentalsByZip);

      zipCodes.forEach(zip => {
        const filePath = `./${zip} Rental Listings.csv`;
        const csv = Papa.unparse(rentalsByZip[zip], {
          header: true
        });

        fs.writeFileSync(filePath, csv, 'utf8');
        filesWritten++;
        console.log(`Updated ${rentalsByZip[zip].length} rentals in ${filePath}`);
      });

      console.log(`Successfully updated ${rentals.length} rentals across ${filesWritten} ZIP code files`);
      resolve();

    } catch (err) {
      reject(new Error(`Failed to write CSV: ${err.message}`));
    }
  });
}

/**
 * Update a single rental's social score in the dataset
 * @param {Array} rentals - Array of all rentals
 * @param {string} address - Address of rental to update
 * @param {number} socialScore - New social score
 * @returns {Array} Updated rentals array
 */
function updateRentalSocialScore(rentals, address, socialScore) {
  const rental = rentals.find(r => r.Address === address);
  if (rental) {
    rental['Social Score'] = socialScore;
    console.log(`Updated ${address}: Social Score = ${socialScore}`);
  } else {
    console.warn(`Rental not found: ${address}`);
  }
  return rentals;
}

/**
 * Update a single rental's grocery score in the dataset
 * @param {Array} rentals - Array of all rentals
 * @param {string} address - Address of rental to update
 * @param {number} groceryScore - New grocery score
 * @returns {Array} Updated rentals array
 */
function updateRentalGroceryScore(rentals, address, groceryScore) {
  const rental = rentals.find(r => r.Address === address);
  if (rental) {
    rental['Grocery Score'] = groceryScore;
    console.log(`Updated ${address}: Grocery Score = ${groceryScore}`);
  } else {
    console.warn(`Rental not found: ${address}`);
  }
  return rentals;
}

/**
 * Get rentals by zip code
 * @param {Array} rentals - Array of all rentals
 * @param {string} zipCode - Zip code to filter by
 * @returns {Array} Filtered rentals
 */
function getRentalsByZip(rentals, zipCode) {
  return rentals.filter(r => r['Zip Code'].toString() === zipCode.toString());
}

/**
 * Display rentals in a formatted table (console output)
 * @param {Array} rentals - Array of rentals to display
 */
function displayRentals(rentals) {
  console.log('\n=== Rental Listings ===\n');
  rentals.forEach((rental, index) => {
    console.log(`${index + 1}. ${rental.Address}`);
    console.log(`   Zip: ${rental['Zip Code']} | Price: $${rental['Rental Price']} | Walk: ${rental['Walk Score']} | Social: ${rental['Social Score']}`);
    console.log(`   URL: ${rental.URL}`);
    console.log('');
  });
}

module.exports = {
  readRentalsFromCSV,
  writeRentalsToCSV,
  updateRentalSocialScore,
  updateRentalGroceryScore,
  getRentalsByZip,
  displayRentals,
  CSV_FILE_PATH
};
