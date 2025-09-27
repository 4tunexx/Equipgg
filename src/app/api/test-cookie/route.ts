import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ message: 'Cookie test endpoint' });
  
  // Set a test cookie
  response.cookies.set('test_cookie', 'test_value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
  
  // Set a client-readable test cookie
  response.cookies.set('test_cookie_client', 'test_value_client', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
  
  console.log('Test cookies set');
  return response;
}

export async function POST(request: NextRequest) {
  const cookies = request.headers.get('cookie');
  console.log('Received cookies:', cookies);
  
  const testCookie = request.cookies.get('test_cookie');
  const testClientCookie = request.cookies.get('test_cookie_client');
  
  console.log('test_cookie:', testCookie);
  console.log('test_cookie_client:', testClientCookie);
  
  return NextResponse.json({
    test_cookie: testCookie?.value,
    test_cookie_client: testClientCookie?.value,
    all_cookies: cookies
  });
}