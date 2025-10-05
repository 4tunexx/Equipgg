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

console.log('Testing coinflip API...');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
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