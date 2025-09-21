import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== CLEAR COOKIES ENDPOINT ===');
  
  const response = NextResponse.json({ 
    message: 'Clearing all test cookies',
    timestamp: Date.now()
  });
  
  // Clear test cookies
  response.cookies.set('test_simple', '', {
    httpOnly: false,
    maxAge: 0,
    path: '/'
  });
  
  response.cookies.set('test_httponly', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/'
  });
  
  response.cookies.set('test_session_client', '', {
    httpOnly: false,
    maxAge: 0,
    path: '/'
  });
  
  console.log('Test cookies cleared');
  
  return response;
}