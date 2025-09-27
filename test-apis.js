const fetch = require('node-fetch');

async function testAPIs() {
  const baseUrl = 'http://localhost:3001';

  console.log('Testing API endpoints...\n');

  // Test public endpoints first
  try {
    console.log('Testing /api/crates...');
    const cratesResponse = await fetch(`${baseUrl}/api/crates`);
    console.log(`Status: ${cratesResponse.status}`);
    if (cratesResponse.ok) {
      const data = await cratesResponse.json();
      console.log(`✓ Crates API working - ${data.crates?.length || 0} crates found`);
    } else {
      console.log(`✗ Crates API failed: ${cratesResponse.statusText}`);
    }
  } catch (error) {
    console.log(`✗ Crates API error: ${error.message}`);
  }

  // Test authenticated endpoints (will likely fail without auth, but should not be 500)
  try {
    console.log('\nTesting /api/admin/ranks...');
    const ranksResponse = await fetch(`${baseUrl}/api/admin/ranks`);
    console.log(`Status: ${ranksResponse.status}`);
    if (ranksResponse.status === 401) {
      console.log('✓ Ranks API working - Authentication required (expected)');
    } else if (ranksResponse.status === 500) {
      console.log('✗ Ranks API failed with 500 error');
    } else {
      console.log(`? Ranks API returned status ${ranksResponse.status}`);
    }
  } catch (error) {
    console.log(`✗ Ranks API error: ${error.message}`);
  }

  try {
    console.log('\nTesting /api/missions...');
    const missionsResponse = await fetch(`${baseUrl}/api/missions`);
    console.log(`Status: ${missionsResponse.status}`);
    if (missionsResponse.status === 401) {
      console.log('✓ Missions API working - Authentication required (expected)');
    } else if (missionsResponse.status === 500) {
      console.log('✗ Missions API failed with 500 error');
    } else {
      console.log(`? Missions API returned status ${missionsResponse.status}`);
    }
  } catch (error) {
    console.log(`✗ Missions API error: ${error.message}`);
  }

  try {
    console.log('\nTesting /api/missions/progress...');
    const progressResponse = await fetch(`${baseUrl}/api/missions/progress`);
    console.log(`Status: ${progressResponse.status}`);
    if (progressResponse.status === 401) {
      console.log('✓ Mission Progress API working - Authentication required (expected)');
    } else if (progressResponse.status === 500) {
      console.log('✗ Mission Progress API failed with 500 error');
    } else {
      console.log(`? Mission Progress API returned status ${progressResponse.status}`);
    }
  } catch (error) {
    console.log(`✗ Mission Progress API error: ${error.message}`);
  }

  console.log('\nAPI testing completed.');
}

testAPIs().catch(console.error);