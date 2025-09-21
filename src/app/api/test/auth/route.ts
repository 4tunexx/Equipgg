import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";

export async function GET(req: NextRequest) {
  console.log('=== TEST AUTH ENDPOINT ===');
  
  try {
    const session = await getAuthSession(req);
    console.log('getAuthSession result:', session);
    
    return NextResponse.json({
      success: true,
      session: session,
      cookies: req.headers.get('cookie'),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      cookies: req.headers.get('cookie'),
      timestamp: Date.now()
    });
  }
}