/**
 * Test the new Social Score calculation on a single location
 */

const { calculateSocialScore } = require('./placesAPI');

async function testNewSocialScore() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Testing New Multi-Tier Social Score                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Test on a Brooklyn Heights location (should be highly walkable)
  const testLocation = {
    name: 'Brooklyn Heights - 180 Montague St',
    lat: 40.693888,
    lng: -73.991935,
    expectedOldScore: 20
  };

  console.log(`📍 Test Location: ${testLocation.name}`);
  console.log(`   Coordinates: (${testLocation.lat}, ${testLocation.lng})`);
  console.log(`   Old Score: ${testLocation.expectedOldScore}\n`);

  try {
    const newScore = await calculateSocialScore(testLocation.lat, testLocation.lng);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        Test Results                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Old Method Score: ${testLocation.expectedOldScore}`);
    console.log(`New Method Score: ${newScore}`);
    console.log(`Improvement: ${newScore > testLocation.expectedOldScore ? '✅' : '❌'} (${newScore - testLocation.expectedOldScore > 0 ? '+' : ''}${newScore - testLocation.expectedOldScore})\n`);

    if (newScore > testLocation.expectedOldScore) {
      console.log('✨ Success! The new method provides better differentiation.');
      console.log('🚀 You can now run: node fixSocialScores.js\n');
    } else {
      console.log('⚠️  New score is not higher. This might be normal if the area is not very dense.');
      console.log('   The key is that different locations will now have DIFFERENT scores.\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Check your .env file and ensure GOOGLE_PLACES_API_KEY is set correctly.\n');
    process.exit(1);
  }
}

testNewSocialScore();
