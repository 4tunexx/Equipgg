import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== COOKIE PING ENDPOINT ===');
  
  const response = NextResponse.json({ 
    message: 'Setting test cookie',
    timestamp: Date.now()
  });
  
  // Set a test cookie similar to our session format
  const testData = {
    user_id: 'test-user',
    email: 'test@test.com',
    role: 'user',
    expires_at: Date.now() + (60 * 60 * 1000) // 1 hour
  };
  
  // Set both httpOnly and non-httpOnly versions
  response.cookies.set('test_ping_session', encodeURIComponent(JSON.stringify(testData)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
  
  response.cookies.set('test_ping_client', encodeURIComponent(JSON.stringify(testData)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
  
  console.log('Test cookies set');
  
  return response;
}

export async function POST(request: NextRequest) {
  console.log('=== COOKIE PONG ENDPOINT ===');
  
  const cookies = request.cookies;
  const allCookies = cookies.getAll();
  
  console.log('All cookies received:', allCookies);
  
  const pingSession = cookies.get('test_ping_session');
  const pingClient = cookies.get('test_ping_client');
  
  console.log('test_ping_session:', pingSession);
  console.log('test_ping_client:', pingClient);
  
  let sessionData = null;
  let clientData = null;
  
  if (pingSession) {
    try {
      sessionData = JSON.parse(decodeURIComponent(pingSession.value));
    } catch (e) {
      console.log('Failed to parse session cookie:', e);
    }
  }
  
  if (pingClient) {
    try {
      clientData = JSON.parse(decodeURIComponent(pingClient.value));
    } catch (e) {
      console.log('Failed to parse client cookie:', e);
    }
  }
  
  return NextResponse.json({
    allCookies,
    pingSession,
    pingClient,
    parsed: {
      session: sessionData,
      client: clientData
    }
  });
}