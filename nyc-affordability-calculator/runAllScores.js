/**
 * Run all scoring updates in sequence
 * This ensures all scores are calculated without conflicts
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runAllScores() {
  console.log('\n=== Running All Score Updates ===\n');

  try {
    // Run Grocery Scores
    console.log('Starting Grocery Score updates...\n');
    await execPromise('node updateGroceryScores.js');
    console.log('\n✓ Grocery Scores Complete\n');

    // Run Daily Living Scores
    console.log('Starting Daily Living Score updates...\n');
    await execPromise('node updateDailyLivingScores.js');
    console.log('\n✓ Daily Living Scores Complete\n');

    console.log('=== All Scores Updated Successfully ===\n');
  } catch (error) {
    console.error('Error running score updates:', error);
    process.exit(1);
  }
}

runAllScores();
