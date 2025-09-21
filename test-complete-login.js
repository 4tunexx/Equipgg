// Complete login flow test
const testCompleteLoginFlow = async () => {
  console.log('🧪 Starting complete login flow test...');
  
  try {
    // Step 1: Test login API
    console.log('Step 1: Testing login API...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@equipgg.net',
        password: 'admin123'
      }),
      credentials: 'include'
    });

    const loginData = await loginResponse.json();
    console.log('Login API result:', {
      ok: loginResponse.ok,
      status: loginResponse.status,
      hasSession: !!loginData.session,
      hasUser: !!loginData.user,
      userRole: loginData.user?.role,
      cookies: loginResponse.headers.get('set-cookie')
    });

    if (!loginResponse.ok) {
      console.error('❌ Login API failed');
      return;
    }

    // Step 2: Test /api/me to verify session
    console.log('\nStep 2: Testing session verification...');
    const meResponse = await fetch('http://localhost:3000/api/me', {
      method: 'GET',
      credentials: 'include'
    });

    const meData = await meResponse.json();
    console.log('Session verification result:', {
      ok: meResponse.ok,
      status: meResponse.status,
      hasUser: !!meData.user,
      userRole: meData.user?.role
    });

    // Step 3: Test dashboard access
    console.log('\nStep 3: Testing dashboard access...');
    const dashboardResponse = await fetch('http://localhost:3000/dashboard', {
      method: 'GET',
      credentials: 'include'
    });

    console.log('Dashboard access result:', {
      ok: dashboardResponse.ok,
      status: dashboardResponse.status,
      contentType: dashboardResponse.headers.get('content-type')
    });

    console.log('\n✅ Login flow test completed');

  } catch (error) {
    console.error('❌ Login flow test failed:', error);
  }
};

testCompleteLoginFlow();