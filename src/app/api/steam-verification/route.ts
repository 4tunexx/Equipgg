import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's Steam verification status
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, steam_verified, steam_id, account_status')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      steam_verified: user.steam_verified || false,
      has_steam_id: !!user.steam_id,
      account_status: user.account_status || 'active'
    });

  } catch (error) {
    console.error('Error checking Steam verification:', error);
    // Fallback response on error
    return NextResponse.json({ 
      steam_verified: false,
      has_steam_id: false,
      account_status: 'active',
      fallback: true
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, force = false } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (force) {
      // Admin function to force verify a user (for testing)
      const { error } = await supabase
        .from('users')
        .update({ 
          steam_verified: true,
          account_status: 'active'
        })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: 'Failed to force verify user' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User forcefully verified' 
      });
    }

    return NextResponse.json({ 
      error: 'Invalid operation' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in Steam verification API:', error);
    return NextResponse.json({ 
      error: "Failed to process verification" 
    }, { status: 500 });
  }
}