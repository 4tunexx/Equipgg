const fetch = require('node-fetch');

async function testPerksAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/user/perks', {
      method: 'GET',
      headers: {
        'Cookie': 'equipgg_session_client=%7B%22user_id%22%3A%22steam-76561198001993310%22%2C%22email%22%3A%2276561198001993310%40steam.local%22%2C%22role%22%3A%22user%22%2C%22provider%22%3A%22steam%22%2C%22avatarUrl%22%3A%22https%3A%2F%2Favatars.steamstatic.com%2Fef51ab8508a2b715278ea19b6b82d6ebf33675ce_full.jpg%22%2C%22steamProfile%22%3A%7B%22steamId%22%3A%2276561198001993310%22%2C%22avatar%22%3A%22https%3A%2F%2Favatars.steamstatic.com%2Fef51ab8508a2b715278ea19b6b82d6ebf33675ce_full.jpg%22%7D%2C%22steamVerified%22%3Atrue%2C%22displayName%22%3A%2242une%22%2C%22expires_at%22%3A1759604525682%7D'
      }
    });

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testPerksAPI();