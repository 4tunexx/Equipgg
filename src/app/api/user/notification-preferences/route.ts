import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', session.user_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Default preferences if none exist
    const defaultPreferences = {
      email_match_reminders: true,
      push_match_reminders: true,
      email_bet_results: false,
      push_bet_results: true,
      email_level_up: false,
      push_level_up: true,
      email_promotions: true,
      push_promotions: false
    };

    return NextResponse.json({
      success: true,
      preferences: preferences || defaultPreferences
    });

  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();

    const supabase = createServerSupabaseClient();

    // Upsert preferences
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: session.user_id,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Notification preferences POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

