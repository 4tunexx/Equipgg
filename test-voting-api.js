const fetch = require('node-fetch');

async function testVotingAPI() {
  try {
    console.log('Testing voting cast API...');
    console.log('Making request to: http://localhost:3000/api/voting/cast');

    const response = await fetch('http://localhost:3000/api/voting/cast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'equipgg_session={"user_id":"8b07e938-1c15-4850-9216-68926bf1b41a","email":"admin@equipgg.net","role":"admin","expires_at":1759685712813}'
      },
      body: JSON.stringify({
        matchId: '44a49036-da94-4d1d-9f20-5a11092b377f',
        prediction: 'team_a'
      })
    });

    console.log('Response received, status:', response.status);
    const result = await response.text();
    console.log('Response body:', result);

  } catch (error) {
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
  }
}

testVotingAPI();