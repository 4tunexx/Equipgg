import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Create session data for the existing user
  const sessionData = {
    user_id: 'steam-76561198001993310',
    email: '76561198001993310@steam.local',
    role: 'user',
    expires_at: Date.now() + (60 * 60 * 24 * 7 * 1000) // 7 days from now
  };

  console.log('Setting test session cookie:', sessionData);

  // Create response that redirects to dashboard
  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  // Set the session cookie exactly like Steam auth does
  response.cookies.set('equipgg_session', encodeURIComponent(JSON.stringify(sessionData)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });

  // Also set a client-readable session cookie for the AuthProvider
  response.cookies.set('equipgg_session_client', encodeURIComponent(JSON.stringify(sessionData)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });

  // Also set user-friendly cookies for client-side access
  response.cookies.set('equipgg_user_id', 'steam-76561198001993310', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });

  response.cookies.set('equipgg_user_email', '76561198001993310@steam.local', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });

  return response;
}