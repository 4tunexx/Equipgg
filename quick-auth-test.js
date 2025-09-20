// Simple test to verify auth endpoints are working
async function quickAuthTest() {
  try {
    console.log('Testing login endpoint...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@equipgg.net', password: 'admin123' })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    console.log('\nTesting register endpoint...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'testuser@equipgg.net', 
        password: 'test123456',
        displayName: 'Test User'
      })
    });
    
    console.log('Register response status:', registerResponse.status);
    const registerData = await registerResponse.json();
    console.log('Register response:', registerData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

quickAuthTest();