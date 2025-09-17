import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { newToken } = await request.json();
    
    if (!newToken) {
      return NextResponse.json({ error: 'New token is required' }, { status: 400 });
    }
    
    // Create response with the new session cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session cookie updated successfully',
      token: newToken
    });
    
    // Set the new session cookie
    response.cookies.set('equipgg_session', newToken, {
      path: '/',
      maxAge: 86400, // 24 hours
      httpOnly: false, // Allow client-side access for verification
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('Error updating session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to update session cookie' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('equipgg_session')?.value || 'No session cookie found';
    
    return NextResponse.json({ 
      currentToken,
      message: 'Current session token retrieved'
    });
  } catch (error) {
    console.error('Error getting session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to get session cookie' }, 
      { status: 500 }
    );
  }
}