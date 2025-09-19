import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { repairCorruptedSession } from "../../../../lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'No cookies found' }, { status: 400 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token found' }, { status: 400 });
    }

    console.log('Attempting to repair session:', sessionToken.substring(0, 8) + '...');
    
    const repairedSession = await repairCorruptedSession(sessionToken);
    
    if (repairedSession) {
      console.log('Session repaired successfully for user:', repairedSession.email);
      return NextResponse.json({ 
        success: true, 
        message: 'Session repaired successfully',
        user: {
          id: repairedSession.user_id,
          email: repairedSession.email,
          role: repairedSession.role
        }
      });
    } else {
      console.log('Session repair failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Session repair failed' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Session repair error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

