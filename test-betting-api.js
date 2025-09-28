const fetch = require('node-fetch');

async function testBettingAPI() {
  try {
    console.log('Testing betting place API...');

    const response = await fetch('http://localhost:3001/api/betting/place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'equipgg_session={"user_id":"8b07e938-1c15-4850-9216-68926bf1b41a","email":"admin@equipgg.net","role":"admin","expires_at":1759685712813}'
      },
      body: JSON.stringify({
        matchId: '44a49036-da94-4d1d-9f20-5a11092b377f',
        teamChoice: 'team_a',
        amount: 100
      })
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);

  } catch (error) {
    console.error('Error testing betting API:', error.message);
  }
}

testBettingAPI();