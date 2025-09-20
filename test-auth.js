// Quick test script to verify authentication
import fetch from 'node-fetch';

async function testLogin() {
  try {
    const response = await fetch('https://equipgg-409rljrj6-equipgg.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@equipgg.net',
        password: 'admin123'
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (result.ok) {
      console.log('✅ Login API is working');
    } else {
      console.log('❌ Login failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testLogin();