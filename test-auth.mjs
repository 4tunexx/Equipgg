// Quick test script to verify authentication
import fetch from 'node-fetch';

async function testLogin() {
  console.log('Testing login endpoint...');
  try {
    const response = await fetch('https://equipgg-409rljrj6-equipgg.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Login test failed:', error.message);
  }
}

async function testSteamAuth() {
  console.log('\nTesting Steam auth endpoint...');
  try {
    const response = await fetch('https://equipgg-409rljrj6-equipgg.vercel.app/api/auth/steam?action=login');
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response preview:', text.substring(0, 200));
  } catch (error) {
    console.error('Steam auth test failed:', error.message);
  }
}

// Run tests
await testLogin();
await testSteamAuth();
console.log('\nTests completed!');