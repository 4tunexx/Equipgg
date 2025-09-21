const http = require('http');

// Test the user bets API with authentication
async function testUserBets() {
  console.log('Testing user bets API...');

  try {
    // First, try without authentication (should get 401)
    console.log('\n1. Testing without authentication...');
    const unauthResponse = await makeRequest('/api/betting/user-bets', 'GET');
    console.log('Response without auth:', unauthResponse.statusCode, unauthResponse.data);

    // Then, test the authentication endpoint to get session
    console.log('\n2. Testing with admin login...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@equipgg.net',
      password: 'admin123'
    });
    console.log('Login response:', loginResponse.statusCode);

    if (loginResponse.statusCode === 200) {
      // Extract cookies from login response
      const cookies = loginResponse.headers['set-cookie'];
      console.log('Received cookies:', cookies ? 'Yes' : 'No');

      // Now test with authentication
      console.log('\n3. Testing user bets with authentication...');
      const authResponse = await makeRequest('/api/betting/user-bets', 'GET', null, cookies);
      console.log('Response with auth:', authResponse.statusCode);
      console.log('Response data:', authResponse.data);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

function makeRequest(path, method = 'GET', data = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (cookies) {
      options.headers['Cookie'] = Array.isArray(cookies) ? cookies.join('; ') : cookies;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

testUserBets();