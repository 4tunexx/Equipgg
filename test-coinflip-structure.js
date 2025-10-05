const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/coinflip/lobbies',
  method: 'GET',
  headers: {
    'User-Agent': 'test-script'
  }
};

console.log('Testing coinflip API to see lobby data structure...');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Raw Response:', data);
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
        if (parsed.lobbies && parsed.lobbies.length > 0) {
          console.log('Sample lobby structure:', JSON.stringify(parsed.lobbies[0], null, 2));
        }
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.setTimeout(5000, () => {
  console.log('Request timeout');
  req.destroy();
});

req.end();