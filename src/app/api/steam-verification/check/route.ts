import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createServerSupabaseClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      // Fallback: assume user needs verification if service is unavailable
      return NextResponse.json({
        needsVerification: true,
        steamVerified: false,
        hasSteamId: false,
        provider: 'default',
        fallback: true
      });
    }
    
    // Fetch fresh user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('steam_verified, steam_id, provider')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      console.error('Error fetching user verification status:', error);
      // Fallback: assume user needs verification if not found
      return NextResponse.json({
        needsVerification: true,
        steamVerified: false,
        hasSteamId: false,
        provider: 'default',
        fallback: true
      });
    }

    // Determine if verification is needed
    const needsVerification = !user.steam_verified && user.provider !== 'steam';
    
    return NextResponse.json({
      needsVerification,
      steamVerified: user.steam_verified || false,
      hasSteamId: !!user.steam_id,
      provider: user.provider || 'default'
    });
    
  } catch (error) {
    console.error('Error checking Steam verification status:', error);
    // Fallback: assume user needs verification on error
    return NextResponse.json({
      needsVerification: true,
      steamVerified: false,
      hasSteamId: false,
      provider: 'default',
      fallback: true
    });
  }
}