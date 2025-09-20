const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthentication() {
  console.log('🧪 Starting comprehensive authentication test...\n');

  try {
    // Test 1: Register new user
    console.log('📝 Test 1: User Registration');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: 'test@equipgg.net',
      password: 'test123456',
      displayName: 'Test User'
    });
    
    if (registerResponse.status === 200) {
      console.log('✅ Registration successful');
      console.log('Response:', registerResponse.data);
    } else {
      console.log('❌ Registration failed:', registerResponse.status);
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ User already exists, continuing with login test...');
    } else {
      console.log('❌ Registration error:', error.response?.data || error.message);
    }
  }

  console.log('');

  try {
    // Test 2: Login existing user
    console.log('🔐 Test 2: User Login');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@equipgg.net',
      password: 'admin123'
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      console.log('User data:', loginResponse.data.user);
      console.log('Session exists:', !!loginResponse.data.session);
      
      // Test protected route
      console.log('\n🛡️ Test 3: Protected Route Access');
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
        headers: {
          'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
        }
      });
      
      if (dashboardResponse.status === 200) {
        console.log('✅ Dashboard access successful');
      } else {
        console.log('❌ Dashboard access failed:', dashboardResponse.status);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.status);
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
  }

  console.log('\n🏁 Authentication test completed');
}

// Wait for server to start
setTimeout(testAuthentication, 3000);