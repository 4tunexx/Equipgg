// Test admin login flow
const testLogin = async () => {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@equipgg.net',
        password: 'admin123'
      }),
    });

    const data = await response.json();
    console.log('Login response:', {
      ok: response.ok,
      status: response.status,
      hasSession: !!data.session,
      hasUser: !!data.user,
      userRole: data.user?.role,
      userId: data.user?.id
    });

    if (data.session) {
      console.log('Session info:', {
        accessToken: data.session.access_token ? '✓ Present' : '✗ Missing',
        refreshToken: data.session.refresh_token ? '✓ Present' : '✗ Missing',
        expiresAt: data.session.expires_at,
        tokenType: data.session.token_type
      });
    }

    return data;
  } catch (error) {
    console.error('Login test failed:', error);
  }
};

testLogin();