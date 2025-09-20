// Test Steam auth endpoint directly
import fetch from 'node-fetch';

async function testSteamAuth() {
  console.log('Testing Steam auth on www.equipgg.net...');
  try {
    // Test Steam login initiation
    const response = await fetch('https://www.equipgg.net/api/auth/steam?action=login', {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects so we can see what happens
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302 || response.status === 301) {
      console.log('Redirect Location:', response.headers.get('location'));
    }
    
    const text = await response.text();
    console.log('Response preview:', text.substring(0, 300));
    
  } catch (error) {
    console.error('Steam auth test failed:', error.message);
  }
}

// Test if Steam endpoint is working 
await testSteamAuth();