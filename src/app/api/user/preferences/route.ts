import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';

// User Preferences API
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    let query = supabase
      .from('user_preferences')
      .select('preference_key, preference_value')
      .eq('user_id', session.user_id);

    if (key) {
      query = query.eq('preference_key', key);
    }

    const { data: preferences, error } = await query;

    if (error) {
      console.error('User preferences error:', error);
      return NextResponse.json({ success: true, preferences: {} });
    }

    // Convert array to object
    const preferencesObj = (preferences || []).reduce((acc: any, pref: any) => {
      acc[pref.preference_key] = pref.preference_value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      preferences: preferencesObj
    });

  } catch (error) {
    console.error('User preferences API error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json({ 
        error: 'Preference key is required' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user_id,
        preference_key: key,
        preference_value: value,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Update preference error:', error);
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preference updated successfully'
    });

  } catch (error) {
    console.error('Update preference API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ 
        error: 'Preference key is required' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', session.user_id)
      .eq('preference_key', key);

    if (error) {
      console.error('Delete preference error:', error);
      return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preference deleted successfully'
    });

  } catch (error) {
    console.error('Delete preference API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
