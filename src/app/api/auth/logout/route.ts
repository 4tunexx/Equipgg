import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to logout' }, { status: 500 });
    }

    // Create response and clear ALL session cookies
    const response = NextResponse.json({ ok: true });
    
    // Clear main session cookie
    response.cookies.set('equipgg_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    // Clear Steam session cookies
    response.cookies.set('equipgg_steam_session', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    response.cookies.set('equipgg_steam_email', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}


