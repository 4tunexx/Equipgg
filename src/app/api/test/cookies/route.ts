import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== COOKIE TEST ENDPOINT ===');
  
  const response = NextResponse.json({ 
    message: 'Testing cookie setting',
    timestamp: Date.now()
  });
  
  // Test setting various cookies
  console.log('Setting test cookies...');
  
  // Test 1: Simple cookie
  response.cookies.set('test_simple', 'simple_value', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
  
  // Test 2: HttpOnly cookie
  response.cookies.set('test_httponly', 'httponly_value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
  
  // Test 3: Session-like cookie (similar to equipgg_session_client)
  const testSessionData = {
    user_id: 'test-user-123',
    email: 'test@example.com',
    role: 'user',
    expires_at: Date.now() + (60 * 60 * 1000) // 1 hour from now
  };
  
  response.cookies.set('test_session_client', encodeURIComponent(JSON.stringify(testSessionData)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
  
  console.log('Test cookies set successfully');
  console.log('Test session data:', testSessionData);
  
  return response;
}