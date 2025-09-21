import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== DEBUG SESSION ENDPOINT ===');
  
  // Get all cookies
  const cookies = request.cookies;
  console.log('All cookies:', cookies.getAll());
  
  // Check specific session cookies
  const sessionCookie = cookies.get('equipgg_session');
  const clientCookie = cookies.get('equipgg_session_client');
  const testCookie = cookies.get('test_session_client');
  
  console.log('equipgg_session cookie:', sessionCookie);
  console.log('equipgg_session_client cookie:', clientCookie);
  console.log('test_session_client cookie:', testCookie);
  
  let sessionData = null;
  let clientData = null;
  let testData = null;
  
  if (sessionCookie) {
    try {
      sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
      console.log('Parsed session data:', sessionData);
    } catch (e) {
      console.log('Failed to parse session cookie:', e);
    }
  }
  
  if (clientCookie) {
    try {
      clientData = JSON.parse(decodeURIComponent(clientCookie.value));
      console.log('Parsed client data:', clientData);
    } catch (e) {
      console.log('Failed to parse client cookie:', e);
    }
  }
  
  if (testCookie) {
    try {
      testData = JSON.parse(decodeURIComponent(testCookie.value));
      console.log('Parsed test data:', testData);
    } catch (e) {
      console.log('Failed to parse test cookie:', e);
    }
  }
  
  // Check request headers
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  return NextResponse.json({
    status: 'debug',
    cookies: {
      all: cookies.getAll(),
      session: sessionCookie,
      client: clientCookie,
      test: testCookie
    },
    parsed: {
      session: sessionData,
      client: clientData,
      test: testData
    },
    headers: Object.fromEntries(request.headers.entries())
  });
}