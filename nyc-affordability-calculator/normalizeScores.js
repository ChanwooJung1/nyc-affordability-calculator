/**
 * Normalize all scores to 0-100 scale
 * Fixes rental listings and aggregate scores
 */

const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

// Get all CSV files
const files = fs.readdirSync('.').filter(f => f.endsWith(' Rental Listings.csv'));

console.log(`Found ${files.length} rental listing files to normalize\n`);

// Track max scores across all files
let maxScores = {
  transit: 0,
  social: 0,
  grocery: 0
};

// First pass: find the maximum values
files.forEach(file => {
  const csvContent = fs.readFileSync(file, 'utf8');
  const result = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  result.data.forEach(rental => {
    maxScores.transit = Math.max(maxScores.transit, rental['Transit Score'] || 0);
    maxScores.social = Math.max(maxScores.social, rental['Social Score'] || 0);
    maxScores.grocery = Math.max(maxScores.grocery, rental['Grocery Score'] || 0);
  });
});

console.log('Current maximum scores:', maxScores);
console.log('\nNormalizing all scores to 0-100...\n');

// Second pass: normalize all scores
let totalRentals = 0;
files.forEach(file => {
  const csvContent = fs.readFileSync(file, 'utf8');
  const result = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  // Normalize each rental's scores
  const normalized = result.data.map(rental => {
    return {
      ...rental,
      'Transit Score': Math.round((rental['Transit Score'] || 0) / maxScores.transit * 100),
      'Social Score': Math.round((rental['Social Score'] || 0) / maxScores.social * 100),
      'Grocery Score': Math.round((rental['Grocery Score'] || 0) / maxScores.grocery * 100)
    };
  });

  // Write back to file
  const csv = Papa.unparse(normalized, { header: true });
  fs.writeFileSync(file, csv, 'utf8');

  totalRentals += normalized.length;
  console.log(`✓ Normalized ${file}: ${normalized.length} rentals`);
});

console.log(`\n✅ Successfully normalized ${totalRentals} rentals across ${files.length} files`);
console.log('All scores are now on a 0-100 scale\n');

// Also normalize the aggregate scores file
const aggFile = 'nyc_affordability_scores.csv';
if (fs.existsSync(aggFile)) {
  const csvContent = fs.readFileSync(aggFile, 'utf8');
  const result = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  // Find max scores in aggregate data
  const aggMaxScores = {
    transit: Math.max(...result.data.map(r => r.transit_score || 0)),
    social: Math.max(...result.data.map(r => r.social_score || 0)),
    grocery: Math.max(...result.data.map(r => r.grocery_score || 0)),
    housing: Math.max(...result.data.map(r => r.housing_score || 0)),
    overall: Math.max(...result.data.map(r => r.overall_score || 0))
  };

  console.log('Aggregate max scores before normalization:', aggMaxScores);

  // Normalize aggregate scores
  const normalizedAgg = result.data.map(row => {
    const transit = row.transit_score ? Math.round(row.transit_score / aggMaxScores.transit * 100) : 0;
    const social = row.social_score ? Math.round(row.social_score / aggMaxScores.social * 100) : 0;
    const grocery = row.grocery_score ? Math.round(row.grocery_score / aggMaxScores.grocery * 100) : 0;
    const housing = row.housing_score ? Math.round(row.housing_score / aggMaxScores.housing * 100) : 0;

    // Recalculate overall score as weighted average (60/20/10/10)
    const overall = Math.round(
      housing * 0.6 +
      transit * 0.2 +
      social * 0.1 +
      grocery * 0.1
    );

    return {
      ...row,
      housing_score: housing,
      transit_score: transit,
      social_score: social,
      grocery_score: grocery,
      overall_score: overall
    };
  });

  const aggCsv = Papa.unparse(normalizedAgg, { header: true });
  fs.writeFileSync(aggFile, aggCsv, 'utf8');
  console.log(`✓ Normalized ${aggFile}: ${normalizedAgg.length} ZIP codes\n`);
}

console.log('🎉 All done! Scores are now properly scaled 0-100');
