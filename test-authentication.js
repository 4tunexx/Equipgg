const test = async () => {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Test login with test credentials
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@equipgg.net',
        password: 'test123'
      }),
    });

    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.ok);
      
      // Extract session cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      console.log('Session cookie:', setCookieHeader ? 'Set' : 'Not set');
      
      // Test accessing dashboard
      const dashboardResponse = await fetch('http://localhost:3000/dashboard', {
        headers: {
          'Cookie': setCookieHeader || ''
        }
      });
      
      console.log('Dashboard access status:', dashboardResponse.status);
      
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData.error);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
};

test();